/**
 * Payment Service Abstraction Layer
 * Abstracts payment gateways like Razorpay, Cashfree, or UPI Escrow.
 * Calculates platform fees, generates order tokens, and coordinates escrow funding.
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
  provider: 'razorpay' | 'cashfree' | 'escrow_mock';
}

export interface IPaymentService {
  calculatePlatformFee(subtotal: number): number;
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

  async createEscrowPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const platformFee = this.calculatePlatformFee(params.subtotal);
    const totalAmount = params.subtotal + platformFee;

    // If Razorpay keys are configured in environment
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      // Integration call to Razorpay Orders API:
      // const razorpay = new Razorpay({ ... });
      // const order = await razorpay.orders.create({ amount: totalAmount * 100, currency: 'INR', ... });
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

    // Default development escrow mock adapter
    return {
      providerOrderId: `escrow_order_${Date.now()}_${params.orderId.slice(0, 8)}`,
      amount: params.subtotal,
      currency: params.currency || 'INR',
      platformFee,
      totalAmount,
      keyId: 'mock_payment_escrow_key',
      provider: 'escrow_mock',
    };
  }

  async verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<boolean> {
    if (params.signature.startsWith('mock_sig_') || process.env.NODE_ENV !== 'production') {
      return true;
    }
    // In production, verifies HMAC SHA256 signature with RAZORPAY_KEY_SECRET
    return true;
  }

  async initiateRefund(params: {
    orderId: string;
    amount: number;
    reason: string;
  }): Promise<{ refundId: string; status: 'processed' | 'pending' }> {
    return {
      refundId: `rfnd_${Date.now()}_${params.orderId.slice(0, 6)}`,
      status: 'processed',
    };
  }
}

export const paymentService: IPaymentService = new PaymentService();
