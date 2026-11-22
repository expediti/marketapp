import {
  getCashfreeCredentials,
  getServerRuntimeSecret,
  verifyCashfreeWebhookSignature,
  triggerCashfreeEasySplitSettlement,
} from '@/lib/server/cashfree';
import {
  IPaymentProvider,
  PaymentOrderParams,
  PaymentOrderResult,
  PaymentVerificationParams,
  PaymentVerificationResult,
  PaymentSplitParams,
  PaymentSplitResult,
  PaymentWebhookResult,
  PaymentStatusResult,
  SettlementStatusResult,
  RefundResult,
} from './types';

/**
 * Cashfree Payments & Easy Split Adapter
 * 
 * Supports two-instalment campaign orders and Cashfree Easy Split vendor allocation.
 * Safe for Cloudflare Worker environment (100% Web Crypto & Fetch API).
 * Credentials never exposed to client.
 */
export class CashfreePaymentProvider implements IPaymentProvider {
  readonly providerName = 'cashfree';

  isConfigured(): boolean {
    return Boolean(getCashfreeCredentials());
  }

  getPublicConfig(): Record<string, string> {
    const creds = getCashfreeCredentials();
    return {
      provider: this.providerName,
      environment: creds ? creds.environment.toLowerCase() : 'sandbox',
      appId: creds?.appId || '',
      isConfigured: String(this.isConfigured()),
    };
  }

  private getHeaders(): Record<string, string> {
    const creds = getCashfreeCredentials();
    if (!creds) {
      throw new Error(
        'Cashfree credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured on the server.'
      );
    }

    return {
      'Content-Type': 'application/json',
      'x-client-id': creds.appId,
      'x-client-secret': creds.secretKey,
      'x-api-version': creds.apiVersion,
    };
  }

  private getBaseUrl(): string {
    const creds = getCashfreeCredentials();
    return creds?.baseUrl || 'https://sandbox.cashfree.com/pg';
  }

  /**
   * Creates a Cashfree Payment Order with Easy Split instruction.
   */
  async createPaymentOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    const creds = getCashfreeCredentials();
    if (!creds) {
      throw new Error(
        'Cashfree credentials not configured. Please configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY in server secrets.'
      );
    }

