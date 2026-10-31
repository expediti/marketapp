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
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  getRazorpayCredentials,
  getRazorpayWebhookSecret,
} from '@/lib/server/razorpay';

/**
 * Razorpay Payment Provider Adapter (Legacy Fallback)
 * 
 * Preserves legacy functionality for existing orders and webhooks
 * while adhering to the common IPaymentProvider interface.
 */
export class RazorpayPaymentProvider implements IPaymentProvider {
  readonly providerName = 'razorpay';

  isConfigured(): boolean {
    try {
      const { keyId, keySecret } = getRazorpayCredentials();
      return Boolean(keyId && keySecret);
    } catch {
      return false;
    }
  }

  getPublicConfig(): Record<string, string> {
    try {
      const { keyId } = getRazorpayCredentials();
      return {
        provider: this.providerName,
        keyId,
        isConfigured: 'true',
      };
    } catch {
      return {
        provider: this.providerName,
        keyId: '',
        isConfigured: 'false',
      };
    }
  }

  async createPaymentOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    const stageNote = params.instalmentType === 'INITIAL' ? '50% Initial' : '50% Final';
    const rzpOrder = await createRazorpayOrder({
      amountInPaise: params.amountInPaise,
      currency: params.currency || 'INR',
      receipt: `${params.orderNumber}-${params.instalmentType.toLowerCase()}`.slice(0, 40),
      notes: {
        order_id: params.orderId,
        order_number: params.orderNumber,
        business_id: params.customer.id,
        stage: params.instalmentType,
        note: stageNote,
        ...params.notes,
      },
    });

    return {
      provider: this.providerName,
      providerOrderId: rzpOrder.id,
      amountInPaise: rzpOrder.amount,
      currency: rzpOrder.currency,
      instalmentType: params.instalmentType,
      rawResponse: rzpOrder,
    };
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    if (!params.providerPaymentId || !params.signature) {
      throw new Error('Razorpay verification requires providerPaymentId and signature.');
    }

    const isValid = verifyRazorpayPaymentSignature({
      orderId: params.providerOrderId,
      paymentId: params.providerPaymentId,
      signature: params.signature,
    });

    if (!isValid) {
      return {
        isVerified: false,
        status: 'FAILED',
        providerPaymentId: params.providerPaymentId,
        providerOrderId: params.providerOrderId,
        amountInPaise: 0,
        verifiedAt: new Date().toISOString(),
      };
    }

    let rzpDetails: any;
    try {
      rzpDetails = await fetchRazorpayPayment(params.providerPaymentId);
    } catch {}

    return {
      isVerified: true,
      status: 'PAID',
      providerPaymentId: params.providerPaymentId,
      providerOrderId: params.providerOrderId,
      amountInPaise: rzpDetails?.amount || 0,
      paymentMethod: rzpDetails?.method,
      verifiedAt: new Date().toISOString(),
      rawResponse: rzpDetails,
    };
  }

  async processWebhook(
    rawBody: string,
    headers: Record<string, string | null>
  ): Promise<PaymentWebhookResult> {
    const signature = headers['x-razorpay-signature'];
    if (!signature) {
      return { isVerified: false, eventType: 'UNKNOWN' };
    }

    let webhookSecret: string;
    try {
      webhookSecret = getRazorpayWebhookSecret();
    } catch {
      return { isVerified: false, eventType: 'UNKNOWN' };
    }

    const isVerified = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
      webhookSecret,
    });

    let eventPayload: any = {};
    try {
      eventPayload = JSON.parse(rawBody);
    } catch {
      return { isVerified: false, eventType: 'UNKNOWN' };
    }

    const eventType = eventPayload?.event || 'UNKNOWN';
    const paymentEntity = eventPayload?.payload?.payment?.entity;
    const orderEntity = eventPayload?.payload?.order?.entity;

    const providerOrderId = paymentEntity?.order_id || orderEntity?.id;
    const providerPaymentId = paymentEntity?.id;

    let status: 'PAID' | 'FAILED' | 'PENDING' = 'PENDING';
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      status = 'PAID';
    } else if (eventType === 'payment.failed') {
      status = 'FAILED';
    }

    const notes = paymentEntity?.notes || orderEntity?.notes || {};

    return {
      isVerified,
      eventType,
      providerOrderId,
      providerPaymentId,
      orderId: notes.order_id,
      instalmentType: notes.stage as any,
      status,
      amountInPaise: paymentEntity?.amount,
      rawEvent: eventPayload,
    };
  }

  async createSplit(params: PaymentSplitParams): Promise<PaymentSplitResult> {
    // Razorpay standard route (legacy placeholder)
    return {
      success: true,
      providerSplitReference: `rzp_split_${Date.now()}`,
      splits: params.splits.map((s) => ({
        vendorId: s.vendorId,
        role: s.role,
        amountInPaise: s.amountInPaise,
        splitStatus: 'COMPLETED',
      })),
    };
  }

  async getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    return {
      status: 'PAID',
      amountInPaise: 0,
      currency: 'INR',
    };
  }

  async getSettlementStatus(splitReference: string): Promise<SettlementStatusResult> {
    return {
      settlementStatus: 'SETTLED',
    };
  }

  async initiateRefund(params: {
    paymentId: string;
    amountInPaise: number;
    reason: string;
  }): Promise<RefundResult> {
    return {
      refundId: `rfnd_${Date.now()}`,
      status: 'PENDING',
      amountInPaise: params.amountInPaise,
    };
  }
}
