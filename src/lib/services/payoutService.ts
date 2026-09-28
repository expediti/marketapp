/**
 * Payout Service Abstraction Layer
 * Handles creator fund release via UPI VPA or Bank IMPS transfers upon approval.
 */

export interface InitiatePayoutParams {
  orderId: string;
  creatorId: string;
  amount: number;
  recipientVpaOrAccount?: string;
  notes?: string;
}

export interface PayoutResult {
  payoutId: string;
  orderId: string;
  creatorId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  utrNumber?: string;
  provider: 'razorpayx' | 'cashfree_payouts' | 'upi_bank_mock';
}

export interface IPayoutService {
  initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult>;
  getPayoutStatus(payoutId: string): Promise<PayoutResult>;
}

class PayoutService implements IPayoutService {
  async initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult> {
    // Generate simulated/real UTR reference number
    const mockUtr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      payoutId: `payout_${Date.now()}_${params.creatorId.slice(0, 6)}`,
      orderId: params.orderId,
      creatorId: params.creatorId,
      amount: params.amount,
      status: 'processing',
      utrNumber: mockUtr,
      provider: 'upi_bank_mock',
    };
  }

  async getPayoutStatus(payoutId: string): Promise<PayoutResult> {
    return {
      payoutId,
      orderId: 'mock_order_id',
      creatorId: 'mock_creator_id',
      amount: 2500,
      status: 'completed',
      utrNumber: 'UTR98172314',
      provider: 'upi_bank_mock',
    };
  }
}

export const payoutService: IPayoutService = new PayoutService();
