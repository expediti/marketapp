import crypto from 'node:crypto';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method?: string;
  captured?: boolean;
  email?: string;
  contact?: string;
  error_code?: string | null;
  error_description?: string | null;
  error_source?: string | null;
  error_step?: string | null;
  error_reason?: string | null;
  created_at: number;
}

/**
 * Safely resolves a server runtime variable from Cloudflare Context (Worker env)
 * or process.env, without throwing or exposing secrets.
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
 * Retrieves and validates server-side Razorpay credentials from runtime environment.
 * NEVER expose RAZORPAY_KEY_SECRET to the client.
 */
export function getRazorpayCredentials() {
  const keyId =
    getServerRuntimeSecret('RAZORPAY_KEY_ID') ||
    getServerRuntimeSecret('NEXT_PUBLIC_RAZORPAY_KEY_ID');
  const keySecret = getServerRuntimeSecret('RAZORPAY_KEY_SECRET');

  if (!keyId || !keySecret) {
    throw new Error(
      'Server-side Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing or not configured.'
    );
  }

  return { keyId, keySecret };
}

/**
 * Retrieves and validates server-side Razorpay Webhook secret from runtime environment.
 */
export function getRazorpayWebhookSecret(): string {
  const webhookSecret = getServerRuntimeSecret('RAZORPAY_WEBHOOK_SECRET');
  if (!webhookSecret) {
    throw new Error(
      'Server-side Razorpay webhook secret (RAZORPAY_WEBHOOK_SECRET) is missing or not configured.'
    );
  }
  return webhookSecret;
}

/**
 * Creates a Razorpay Order via the official Razorpay REST API.
 */
export async function createRazorpayOrder(params: {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayCredentials();

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

  const payload = {
    amount: params.amountInPaise,
    currency: params.currency || 'INR',
    receipt: params.receipt.slice(0, 40), // Razorpay receipt max 40 chars
    notes: params.notes || {},
  };

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.description || data?.message || 'Failed to create Razorpay order';
    throw new Error(`Razorpay Order Creation Failed: ${errorMsg}`);
  }

  return data as RazorpayOrderResponse;
}

/**
 * Fetches Razorpay Payment details for server-side verification.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentResponse> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.description || data?.message || 'Failed to fetch Razorpay payment';
    throw new Error(`Razorpay Payment Lookup Failed: ${errorMsg}`);
  }

  return data as RazorpayPaymentResponse;
}

/**
 * Verifies the Razorpay payment signature using timing-safe HMAC-SHA256 comparison.
 * Signature is computed from: `${orderId}|${paymentId}` with RAZORPAY_KEY_SECRET.
 */
export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    const { keySecret } = getRazorpayCredentials();
    const payload = `${params.orderId}|${params.paymentId}`;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(params.signature, 'utf-8');

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature using timing-safe HMAC-SHA256 comparison.
 * Signature is computed from the raw webhook body with RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  try {
    if (!params.rawBody || !params.signature || !params.webhookSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', params.webhookSecret)
      .update(params.rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(params.signature, 'utf-8');

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}
