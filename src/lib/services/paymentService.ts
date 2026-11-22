/**
 * Payment Service Abstraction Layer (Cashfree & Multi-Provider Integration)
 * 
 * Flow:
 * Deal confirmed (DEAL_CONFIRMED) -> Business clicks Pay Now ->
 * Backend creates Cashfree order (/api/payments/create-order) with Easy Split ->
 * Cashfree Checkout Modal opens -> Business pays ->
 * Server verifies payment status (/api/payments/verify) ->
 * Supabase payment and order become PARTIALLY_PAID (INITIAL) or PAID (FINAL) ->
 * Creator notified -> Creator proceeds with deliverables.
 * 
 * Note: The frontend NEVER decides payment succeeded.
 * Backend verification is the authoritative source of truth.
 */

export interface CreatePaymentOrderParams {
  orderId: string;
  stage?: 'INITIAL' | 'FINAL';
  subtotal?: number;
  currency?: string;
  preferredProvider?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  success: boolean;
  keyId?: string;
  orderId: string; // Provider order id
  paymentSessionId?: string;
  checkoutUrl?: string;
  amount: number; // in paise
  currency: string;
  orderNumber: string;
  stage?: 'INITIAL' | 'FINAL';
  provider?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  stage?: 'INITIAL' | 'FINAL';
  provider?: string;
  provider_order_id?: string;
  provider_payment_id?: string;
  payment_session_id?: string;
  signature?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface IPaymentService {
  calculatePlatformFee(subtotal: number): number;
  createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<{ success: boolean; status: string; stage?: string }>;
  initiateRefund(params: {
    orderId: string;
    amount: number;
    reason: string;
  }): Promise<{ refundId: string; status: 'processed' | 'pending' }>;
}

class PaymentService implements IPaymentService {
  private platformFeePercentage: number = 0.10; // 10% platform fee standard

  calculatePlatformFee(subtotal: number): number {
    return Math.round(subtotal * this.platformFeePercentage * 100) / 100;
  }

  /**
   * Request server-side creation of a Payment Order (defaults to Cashfree).
   * The server authenticates caller, verifies ownership, and calculates stage amount from Supabase.
   */
  async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: params.orderId,
        stage: params.stage || 'INITIAL',
        preferred_provider: params.preferredProvider || 'cashfree',
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to initialize payment order on server.');
    }

    return {
      success: true,
      keyId: data.key_id || '',
      orderId: data.provider_order_id || data.order_id,
      paymentSessionId: data.payment_session_id,
      checkoutUrl: data.checkout_url,
      amount: data.amount,
      currency: data.currency,
      orderNumber: data.order_number,
      stage: data.stage || params.stage || 'INITIAL',
      provider: data.provider || 'cashfree',
    };
  }

  /**
   * Server-side payment verification.
   * Client-side code sends credentials for authoritative server verification.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<{ success: boolean; status: string; stage?: string }> {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: params.orderId,
        stage: params.stage,
        provider: params.provider || 'cashfree',
        provider_order_id: params.provider_order_id || params.razorpay_order_id,
        provider_payment_id: params.provider_payment_id || params.razorpay_payment_id,
        signature: params.signature || params.razorpay_signature,
        razorpay_order_id: params.razorpay_order_id,
        razorpay_payment_id: params.razorpay_payment_id,
        razorpay_signature: params.razorpay_signature,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Payment verification failed.');
    }

    return {
      success: true,
      status: data.status || 'PAID',
      stage: data.stage || params.stage,
    };
  }

  /**
   * Refund handling stub for dispute resolutions
   */
  async initiateRefund(params: {
    orderId: string;
    amount: number;
    reason: string;
  }): Promise<{ refundId: string; status: 'processed' | 'pending' }> {
    return {
      refundId: `rfnd_${Date.now()}`,
      status: 'pending',
    };
  }
}

export const paymentService = new PaymentService();
