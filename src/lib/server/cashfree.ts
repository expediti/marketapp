import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface CashfreeCredentials {
  appId: string;
  secretKey: string;
  webhookSecret: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  baseUrl: string;
  apiVersion: string;
}

/**
 * Safely resolves a server runtime variable from Cloudflare Context (Worker env)
 * or process.env, without throwing or exposing secrets.
 * Edge-compatible and Cloudflare Workers safe.
 */
export function getServerRuntimeSecret(key: string): string | undefined {
  // 1. Try OpenNext getCloudflareContext()
  try {
    const cf = getCloudflareContext();
    const val = (cf?.env as Record<string, any>)?.[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  } catch {
    // getCloudflareContext may throw outside of request context or during local build/prerender
  }

  // 2. Try global ALS store directly via Symbol.for("__cloudflare-context__")
  try {
    const globalContext = (globalThis as any)[Symbol.for('__cloudflare-context__')];
    const val = (globalContext?.env as Record<string, any>)?.[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  } catch {}

  // 3. Try globalThis directly (direct Cloudflare Worker env binding)
  try {
    const directVal = (globalThis as any)?.[key];
    if (typeof directVal === 'string' && directVal.trim().length > 0) {
      return directVal.trim();
    }
    const envVal = (globalThis as any)?.env?.[key];
    if (typeof envVal === 'string' && envVal.trim().length > 0) {
      return envVal.trim();
    }
  } catch {}

  // 4. Fallback to process.env
  try {
    const procVal = process.env[key];
    if (typeof procVal === 'string' && procVal.trim().length > 0) {
      return procVal.trim();
    }
  } catch {}

  return undefined;
}

/**
 * Retrieves Cashfree gateway credentials and endpoints.
 * Automatically trims keys and auto-detects sandbox/production environment.
 */
export function getCashfreeCredentials(): CashfreeCredentials | null {
  const rawAppId =
    getServerRuntimeSecret('CASHFREE_APP_ID') ||
    getServerRuntimeSecret('NEXT_PUBLIC_CASHFREE_APP_ID');
  const rawSecretKey = getServerRuntimeSecret('CASHFREE_SECRET_KEY');
  const rawWebhookSecret = getServerRuntimeSecret('CASHFREE_WEBHOOK_SECRET');

  const appId = rawAppId ? rawAppId.trim() : '';
  const secretKey = rawSecretKey ? rawSecretKey.trim() : '';
  const webhookSecret = rawWebhookSecret ? rawWebhookSecret.trim() : secretKey;

  if (!appId || !secretKey || appId === 'your_cashfree_app_id' || secretKey === 'your_cashfree_secret_key') {
    return null;
  }

  const rawEnv = (getServerRuntimeSecret('CASHFREE_ENVIRONMENT') || '').trim().toUpperCase();

  // Smart environment auto-routing:
  // Cashfree Sandbox keys always start with or contain TEST (e.g. TEST10293847...)
  // Production keys never start with TEST.
  // If a test key is detected, route to SANDBOX.
  // If a production key is detected, route to PRODUCTION (unless explicitly forced to SANDBOX).
  const isTestKey = appId.toUpperCase().startsWith('TEST') || secretKey.toUpperCase().includes('TEST');
  let environment: 'SANDBOX' | 'PRODUCTION';
  if (isTestKey) {
    environment = 'SANDBOX';
  } else if (rawEnv === 'SANDBOX') {
    environment = 'SANDBOX';
  } else {
    environment = 'PRODUCTION';
  }

  const baseUrl =
    environment === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

  return {
    appId,
    secretKey,
    webhookSecret,
    environment,
    baseUrl,
    apiVersion: '2023-08-01',
  };
}

/**
 * Converts an ArrayBuffer to a Base64 string using standard Web APIs.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Edge-safe Web Crypto API implementation of Cashfree HMAC-SHA256 webhook signature verification.
 * Algorithm: Base64(HMAC_SHA256(timestamp + rawBody, secret))
 */
export async function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  timestamp: string | null | undefined,
  webhookSecret: string | null | undefined
): Promise<boolean> {
  if (!signature || !timestamp || !webhookSecret) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const payload = `${timestamp}${rawBody}`;
    const keyData = encoder.encode(webhookSecret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData as unknown as BufferSource
    );
    const computedBase64Signature = arrayBufferToBase64(signatureBuffer);

    return timingSafeEqualStrings(computedBase64Signature, signature);
  } catch (err) {
    console.error('Edge Web Crypto verification error:', err);
    return false;
  }
}

/**
 * Triggers Cashfree Easy Split on-demand settlement release for a vendor or order.
 * Calls Cashfree PG Easy Split Settlement API.
 */
export async function triggerCashfreeEasySplitSettlement(params: {
  orderId: string;
  vendorId?: string;
  amountInPaise?: number;
  remarks?: string;
}): Promise<{
  success: boolean;
  settlementId?: string;
  status: string;
  rawResponse?: Record<string, any>;
  error?: string;
}> {
  const creds = getCashfreeCredentials();
  if (!creds) {
    return {
      success: false,
      status: 'UNCONFIGURED',
      error: 'Cashfree credentials not configured on server',
    };
  }

  try {
    const amountInRupees = params.amountInPaise
      ? Math.round((params.amountInPaise / 100) * 100) / 100
      : undefined;

    const payload: Record<string, any> = {
      settlement_id: `stl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      order_id: params.orderId,
      remarks: params.remarks || `Settlement release for Order ${params.orderId}`,
    };

    if (params.vendorId) {
      payload.vendor_id = params.vendorId;
    }
    if (amountInRupees) {
      payload.amount = amountInRupees;
    }

    const response = await fetch(`${creds.baseUrl}/easy-split/settlements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': creds.appId,
        'x-client-secret': creds.secretKey,
        'x-api-version': creds.apiVersion,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // In sandbox or when settlement is already queued / auto-scheduled, treat accordingly
      const errorMsg = data?.message || data?.error_description || 'Settlement request rejected by Cashfree';
      return {
        success: false,
        status: 'FAILED',
        error: errorMsg,
        rawResponse: data,
      };
    }

    return {
      success: true,
      settlementId: data.settlement_id || payload.settlement_id,
      status: data.status || 'SETTLED',
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'FAILED',
      error: err.message || 'Network error triggering Cashfree settlement',
    };
  }
}
