/**
 * Razorpay Standard Checkout Client Module for Market My Idea
 * 
 * Safely manages script loading and Standard Checkout lifecycle.
 * NEVER requires or exposes RAZORPAY_KEY_SECRET to the browser.
 */

export interface StartPaymentParams {
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  onPaymentStarted?: () => void;
  onPaymentSuccess?: (result: { orderId: string; status: string }) => void;
  onPaymentFailure?: (error: { message: string; code?: string }) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the Razorpay Standard Checkout script.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initiates the complete Razorpay Standard Checkout payment flow:
 * 1. Requests server-side order creation (/api/payments/create-order).
 * 2. Launches Razorpay Standard Checkout modal.
 * 3. Transmits payment credentials to /api/payments/verify upon user completion.
 * 4. Reports any failure or cancellation to /api/payments/fail.
 */
export async function startRazorpayPayment(params: StartPaymentParams): Promise<{
  success: boolean;
  status: string;
  error?: string;
}> {
  try {
    if (params.onPaymentStarted) {
      params.onPaymentStarted();
    }

    // 1. Create order on server
    const createRes = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: params.orderId }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      const errMsg = createData.error || 'Failed to create payment order.';
      if (params.onPaymentFailure) {
        params.onPaymentFailure({ message: errMsg });
      }
      return { success: false, status: 'FAILED', error: errMsg };
    }

    const { key_id, order_id: razorpayOrderId, amount, currency, order_number } = createData;

    // 2. Ensure Razorpay checkout script is loaded
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      const errMsg = 'Razorpay Checkout SDK failed to load. Please check your network connection.';
      if (params.onPaymentFailure) {
        params.onPaymentFailure({ message: errMsg });
      }
      return { success: false, status: 'FAILED', error: errMsg };
    }

    // 3. Open Razorpay Standard Checkout
    return new Promise((resolve) => {
      const options = {
        key: key_id,
        amount: amount,
        currency: currency || 'INR',
        name: 'Market My Idea',
        description: `Order #${order_number}`,
        order_id: razorpayOrderId,
        prefill: {
          name: params.customerName || '',
          email: params.customerEmail || '',
        },
        theme: {
          color: '#FF5416', // Market My Idea brand primary
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 4. Server-side verification
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: params.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              const errMsg = verifyData.error || 'Payment signature verification failed.';
              if (params.onPaymentFailure) {
                params.onPaymentFailure({ message: errMsg });
              }
              resolve({ success: false, status: 'FAILED', error: errMsg });
              return;
            }

            if (params.onPaymentSuccess) {
              params.onPaymentSuccess({
                orderId: params.orderId,
                status: 'PAID',
              });
            }

            resolve({ success: true, status: 'PAID' });
          } catch (err: any) {
            const errMsg = err.message || 'Verification network error';
            if (params.onPaymentFailure) {
              params.onPaymentFailure({ message: errMsg });
            }
            resolve({ success: false, status: 'FAILED', error: errMsg });
          }
        },
        modal: {
          ondismiss: function () {
            // User closed checkout modal without paying
            if (params.onDismiss) {
              params.onDismiss();
            }
            resolve({
              success: false,
              status: 'CANCELLED',
              error: 'Payment window was closed.',
            });
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);

      rzpInstance.on('payment.failed', async function (response: any) {
        const errorDescription = response.error?.description || 'Payment was declined or failed.';
        const errorCode = response.error?.code;

        // Log failure to server
        try {
          await fetch('/api/payments/fail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: params.orderId,
              razorpay_order_id: razorpayOrderId,
              error_code: errorCode,
              error_description: errorDescription,
            }),
          });
        } catch {
          // ignore network failure logging errors
        }

        if (params.onPaymentFailure) {
          params.onPaymentFailure({
            message: errorDescription,
            code: errorCode,
          });
        }

        resolve({
          success: false,
          status: 'FAILED',
          error: errorDescription,
        });
      });

      rzpInstance.open();
    });
  } catch (err: any) {
    const errMsg = err.message || 'Unexpected payment error occurred.';
    if (params.onPaymentFailure) {
      params.onPaymentFailure({ message: errMsg });
    }
    return { success: false, status: 'FAILED', error: errMsg };
  }
}
