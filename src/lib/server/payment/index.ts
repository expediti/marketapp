import { IPaymentProvider } from './types';
import { CashfreePaymentProvider } from './cashfreeProvider';
import { RazorpayPaymentProvider } from './razorpayProvider';
import { MockPaymentProvider } from './mockProvider';

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
 * 1. Explicitly requested provider
 * 2. Cashfree (Primary intended provider for two-instalment + Easy Split)
 * 3. Razorpay (Legacy fallback if configured)
 * 4. Mock (Test environment only)
 */
export function getPaymentProvider(preferredProvider?: string): IPaymentProvider {
  if (preferredProvider && providers[preferredProvider.toLowerCase()]) {
    return providers[preferredProvider.toLowerCase()];
  }

  // Priority 1: Cashfree if credentials configured
  if (cashfreeProviderInstance.isConfigured()) {
    return cashfreeProviderInstance;
  }

  // Priority 2: Razorpay fallback if configured
  if (razorpayProviderInstance.isConfigured()) {
    return razorpayProviderInstance;
  }

  // Priority 3: Mock if in test environment
  if (mockProviderInstance.isConfigured()) {
    return mockProviderInstance;
  }

  // Default to Cashfree provider (will report unconfigured safely without throwing during initialization)
  return cashfreeProviderInstance;
}
