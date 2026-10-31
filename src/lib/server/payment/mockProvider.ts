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
 * Mock Payment Provider (TEST ENVIRONMENT ONLY)
 * 
 * Used strictly for unit testing and local test fixtures when
 * live credentials are not available.
 * 
 * NEVER enabled in production.
 */
export class MockPaymentProvider implements IPaymentProvider {
  readonly providerName = 'mock_test_only';

  isConfigured(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      process.env.ALLOW_TEST_PAYMENT_MOCK === 'true'
    );
  }

  getPublicConfig(): Record<string, string> {
    return {
      provider: this.providerName,
      isConfigured: String(this.isConfigured()),
      environment: 'mock_test_only',
    };
  }

  async createPaymentOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    if (!this.isConfigured()) {
      throw new Error('[TEST_MOCK_PAYMENT_ONLY] Mock provider disabled in non-test environment.');
    }

    const mockOrderId = `mock_order_${params.orderNumber}_${params.instalmentType}_${Date.now()}`;

    return {
      provider: this.providerName,
      providerOrderId: mockOrderId,
      paymentSessionId: `mock_sess_${Date.now()}`,
      amountInPaise: params.amountInPaise,
      currency: params.currency,
      instalmentType: params.instalmentType,
      checkoutUrl: `/orders/${params.orderId}?mock_checkout=true`,
      rawResponse: {
        note: '[TEST_MOCK_PAYMENT_ONLY] Controlled test transaction',
      },
    };
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    if (!this.isConfigured()) {
      throw new Error('[TEST_MOCK_PAYMENT_ONLY] Mock provider disabled in non-test environment.');
    }

    // In mock mode, if signature is "mock_signature_valid", return success
    const isValid = params.signature === 'mock_signature_valid' || Boolean(params.providerPaymentId?.startsWith('mock_pay_'));

    return {
      isVerified: isValid,
      status: isValid ? 'PAID' : 'FAILED',
      providerPaymentId: params.providerPaymentId || `mock_pay_${Date.now()}`,
      providerOrderId: params.providerOrderId,
      amountInPaise: 500000,
      paymentMethod: 'mock_upi',
      verifiedAt: new Date().toISOString(),
      rawResponse: { test_mock: true },
    };
  }

  async processWebhook(
    rawBody: string,
    headers: Record<string, string | null>
  ): Promise<PaymentWebhookResult> {
    if (!this.isConfigured()) {
      throw new Error('[TEST_MOCK_PAYMENT_ONLY] Mock provider disabled.');
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { isVerified: false, eventType: 'UNKNOWN' };
    }

    return {
      isVerified: headers['x-mock-test'] === 'true',
      eventType: parsed.event || 'payment.success',
      providerOrderId: parsed.order_id,
      providerPaymentId: parsed.payment_id,
      orderId: parsed.app_order_id,
      instalmentType: parsed.instalment_type || 'INITIAL',
      status: 'PAID',
      amountInPaise: parsed.amount_in_paise || 500000,
    };
  }

  async createSplit(params: PaymentSplitParams): Promise<PaymentSplitResult> {
    return {
      success: true,
      providerSplitReference: `mock_split_${Date.now()}`,
      splits: params.splits.map((s) => ({
        vendorId: s.vendorId,
        role: s.role,
        amountInPaise: s.amountInPaise,
        splitStatus: 'COMPLETED',
        reference: `mock_vendor_ref_${s.vendorId}`,
      })),
    };
  }

  async getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    return {
      status: 'PAID',
      amountInPaise: 500000,
      currency: 'INR',
      providerPaymentId: `mock_pay_${providerOrderId}`,
    };
  }

  async getSettlementStatus(splitReference: string): Promise<SettlementStatusResult> {
    return {
      settlementStatus: 'SETTLED',
      settledAmountInPaise: 450000,
      settledAt: new Date().toISOString(),
      utrNumber: `MOCKUTR${Date.now()}`,
    };
  }

  async initiateRefund(params: {
    paymentId: string;
    amountInPaise: number;
    reason: string;
  }): Promise<RefundResult> {
    return {
      refundId: `mock_rfnd_${Date.now()}`,
      status: 'PROCESSED',
      amountInPaise: params.amountInPaise,
    };
  }
}
