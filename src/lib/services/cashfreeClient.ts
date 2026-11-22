/**
 * Cashfree JS SDK v3 Standard Checkout Client Module for Market My Idea
 * 
 * Safely manages script loading and Cashfree Checkout modal lifecycle.
 * NEVER requires or exposes CASHFREE_SECRET_KEY to the browser.
 */

export interface StartCashfreePaymentParams {
  orderId: string;
  stage?: 'INITIAL' | 'FINAL';
  customerName?: string;
  customerEmail?: string;
  onPaymentStarted?: () => void;
  onPaymentSuccess?: (result: { orderId: string; status: string; stage?: 'INITIAL' | 'FINAL' }) => void;
  onPaymentFailure?: (error: { message: string; code?: string }) => void;
  onDismiss?: () => void;
}

declare global {
  interface Window {
    Cashfree?: any;
  }
}

/**
 * Dynamically loads the Cashfree Checkout v3 script.
 */
export function loadCashfreeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Cashfree) return resolve(true);

    const existingScript = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Cashfree checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initiates the 2-stage Cashfree Checkout payment flow:
 * 1. Requests server-side order creation (/api/payments/create-order).
 * 2. Launches Cashfree modal checkout with payment_session_id.
 * 3. Transmits payment verification to /api/payments/verify.
 * 4. Advances order status to WORK_STARTED or READY_FOR_FINAL_DELIVERY.
 */
export async function startCashfreePayment(params: StartCashfreePaymentParams): Promise<{
  success: boolean;
  status: string;
  stage?: 'INITIAL' | 'FINAL';
  error?: string;
}> {
  const paymentStage = params.stage || 'INITIAL';

  try {
    if (params.onPaymentStarted) {
      params.onPaymentStarted();
    }

    // 1. Create order on server
    const createRes = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: params.orderId,
        stage: paymentStage,
        preferred_provider: 'cashfree',
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      const errMsg = createData.error || 'Failed to create payment order.';
      if (params.onPaymentFailure) {
        params.onPaymentFailure({ message: errMsg });
      }
      return { success: false, status: 'FAILED', stage: paymentStage, error: errMsg };
    }

    const {
      payment_session_id: paymentSessionId,
      provider_order_id: providerOrderId,
      checkout_url: checkoutUrl,
    } = createData;

    // 2. Ensure Cashfree checkout SDK is loaded
    const scriptLoaded = await loadCashfreeScript();
    if (!scriptLoaded || !window.Cashfree) {
      // Fallback: If SDK fails to load, redirect to checkout URL if available
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return { success: true, status: 'REDIRECTED', stage: paymentStage };
      }

      const errMsg = 'Cashfree Checkout SDK failed to load. Please check your network connection.';
      if (params.onPaymentFailure) {
        params.onPaymentFailure({ message: errMsg });
      }
      return { success: false, status: 'FAILED', stage: paymentStage, error: errMsg };
    }

    // 3. Open Cashfree Standard Checkout Modal
    const environment = (process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT || '').toLowerCase() === 'production'
      ? 'production'
      : 'sandbox';

    const cashfree = window.Cashfree({
      mode: environment,
    });

    const checkoutOptions = {
      paymentSessionId,
      redirectTarget: '_modal',
    };

    let checkoutResult: any = null;
    try {
      checkoutResult = await cashfree.checkout(checkoutOptions);
    } catch (modalErr: any) {
      console.warn('Cashfree modal dismiss / error notice:', modalErr);
    }

    if (checkoutResult?.error) {
      const errMsg = checkoutResult.error.message || 'Payment was declined or cancelled.';
      try {
        await fetch('/api/payments/fail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: params.orderId,
            provider_order_id: providerOrderId,
            error_description: errMsg,
          }),
        });
      } catch { }

      if (params.onPaymentFailure) {
        params.onPaymentFailure({ message: errMsg });
      }
      return { success: false, status: 'FAILED', stage: paymentStage, error: errMsg };
    }

    // 4. Verify payment with server
    const verifyRes = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: params.orderId,
        stage: paymentStage,
        provider: 'cashfree',
        provider_order_id: providerOrderId,
      }),
    });

    const verifyData = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok || !verifyData.success) {
      const errMsg = verifyData.error || 'Payment verification pending or incomplete.';
      if (params.onPaymentFailure) {
        params.onPaymentFailure({ message: errMsg });
      }
      return { success: false, status: 'PENDING', stage: paymentStage, error: errMsg };
    }

    if (params.onPaymentSuccess) {
      params.onPaymentSuccess({
        orderId: params.orderId,
        status: 'PAID',
        stage: paymentStage,
      });
    }

    return { success: true, status: 'PAID', stage: paymentStage };
  } catch (err: any) {
    const errMsg = err.message || 'Unexpected error during Cashfree payment.';
    if (params.onPaymentFailure) {
      params.onPaymentFailure({ message: errMsg });
    }
    return { success: false, status: 'FAILED', stage: paymentStage, error: errMsg };
  }
}

