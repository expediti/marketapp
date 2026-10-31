/**
 * Payment Provider Abstraction Layer Interfaces
 * 
 * Defines standard interfaces for multi-provider payment processing,
 * two-instalment campaign orders, and Cashfree Easy Split settlement.
 */

export type PaymentInstalmentType = 'INITIAL' | 'FINAL' | 'FULL';
export type PaymentStatusType = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type SettlementStatusType = 'UNSETTLED' | 'SETTLED' | 'FAILED' | 'ON_HOLD';

export interface SplitRecipient {
  vendorId: string;
  role: 'creator' | 'platform';
  amountInPaise: number;
  percentage?: number;
}

export interface PaymentOrderParams {
  orderId: string;
  orderNumber: string;
  instalmentType: PaymentInstalmentType;
  amountInPaise: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  notes?: Record<string, string>;
  splitDetails?: {
    creatorVendorId?: string;
    creatorAmountInPaise: number;
    platformAmountInPaise: number;
  };
}

export interface PaymentOrderResult {
  provider: string;
  providerOrderId: string;
  paymentSessionId?: string;
  amountInPaise: number;
  currency: string;
  instalmentType: PaymentInstalmentType;
  checkoutUrl?: string;
  rawResponse?: unknown;
}

export interface PaymentVerificationParams {
  orderId: string;
  instalmentType: PaymentInstalmentType;
  providerOrderId: string;
  providerPaymentId?: string;
  signature?: string;
  rawBody?: string;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  status: PaymentStatusType;
  providerPaymentId: string;
  providerOrderId: string;
  amountInPaise: number;
  paymentMethod?: string;
  verifiedAt: string;
  rawResponse?: unknown;
}

export interface PaymentSplitParams {
  orderId: string;
  paymentId: string;
  providerPaymentId: string;
  instalmentType: PaymentInstalmentType;
  splits: SplitRecipient[];
}

export interface PaymentSplitResult {
  success: boolean;
  providerSplitReference?: string;
  splits: Array<{
    vendorId: string;
    role: 'creator' | 'platform';
    amountInPaise: number;
    splitStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    reference?: string;
  }>;
  rawResponse?: unknown;
}

export interface PaymentWebhookResult {
  isVerified: boolean;
  eventType: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  orderId?: string;
  instalmentType?: PaymentInstalmentType;
  status?: PaymentStatusType;
  amountInPaise?: number;
  rawEvent?: unknown;
}

export interface PaymentStatusResult {
  status: PaymentStatusType;
  amountInPaise: number;
  currency: string;
  providerPaymentId?: string;
}

export interface SettlementStatusResult {
  settlementStatus: SettlementStatusType;
  settledAmountInPaise?: number;
  settledAt?: string;
  utrNumber?: string;
  failureReason?: string;
}

export interface RefundResult {
  refundId: string;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  amountInPaise: number;
}

/**
 * Provider-Independent Payment Service Interface
 */
export interface IPaymentProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  getPublicConfig(): Record<string, string>;
  createPaymentOrder(params: PaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;
  processWebhook(rawBody: string, headers: Record<string, string | null>): Promise<PaymentWebhookResult>;
  createSplit(params: PaymentSplitParams): Promise<PaymentSplitResult>;
  getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult>;
  getSettlementStatus(splitReference: string): Promise<SettlementStatusResult>;
  initiateRefund(params: { paymentId: string; amountInPaise: number; reason: string }): Promise<RefundResult>;
}
