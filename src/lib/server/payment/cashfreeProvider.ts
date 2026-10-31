import crypto from 'node:crypto';
import { getServerRuntimeSecret } from '@/lib/server/razorpay';
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
 * Safe for Cloudflare Worker environment. Credentials never exposed to client.
 */
export class CashfreePaymentProvider implements IPaymentProvider {
  readonly providerName = 'cashfree';

  private getAppId(): string | undefined {
    return (
      getServerRuntimeSecret('CASHFREE_APP_ID') ||
      getServerRuntimeSecret('NEXT_PUBLIC_CASHFREE_APP_ID')
    );
  }

  private getSecretKey(): string | undefined {
    return getServerRuntimeSecret('CASHFREE_SECRET_KEY');
  }

  private getWebhookSecret(): string | undefined {
    return (
      getServerRuntimeSecret('CASHFREE_WEBHOOK_SECRET') ||
      getServerRuntimeSecret('CASHFREE_SECRET_KEY')
    );
  }

  private getEnvironment(): 'SANDBOX' | 'PRODUCTION' {
    const env = getServerRuntimeSecret('CASHFREE_ENVIRONMENT')?.toUpperCase();
    return env === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
  }

  private getBaseUrl(): string {
    return this.getEnvironment() === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  isConfigured(): boolean {
    const appId = this.getAppId();
    const secretKey = this.getSecretKey();
    return Boolean(appId && secretKey);
  }

  getPublicConfig(): Record<string, string> {
    return {
      provider: this.providerName,
      environment: this.getEnvironment().toLowerCase(),
      appId: this.getAppId() || '',
      isConfigured: String(this.isConfigured()),
    };
  }

  private getHeaders(): Record<string, string> {
    const appId = this.getAppId();
    const secretKey = this.getSecretKey();

    if (!appId || !secretKey) {
      throw new Error(
        'Cashfree credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured on the server.'
      );
    }

    return {
      'Content-Type': 'application/json',
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': '2023-08-01',
    };
  }

  /**
   * Creates a Cashfree Payment Order with optional Easy Split instruction.
   */
  async createPaymentOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Cashfree credentials not configured. Please configure CASHFREE_APP_ID and CASHFREE_SECRET_KEY in server secrets.'
      );
    }

    const orderAmountInRupees = Math.round((params.amountInPaise / 100) * 100) / 100;
    const stageSuffix = params.instalmentType.toLowerCase();
    const cashfreeOrderId = `${params.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '')}_${stageSuffix}_${Date.now().toString(36)}`;

    // Optional Easy Split specification (if vendor ID is provided for creator)
    const orderSplits: Array<{ vendor_id: string; amount: number }> = [];
    if (params.splitDetails?.creatorVendorId && params.splitDetails.creatorAmountInPaise > 0) {
      const creatorAmount = Math.round((params.splitDetails.creatorAmountInPaise / 100) * 100) / 100;
      orderSplits.push({
        vendor_id: params.splitDetails.creatorVendorId,
        amount: creatorAmount,
      });
    }

    const payload: Record<string, any> = {
      order_id: cashfreeOrderId,
      order_amount: orderAmountInRupees,
      order_currency: params.currency || 'INR',
      customer_details: {
        customer_id: params.customer.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
        customer_email: params.customer.email,
        customer_phone: params.customer.phone || '9999999999',
        customer_name: params.customer.name || 'Business Partner',
      },
      order_meta: {
        return_url: `${getServerRuntimeSecret('NEXT_PUBLIC_APP_URL') || 'https://marketmyidea.online'}/orders/${params.orderId}?cf_order_id={order_id}`,
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

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || data?.error_description || 'Failed to create Cashfree order';
      throw new Error(`Cashfree Order Creation Failed: ${errorMsg}`);
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
   */
  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree credentials not configured on the server.');
    }

    const response = await fetch(
      `${this.getBaseUrl()}/orders/${encodeURIComponent(params.providerOrderId)}/payments`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const paymentsList = await response.json();

    if (!response.ok || !Array.isArray(paymentsList)) {
      throw new Error('Failed to fetch payment status from Cashfree');
    }

    // Find successful payment
    const successPayment = paymentsList.find(
      (p: any) => p.payment_status === 'SUCCESS' || p.payment_status === 'CAPTURED'
    );

    if (!successPayment) {
      return {
        isVerified: false,
        status: 'PENDING',
        providerPaymentId: params.providerPaymentId || '',
        providerOrderId: params.providerOrderId,
        amountInPaise: 0,
        verifiedAt: new Date().toISOString(),
        rawResponse: paymentsList,
      };
    }

    const amountInPaise = Math.round(Number(successPayment.payment_amount) * 100);

    return {
      isVerified: true,
      status: 'PAID',
      providerPaymentId: String(successPayment.cf_payment_id || successPayment.payment_id),
      providerOrderId: params.providerOrderId,
      amountInPaise,
      paymentMethod: successPayment.payment_group || successPayment.payment_method,
      verifiedAt: successPayment.payment_time || new Date().toISOString(),
      rawResponse: successPayment,
    };
  }

  /**
   * Verifies and processes Cashfree webhook signatures.
   * Cashfree signature algorithm: HMAC-SHA256 of `${timestamp}${rawBody}` with CASHFREE_WEBHOOK_SECRET.
   */
  async processWebhook(
    rawBody: string,
    headers: Record<string, string | null>
  ): Promise<PaymentWebhookResult> {
    const signature = headers['x-webhook-signature'];
    const timestamp = headers['x-webhook-timestamp'];
    const webhookSecret = this.getWebhookSecret();

    if (!webhookSecret) {
      throw new Error('Cashfree webhook secret is not configured.');
    }

    let isSignatureValid = false;
    if (signature && timestamp) {
      try {
        const payload = `${timestamp}${rawBody}`;
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(payload)
          .digest('base64');

        const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
        const receivedBuf = Buffer.from(signature, 'utf-8');
        if (expectedBuf.length === receivedBuf.length) {
          isSignatureValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);
        }
      } catch (err) {
        console.error('Cashfree signature verification error:', err);
      }
    }

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
    if (paymentStatus === 'SUCCESS') status = 'PAID';
    else if (paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED') status = 'FAILED';

    const tags = orderData?.order_tags || {};

    return {
      isVerified: isSignatureValid,
      eventType,
      providerOrderId,
      providerPaymentId: providerPaymentId ? String(providerPaymentId) : undefined,
      orderId: tags.order_id,
      instalmentType: tags.instalment_type as any,
      status,
      amountInPaise: paymentData?.payment_amount ? Math.round(Number(paymentData.payment_amount) * 100) : undefined,
      rawEvent: parsedEvent,
    };
  }

  /**
   * Cashfree Easy Split post-payment split instruction (if not handled at order creation).
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
      `${this.getBaseUrl()}/orders/${encodeURIComponent(params.providerPaymentId)}/split`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ splits: splitsPayload }),
      }
    );

    const data = await response.json();

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

    const data = await response.json();
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

    const data = await response.json();
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

    const data = await response.json();
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
