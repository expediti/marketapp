/**
 * Indian Bank Account & IFSC Validation Utilities
 * 
 * Complies with RBI standards and Cashfree vendor onboarding requirements:
 * - IFSC: 11 characters (4 letters, '0', 6 alphanumeric characters).
 * - Account Number: 9 to 18 digits numeric.
 * - Masked Account: Shows last 4 digits only (e.g. XXXX1234).
 */

export interface BankValidationResult {
  isValid: boolean;
  errors: {
    accountHolderName?: string;
    accountNumber?: string;
    confirmAccountNumber?: string;
    ifscCode?: string;
    accountType?: string;
  };
  cleaned: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'SAVINGS' | 'CURRENT';
    bankAccountLast4: string;
    maskedAccountNumber: string;
  };
}

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NUMBER_REGEX = /^[0-9]{9,18}$/;

/**
 * Normalizes an IFSC code by trimming and converting to uppercase.
 */
export function normalizeIfsc(ifsc: string): string {
  return (ifsc || '').trim().toUpperCase();
}

/**
 * Normalizes an account number by trimming and removing internal spaces/dashes.
 */
export function normalizeAccountNumber(accountNumber: string): string {
  return (accountNumber || '').trim().replace(/[\s-]/g, '');
}

/**
 * Formats a bank account number into a safe masked string.
 * Example: '123456789012' -> 'XXXX9012'
 */
export function maskAccountNumber(accountNumberOrLast4: string): string {
  if (!accountNumberOrLast4) return 'XXXX';
  const clean = accountNumberOrLast4.trim();
  const last4 = clean.length > 4 ? clean.slice(-4) : clean;
  return `XXXX${last4}`;
}

/**
 * Validates complete bank account submission inputs.
 */
export function validateBankDetails(params: {
  accountHolderName?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  ifscCode?: string;
  accountType?: string;
}): BankValidationResult {
  const errors: BankValidationResult['errors'] = {};

  // 1. Account Holder Name
  const accountHolderName = (params.accountHolderName || '').trim().replace(/\s+/g, ' ');
  if (!accountHolderName) {
    errors.accountHolderName = 'Account holder name is required.';
  } else if (accountHolderName.length < 2) {
    errors.accountHolderName = 'Account holder name must be at least 2 characters.';
  } else if (accountHolderName.length > 100) {
    errors.accountHolderName = 'Account holder name must be under 100 characters.';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(accountHolderName)) {
    errors.accountHolderName = 'Account holder name contains invalid characters.';
  }

  // 2. Bank Account Number
  const accountNumber = normalizeAccountNumber(params.accountNumber || '');
  if (!accountNumber) {
    errors.accountNumber = 'Bank account number is required.';
  } else if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
    errors.accountNumber = 'Bank account number must be between 9 and 18 numeric digits.';
  }

  // 3. Confirm Bank Account Number
  const confirmAccountNumber = normalizeAccountNumber(params.confirmAccountNumber || '');
  if (!confirmAccountNumber) {
    errors.confirmAccountNumber = 'Please re-enter your account number to confirm.';
  } else if (accountNumber && confirmAccountNumber !== accountNumber) {
    errors.confirmAccountNumber = 'Bank account numbers do not match.';
  }

  // 4. IFSC Code
  const ifscCode = normalizeIfsc(params.ifscCode || '');
  if (!ifscCode) {
    errors.ifscCode = 'IFSC code is required.';
  } else if (!IFSC_REGEX.test(ifscCode)) {
    errors.ifscCode = 'Invalid IFSC format. Must be 11 characters (e.g. HDFC0001234).';
  }

  // 5. Account Type
  const rawType = (params.accountType || 'SAVINGS').trim().toUpperCase();
  const accountType: 'SAVINGS' | 'CURRENT' = rawType === 'CURRENT' ? 'CURRENT' : 'SAVINGS';

  const bankAccountLast4 = accountNumber.slice(-4);
  const maskedAccountNumber = maskAccountNumber(bankAccountLast4);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      accountHolderName,
      accountNumber,
      ifscCode,
      accountType,
      bankAccountLast4,
      maskedAccountNumber,
    },
  };
}
