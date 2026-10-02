/**
 * Payment Service Abstraction Layer (Razorpay Integration)
 * 
 * Flow:
 * Deal confirmed (DEAL_CONFIRMED) -> Business clicks Pay Now ->
 * Backend creates Razorpay order (/api/payments/create-order) ->
 * Razorpay Standard Checkout opens -> Business pays ->
 * Server verifies signature & status (/api/payments/verify) ->
 * Supabase payment and order become PAID ->
 * Creator notified -> Creator can "Mark as Started".
 * 
 * Note: The frontend NEVER decides payment succeeded.
 * Backend verification is the authoritative source of truth.
 */

export interface CreatePaymentOrderParams {
  orderId: string;
  subtotal?: number;
  currency?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  success: boolean;
  keyId: string;
  orderId: string; // Razorpay order id
  amount: number; // in paise
  currency: string;
  orderNumber: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface IPaymentService {
  calculatePlatformFee(subtotal: number): number;
  createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<{ success: boolean; status: string }>;
  initiateRefund(params: {
    orderId: string;
    amount: number;
    reason: string;
  }): Promise<{ refundId: string; status: 'processed' | 'pending' }>;
}

class PaymentService implements IPaymentService {
  private platformFeePercentage: number = 0.05; // 5% platform fee

  calculatePlatformFee(subtotal: number): number {
    return Math.round(subtotal * this.platformFeePercentage * 100) / 100;
  }

  /**
   * Request server-side creation of a Razorpay Order.
   * The server authenticates caller, verifies ownership, and reads the locked total amount from Supabase.
   */
  async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: params.orderId }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to initialize payment order on server.');
    }

    return {
      success: true,
      keyId: data.key_id,
      orderId: data.order_id,
      amount: data.amount,
      currency: data.currency,
      orderNumber: data.order_number,
    };
  }

  /**
   * Server-side signature verification.
   * Client-side code sends the Razorpay payment credentials for HMAC-SHA256 signature verification.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<{ success: boolean; status: string }> {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Payment signature verification failed.');
    }

    return {
      success: true,
      status: data.status || 'PAID',
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
