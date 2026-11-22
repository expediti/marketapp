import { IPaymentProvider } from './types';
import { CashfreePaymentProvider } from './cashfreeProvider';
import { RazorpayPaymentProvider } from './razorpayProvider';
import { MockPaymentProvider } from './mockProvider';
import { getServerRuntimeSecret } from '@/lib/server/cashfree';

export * from './types';
export { CashfreePaymentProvider } from './cashfreeProvider';
export { RazorpayPaymentProvider } from './razorpayProvider';
export { MockPaymentProvider } from './mockProvider';

const cashfreeProviderInstance = new CashfreePaymentProvider();
const razorpayProviderInstance = new RazorpayPaymentProvider();
const mockProviderInstance = new MockPaymentProvider();

const providers: Record<string, IPaymentProvider> = {
  cashfree: cashfreeProviderInstance,
  razorpay: razorpayProviderInstance,
  mock_test_only: mockProviderInstance,
};

/**
 * Resolves the appropriate payment provider.
 * 
 * Precedence:
 * 1. Explicitly requested provider (e.g. 'cashfree' or 'razorpay')
 * 2. Cashfree (Primary intended provider for two-stage escrow + Easy Split)
 * 3. Mock (If in test environment)
 * 4. Razorpay (Only if explicitly forced via FORCE_RAZORPAY=true)
 * 5. Default to Cashfree provider
 */
export function getPaymentProvider(preferredProvider?: string): IPaymentProvider {
  if (preferredProvider && providers[preferredProvider.toLowerCase()]) {
    return providers[preferredProvider.toLowerCase()];
  }

  // Priority 1: Cashfree if credentials configured
  if (cashfreeProviderInstance.isConfigured()) {
    return cashfreeProviderInstance;
  }

  // Priority 2: Forced Razorpay fallback only if explicitly enabled
  const forceRazorpay = getServerRuntimeSecret('FORCE_RAZORPAY') === 'true';
  if (forceRazorpay && razorpayProviderInstance.isConfigured()) {
    return razorpayProviderInstance;
  }

  // Priority 3: Mock if in test environment
  if (mockProviderInstance.isConfigured()) {
    return mockProviderInstance;
  }

  // Default to Cashfree provider (will report unconfigured safely if credentials not yet configured)
  return cashfreeProviderInstance;
}
