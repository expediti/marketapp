import { getServerRuntimeSecret, getCashfreeCredentials } from '@/lib/server/cashfree';

export type PayoutVerificationStatus =
  | 'NOT_CONFIGURED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED';

export interface RegisterVendorParams {
  creatorUserId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType?: 'SAVINGS' | 'CURRENT';
  creatorEmail?: string;
  creatorPhone?: string;
  existingVendorId?: string | null;
}

export interface RegisterVendorResult {
  vendorId: string;
  verificationStatus: PayoutVerificationStatus;
  isConfigured: boolean;
  rawResponse?: Record<string, any>;
  details?: Record<string, any>;
  error?: string;
}

/**
 * Service to register and verify creator bank accounts as Cashfree Easy Split Vendors.
 * Safe for Cloudflare Workers. Never exposes secret keys or logs sensitive bank details.
 */
export class CashfreeVendorService {
  isConfigured(): boolean {
    const creds = getCashfreeCredentials();
    return Boolean(creds);
  }

  /**
   * Generates a stable unique vendor ID per creator.
   * e.g., 'cr_6a2b8e...'
   */
  getStableVendorId(creatorUserId: string): string {
    const cleanId = creatorUserId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `cr_${cleanId.slice(0, 24)}`;
  }

  /**
   * Registers or updates a creator as a Cashfree Easy Split Vendor with deferred/on-demand settlement.
   * Enables verify_account to trigger Cashfree penny-drop / bank account verification.
   */
  async registerOrUpdateVendor(params: RegisterVendorParams): Promise<RegisterVendorResult> {
    const vendorId = params.existingVendorId || this.getStableVendorId(params.creatorUserId);
    const creds = getCashfreeCredentials();

    if (!creds) {
      // Credentials not configured on server.
      // Save safely with PENDING_VERIFICATION.
      return {
        vendorId,
        verificationStatus: 'PENDING_VERIFICATION',
        isConfigured: false,
        details: {
          note: 'Cashfree credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured on server. Bank details safely saved awaiting gateway configuration.',
          submitted_at: new Date().toISOString(),
        },
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-client-id': creds.appId,
      'x-client-secret': creds.secretKey,
      'x-api-version': creds.apiVersion,
    };

    // Easy Split Vendor payload with on-demand deferred settlement (schedule_option: 4 / on demand release)
    const vendorPayload = {
      vendor_id: vendorId,
      status: 'ACTIVE',
      name: params.accountHolderName,
      email: params.creatorEmail || `creator_${vendorId}@marketmyidea.online`,
      phone: params.creatorPhone || '9876543210',
      verify_account: true,
      schedule_option: 4, // 4 = ON DEMAND (funds held in escrow split until completion trigger)
      bank: {
        account_number: params.accountNumber,
        account_holder: params.accountHolderName,
        ifsc: params.ifscCode,
      },
    };

    try {
      // 1. Check if vendor already exists on Cashfree
      const checkRes = await fetch(`${creds.baseUrl}/easy-split/vendors/${encodeURIComponent(vendorId)}`, {
        method: 'GET',
        headers,
      });

      let response: Response;

      if (checkRes.ok) {
        // Vendor exists -> Update vendor with new bank details via PATCH
        response = await fetch(`${creds.baseUrl}/easy-split/vendors/${encodeURIComponent(vendorId)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'ACTIVE',
            name: params.accountHolderName,
            email: params.creatorEmail || `creator_${vendorId}@marketmyidea.online`,
            phone: params.creatorPhone || '9876543210',
            verify_account: true,
            schedule_option: 4,
            bank: {
              account_number: params.accountNumber,
              account_holder: params.accountHolderName,
              ifsc: params.ifscCode,
            },
          }),
        });
      } else {
        // Vendor does not exist -> Create vendor via POST
        response = await fetch(`${creds.baseUrl}/easy-split/vendors`, {
          method: 'POST',
          headers,
          body: JSON.stringify(vendorPayload),
        });

        // If vendor already existed on Cashfree (e.g. created previously), fallback to PATCH
        if (!response.ok && (response.status === 409 || response.status === 400)) {
          const createErr = await response.clone().json().catch(() => ({}));
          const errMsg = (createErr?.message || '').toLowerCase();
          if (errMsg.includes('already exists') || response.status === 409) {
            response = await fetch(`${creds.baseUrl}/easy-split/vendors/${encodeURIComponent(vendorId)}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                status: 'ACTIVE',
                name: params.accountHolderName,
                email: params.creatorEmail || `creator_${vendorId}@marketmyidea.online`,
                phone: params.creatorPhone || '9876543210',
                verify_account: true,
                schedule_option: 4,
                bank: {
                  account_number: params.accountNumber,
                  account_holder: params.accountHolderName,
                  ifsc: params.ifscCode,
                },
              }),
            });
          }
        }
      }

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = resData?.message || resData?.error_description || 'Cashfree vendor registration error';
        console.error('Cashfree vendor registration error:', response.status, errorMsg, resData);
        
        let status: PayoutVerificationStatus = 'PENDING_VERIFICATION';
        if (response.status === 400 || response.status === 422) {
          status = 'REJECTED';
        } else if (response.status === 403) {
          status = 'ACTION_REQUIRED';
        }

        return {
          vendorId,
          verificationStatus: status,
          isConfigured: true,
          error: errorMsg,
          details: {
            http_status: response.status,
            message: errorMsg,
            checked_at: new Date().toISOString(),
          },
        };
      }

      // 2. Parse Cashfree verification status from response
      const bankData = resData?.bank || {};
      const bankStatus = (bankData?.verification_status || '').toUpperCase();
      const vendorStatus = (resData?.status || '').toUpperCase();

      let resolvedStatus: PayoutVerificationStatus = 'PENDING_VERIFICATION';

      if (bankStatus === 'SUCCESS' || (vendorStatus === 'ACTIVE' && bankStatus !== 'FAILED')) {
        resolvedStatus = 'VERIFIED';
      } else if (bankStatus === 'FAILED' || vendorStatus === 'REJECTED') {
        resolvedStatus = 'REJECTED';
      } else if (bankStatus === 'ACTION_REQUIRED' || vendorStatus === 'ACTION_REQUIRED') {
        resolvedStatus = 'ACTION_REQUIRED';
      } else {
        resolvedStatus = 'PENDING_VERIFICATION';
      }

      // In Cashfree sandbox, real NPCI IMPS bank verification is not executed against live bank accounts.
      // If Cashfree accepted the vendor creation/update (HTTP 200 / status ACTIVE), resolve as VERIFIED for sandbox testing.
      if (creds.environment === 'SANDBOX' && (response.ok || vendorStatus === 'ACTIVE')) {
        resolvedStatus = 'VERIFIED';
      }

      const gatewayErrorMsg =
        bankData?.verification_error ||
        bankData?.remarks ||
        resData?.message ||
        resData?.error_description ||
        (bankStatus === 'FAILED'
          ? 'Bank account verification failed. Account holder name must match the legal name on record with your bank.'
          : undefined);

      return {
        vendorId,
        verificationStatus: resolvedStatus,
        isConfigured: true,
        rawResponse: {
          vendor_id: resData?.vendor_id,
          status: resData?.status,
          bank_verification_status: bankData?.verification_status,
          bank_name: bankData?.bank_name,
        },
        details: {
          bank_status: bankStatus,
          vendor_status: vendorStatus,
          bank_name: bankData?.bank_name,
          name_at_bank: bankData?.name_at_bank || undefined,
          verification_error: bankData?.verification_error || bankData?.remarks || undefined,
          message: gatewayErrorMsg,
          verified_at: resolvedStatus === 'VERIFIED' ? new Date().toISOString() : null,
          checked_at: new Date().toISOString(),
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error connecting to Cashfree';
      return {
        vendorId,
        verificationStatus: 'PENDING_VERIFICATION',
        isConfigured: true,
        error: message,
        details: {
          error: message,
          checked_at: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Refreshes the verification status of an existing Cashfree vendor.
   */
  async checkVendorStatus(vendorId: string): Promise<{
    verificationStatus: PayoutVerificationStatus;
    details: Record<string, any>;
  }> {
    const creds = getCashfreeCredentials();
    if (!creds) {
      return {
        verificationStatus: 'PENDING_VERIFICATION',
        details: { note: 'Cashfree credentials not configured.' },
      };
    }

    try {
      const headers = {
        'x-client-id': creds.appId,
        'x-client-secret': creds.secretKey,
        'x-api-version': creds.apiVersion,
      };

      const res = await fetch(`${creds.baseUrl}/easy-split/vendors/${encodeURIComponent(vendorId)}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        return {
          verificationStatus: 'PENDING_VERIFICATION',
          details: { error: `Failed to query Cashfree: ${res.status}` },
        };
      }

      const data = await res.json().catch(() => ({}));
      const bankData = data?.bank || {};
      const bankStatus = (bankData?.verification_status || '').toUpperCase();
      const vendorStatus = (data?.status || '').toUpperCase();

      let status: PayoutVerificationStatus = 'PENDING_VERIFICATION';
      if (bankStatus === 'SUCCESS' || (vendorStatus === 'ACTIVE' && bankStatus !== 'FAILED')) {
        status = 'VERIFIED';
      } else if (bankStatus === 'FAILED' || vendorStatus === 'REJECTED') {
        status = 'REJECTED';
      } else if (bankStatus === 'ACTION_REQUIRED' || vendorStatus === 'ACTION_REQUIRED') {
        status = 'ACTION_REQUIRED';
      }

      return {
        verificationStatus: status,
        details: {
          vendor_status: vendorStatus,
          bank_status: bankStatus,
          bank_name: bankData?.bank_name,
          checked_at: new Date().toISOString(),
        },
      };
    } catch (err: unknown) {
      return {
        verificationStatus: 'PENDING_VERIFICATION',
        details: {
          error: err instanceof Error ? err.message : 'Error checking Cashfree vendor status',
        },
      };
    }
  }
}

export const cashfreeVendorService = new CashfreeVendorService();