    const orderAmountInRupees = Math.round((params.amountInPaise / 100) * 100) / 100;
    const stageSuffix = params.instalmentType.toLowerCase();
    const cleanNumber = params.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '');
    const cashfreeOrderId = `${cleanNumber}_${stageSuffix}_${Date.now().toString(36)}`;

    // Easy Split specification (if vendor ID is provided for creator)
    const orderSplits: Array<{ vendor_id: string; amount: number }> = [];
    if (params.splitDetails?.creatorVendorId && params.splitDetails.creatorAmountInPaise > 0) {
      const creatorAmount = Math.round((params.splitDetails.creatorAmountInPaise / 100) * 100) / 100;
      orderSplits.push({
        vendor_id: params.splitDetails.creatorVendorId,
        amount: creatorAmount,
      });
    }

    const appUrl = getServerRuntimeSecret('NEXT_PUBLIC_APP_URL') || 'https://marketmyidea.online';

    const payload: Record<string, any> = {
      order_id: cashfreeOrderId,
      order_amount: orderAmountInRupees,
      order_currency: params.currency || 'INR',
      customer_details: {
        customer_id: params.customer.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
        customer_email: params.customer.email || 'customer@marketmyidea.online',
        customer_phone: params.customer.phone || '9999999999',
        customer_name: params.customer.name || 'Business Partner',
      },
      order_meta: {
        return_url: `${appUrl}/orders/${params.orderId}?cf_order_id={order_id}`,
      },
      order_note: `Campaign Order #${params.orderNumber} (${params.instalmentType} 50%)`,
      order_tags: {
        order_id: params.orderId,
        order_number: params.orderNumber,
        instalment_type: params.instalmentType,
        ...params.notes,
      },
    };

    if (orderSplits.length > 0) {
      payload.order_splits = orderSplits;
    }

    const response = await fetch(`${this.getBaseUrl()}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.message || data?.error_description || 'Failed to create Cashfree order';

      // Resilience: If Easy Split vendor is pending or not found on Cashfree, retry without order_splits
      // so the business owner's checkout is never blocked and funds are safely collected in platform escrow.
      if (orderSplits.length > 0 && (errorMsg.toLowerCase().includes('vendor') || response.status === 400)) {
        console.warn('Retrying Cashfree order creation without order_splits due to vendor setup status:', errorMsg);
        delete payload.order_splits;
        const retryRes = await fetch(`${this.getBaseUrl()}/orders`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });

        const retryData = await retryRes.json().catch(() => ({}));
        if (retryRes.ok && retryData.payment_session_id) {
          return {
            provider: this.providerName,
            providerOrderId: retryData.order_id,
            paymentSessionId: retryData.payment_session_id,
            amountInPaise: params.amountInPaise,
            currency: retryData.order_currency || 'INR',
            instalmentType: params.instalmentType,
            rawResponse: retryData,
          };
        }
      }

      throw new Error(`Cashfree Order Creation Failed: ${errorMsg}`);
    }

    // If order created but splits weren't attached at creation and we have split details,
    // attach split rule via Easy Split Order Split API
    if (orderSplits.length > 0 && !data.order_splits) {
      try {
        await fetch(`${this.getBaseUrl()}/easy-split/orders/${encodeURIComponent(cashfreeOrderId)}/split`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ split: orderSplits }),
        });
      } catch (splitErr) {
        console.warn('Notice attaching Easy Split rule to Cashfree order:', splitErr);
      }
    }

    return {
      provider: this.providerName,
      providerOrderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      amountInPaise: params.amountInPaise,
      currency: params.currency,
      instalmentType: params.instalmentType,
      checkoutUrl: data.payment_link || undefined,
      rawResponse: data,
    };
  }

  /**
   * Verifies payment status directly with Cashfree Orders & Payments API.
   * Edge-safe via standard fetch.
   */
  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree credentials not configured on the server.');
    }

    // 1. Check order status on Cashfree
    const orderRes = await fetch(
      `${this.getBaseUrl()}/orders/${encodeURIComponent(params.providerOrderId)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const orderData = await orderRes.json().catch(() => ({}));
    const isOrderPaid = orderRes.ok && orderData.order_status === 'PAID';

    // 2. Fetch payments list for this order
    const paymentsRes = await fetch(
      `${this.getBaseUrl()}/orders/${encodeURIComponent(params.providerOrderId)}/payments`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const paymentsList = await paymentsRes.json().catch(() => []);

    // Find successful payment
    const successPayment = Array.isArray(paymentsList)
      ? paymentsList.find(
        (p: any) => p.payment_status === 'SUCCESS' || p.payment_status === 'CAPTURED'
      )
      : null;

    if (!isOrderPaid && !successPayment) {
      return {
        isVerified: false,
        status: 'PENDING',
        providerPaymentId: params.providerPaymentId || '',
        providerOrderId: params.providerOrderId,
        amountInPaise: 0,
        verifiedAt: new Date().toISOString(),
        rawResponse: { order: orderData, payments: paymentsList },
      };
    }

    const paymentAmount = successPayment?.payment_amount || orderData.order_amount;
    const amountInPaise = Math.round(Number(paymentAmount) * 100);
    const paymentId = String(
      successPayment?.cf_payment_id ||
      successPayment?.payment_id ||
      params.providerPaymentId ||
      params.providerOrderId
    );

    return {
      isVerified: true,
      status: 'PAID',
      providerPaymentId: paymentId,
      providerOrderId: params.providerOrderId,
      amountInPaise,
      paymentMethod: successPayment?.payment_group || successPayment?.payment_method || 'CASHFREE',
      verifiedAt: successPayment?.payment_time || new Date().toISOString(),
      rawResponse: successPayment || orderData,
    };
  }

  /**
   * Verifies and processes Cashfree webhook signatures using Web Crypto API.
   * Edge-safe.
   */
  async processWebhook(
    rawBody: string,
    headers: Record<string, string | null>
  ): Promise<PaymentWebhookResult> {
    const creds = getCashfreeCredentials();
    const signature = headers['x-webhook-signature'];
    const timestamp = headers['x-webhook-timestamp'];

    const isSignatureValid = creds
      ? await verifyCashfreeWebhookSignature(rawBody, signature, timestamp, creds.webhookSecret)
      : false;

    let parsedEvent: any = {};
    try {
      parsedEvent = JSON.parse(rawBody);
    } catch {
      return { isVerified: false, eventType: 'UNKNOWN' };
    }

    const eventType = parsedEvent?.type || parsedEvent?.event || 'UNKNOWN';
    const orderData = parsedEvent?.data?.order;
    const paymentData = parsedEvent?.data?.payment;

    const providerOrderId = orderData?.order_id || paymentData?.order_id;
    const providerPaymentId = paymentData?.cf_payment_id || paymentData?.payment_id;
    const paymentStatus = paymentData?.payment_status;

    let status: 'PAID' | 'FAILED' | 'PENDING' = 'PENDING';
    if (
      paymentStatus === 'SUCCESS' ||
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'PAYMENT_SUCCESS'
    ) {
      status = 'PAID';
    } else if (
      paymentStatus === 'FAILED' ||
      paymentStatus === 'USER_DROPPED' ||
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK'
    ) {
      status = 'FAILED';
    }

    const tags = orderData?.order_tags || {};

    return {
      isVerified: isSignatureValid,
      eventType,
      providerOrderId,
      providerPaymentId: providerPaymentId ? String(providerPaymentId) : undefined,
      orderId: tags.order_id,
      instalmentType: tags.instalment_type as any,
      status,
      amountInPaise: paymentData?.payment_amount
        ? Math.round(Number(paymentData.payment_amount) * 100)
        : orderData?.order_amount
          ? Math.round(Number(orderData.order_amount) * 100)
          : undefined,
      rawEvent: parsedEvent,
    };
  }

  /**
   * Cashfree Easy Split post-payment split instruction.
   */
  async createSplit(params: PaymentSplitParams): Promise<PaymentSplitResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree credentials not configured.');
    }

    const splitsPayload = params.splits.map((s) => ({
      vendor_id: s.vendorId,
      amount: Math.round((s.amountInPaise / 100) * 100) / 100,
    }));

    const response = await fetch(
      `${this.getBaseUrl()}/easy-split/orders/${encodeURIComponent(params.providerPaymentId)}/split`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ split: splitsPayload }),
      }
    );

    const data = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      providerSplitReference: data.split_id || `cf_split_${Date.now()}`,
      splits: params.splits.map((s) => ({
        vendorId: s.vendorId,
        role: s.role,
        amountInPaise: s.amountInPaise,
        splitStatus: response.ok ? 'COMPLETED' : 'FAILED',
        reference: data.split_id,
      })),
      rawResponse: data,
    };
  }

  /**
   * Look up order status directly from Cashfree.
   */
  async getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree credentials not configured.');
    }

    const response = await fetch(`${this.getBaseUrl()}/orders/${encodeURIComponent(providerOrderId)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Failed to lookup Cashfree order: ${data?.message || 'Error'}`);
    }

    let status: 'PAID' | 'PENDING' | 'FAILED' = 'PENDING';
    if (data.order_status === 'PAID') status = 'PAID';
    else if (data.order_status === 'EXPIRED' || data.order_status === 'TERMINATED') status = 'FAILED';

    return {
      status,
      amountInPaise: Math.round(Number(data.order_amount) * 100),
      currency: data.order_currency || 'INR',
    };
  }

  /**
   * Look up Cashfree Easy Split vendor settlement status.
   */
  async getSettlementStatus(splitReference: string): Promise<SettlementStatusResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree credentials not configured.');
    }

    const response = await fetch(
      `${this.getBaseUrl()}/easy-split/settlements/${encodeURIComponent(splitReference)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      return {
        settlementStatus: 'UNSETTLED',
      };
    }

    const data = await response.json().catch(() => ({}));
    let status: 'SETTLED' | 'UNSETTLED' | 'FAILED' | 'ON_HOLD' = 'UNSETTLED';
    if (data.status === 'SETTLED') status = 'SETTLED';
    else if (data.status === 'FAILED') status = 'FAILED';
    else if (data.status === 'ON_HOLD') status = 'ON_HOLD';

    return {
      settlementStatus: status,
      settledAmountInPaise: data.amount ? Math.round(Number(data.amount) * 100) : undefined,
      settledAt: data.settled_at || undefined,
      utrNumber: data.utr || undefined,
      failureReason: data.failure_reason || undefined,
    };
  }

  /**
   * Cashfree refund initiation.
   */
  async initiateRefund(params: {
    paymentId: string;
    amountInPaise: number;
    reason: string;
  }): Promise<RefundResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree credentials not configured.');
    }

    const refundAmountInRupees = Math.round((params.amountInPaise / 100) * 100) / 100;
    const refundId = `rfnd_${Date.now().toString(36)}`;

    const response = await fetch(
      `${this.getBaseUrl()}/orders/${encodeURIComponent(params.paymentId)}/refunds`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          refund_id: refundId,
          refund_amount: refundAmountInRupees,
          refund_note: params.reason,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Cashfree Refund Failed: ${data?.message || 'Error'}`);
    }

    return {
      refundId: data.refund_id || refundId,
      status: data.refund_status === 'SUCCESS' ? 'PROCESSED' : 'PENDING',
      amountInPaise: params.amountInPaise,
    };
  }
}
