/**
 * Indian UPI ID (VPA) Client-side Validation and Formatting Utility
 *
 * MANUAL PAYOUT ARCHITECTURE NOTE:
 * - This UPI ID is used ONLY for future manual creator payouts by the platform owner.
 * - The actual payout will be manually initiated in the RazorpayX Dashboard.
 * - DO NOT implement automatic payouts.
 * - DO NOT implement RazorpayX API payouts.
 * - DO NOT trigger any automatic payout on order completion.
 * - Businesses must NEVER see the creator's payout UPI ID.
 */

export interface UpiValidationResult {
  isValid: boolean;
  value: string;
  error?: string;
}

/**
 * Validates and normalizes an Indian UPI ID (Virtual Payment Address).
 * Examples of valid UPI IDs:
 * - name@upi
 * - rahul.sharma@okhdfcbank
 * - creator_99@paytm
 * - brand-promotions@icici
 *
 * Validation rules:
 * - Trims whitespace
 * - Converts to lowercase
 * - Optional: returns isValid = true with value = '' if empty
 * - Rejects obvious invalid formats without over-restricting valid Indian PSP handles
 * - Does not attempt fake client-side ownership verification
 */
export function validateAndNormalizeUpiId(rawInput: string | null | undefined): UpiValidationResult {
  if (!rawInput) {
    return { isValid: true, value: '' };
  }

  const trimmed = rawInput.trim().toLowerCase();
  if (trimmed === '') {
    return { isValid: true, value: '' };
  }

  // Check for presence of exactly one '@'
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      value: trimmed,
      error: 'UPI ID must contain exactly one "@" symbol (e.g., name@upi)',
    };
  }

  const [handle, provider] = trimmed.split('@');

  // Handle (username) validation: 2-256 characters, alphanumeric, dot, hyphen, underscore
  const handleRegex = /^[a-z0-9][a-z0-9.\-_]{0,254}[a-z0-9]$|^[a-z0-9]{2}$/;
  if (!handle || !handleRegex.test(handle)) {
    return {
      isValid: false,
      value: trimmed,
      error: 'Invalid handle in UPI ID. Use letters, numbers, dots, hyphens, or underscores.',
    };
  }

  // Provider (bank/PSP) validation: 2-64 characters, letters and numbers (e.g. upi, okhdfcbank, paytm, ybl, axl)
  const providerRegex = /^[a-z0-9]{2,64}$/;
  if (!provider || !providerRegex.test(provider)) {
    return {
      isValid: false,
      value: trimmed,
      error: 'Invalid bank/PSP handle after "@" (e.g., @upi, @okhdfcbank, @paytm)',
    };
  }

  return {
    isValid: true,
    value: trimmed,
  };
}
