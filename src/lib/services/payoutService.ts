/**
 * ============================================================================
 * MANUAL CREATOR PAYOUT WORKFLOW SPECIFICATION
 * ============================================================================
 * 
 * IMPORTANT ARCHITECTURAL RULES:
 * - Creator payouts in Market My App are strictly MANUAL.
 * - DO NOT implement automatic payouts.
 * - DO NOT implement RazorpayX API payouts.
 * - DO NOT implement escrow.
 * - DO NOT implement Razorpay Route / Linked Accounts.
 * - DO NOT trigger any payout automatically when an order becomes COMPLETED.
 * 
 * The actual payout is manually initiated by the Market My App platform owner:
 * 
 * Flow:
 * Order completed
 *   → Market My App owner decides payout amount
 *   → Owner manually creates payout in RazorpayX Dashboard
 *   → Owner uses creator's stored UPI ID (payout_upi_id)
 *   → Owner authorizes the payout
 * 
 * The application must NOT automatically transfer money.
 * Businesses must NEVER see the creator's payout UPI ID.
 * ============================================================================
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
