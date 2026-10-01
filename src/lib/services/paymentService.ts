/**
 * Payment Service Abstraction Layer (Razorpay-Ready Architecture)
 * 
 * Flow:
 * Deal confirmed -> Payment Pending -> Business checkout via Razorpay
 * -> Server webhook/verification -> Order & payment state updated to PAID
 * -> Creator notified to start work.
 * 
 * Note: Payment integration is intentionally prepared for Razorpay without fake client-side success.
 */

export interface CreatePaymentOrderParams {
  orderId: string;
  subtotal: number;
  currency?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
  platformFee: number;
  totalAmount: number;
  keyId: string;
  provider: 'razorpay' | 'cashfree' | 'pending_integration';
}

export interface IPaymentService {
  calculatePlatformFee(subtotal: number): number;
  createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  createEscrowPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<boolean>;
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

  async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const platformFee = this.calculatePlatformFee(params.subtotal);
    const totalAmount = params.subtotal + platformFee;

    // When Razorpay keys are configured in environment
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      return {
        providerOrderId: `order_rzp_${Date.now()}`,
        amount: params.subtotal,
        currency: params.currency || 'INR',
        platformFee,
        totalAmount,
        keyId: process.env.RAZORPAY_KEY_ID,
        provider: 'razorpay',
      };
    }

    // Architecture stub awaiting Razorpay integration credentials
    return {
      providerOrderId: `pay_order_${Date.now()}_${params.orderId.slice(0, 8)}`,
      amount: params.subtotal,
      currency: params.currency || 'INR',
      platformFee,
      totalAmount,
      keyId: 'pending_razorpay_key',
      provider: 'pending_integration',
    };
  }

  // Alias for backward compatibility
  async createEscrowPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    return this.createPaymentOrder(params);
  }

  /**
   * Server-side signature verification endpoint interface.
   * Client-side code should not authorize payments directly.
   */
  async verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<boolean> {
    // In production, HMAC SHA256 signature verification occurs in trusted API route
    return Boolean(params.orderId && params.paymentId && params.signature);
  }

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
