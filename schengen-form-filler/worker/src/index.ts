/**
 * Schengen Demo Payment Worker
 * Handles DodoPayments checkout and token generation
 */

interface Env {
  PAYMENTS: KVNamespace;
  DODO_API_KEY: string;
  DODO_ENVIRONMENT: 'test_mode' | 'live_mode';
  DEMO_HMAC_SECRET: string;
  DEMO_PROJECT_ID: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// JWT utilities
function base64UrlEncode(data: string | Uint8Array): string {
  let base64: string;
  if (typeof data === 'string') {
    const bytes = new TextEncoder().encode(data);
    base64 = btoa(String.fromCharCode(...bytes));
  } else {
    base64 = btoa(String.fromCharCode(...data));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createHmacSignature(secret: string, data: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

async function createToken(
  userId: string,
  projectId: string,
  secret: string,
  budget: { ai: number; compute: number },
  expiresIn: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: userId,
    iss: projectId,
    iat: now,
    exp: now + expiresIn,
    budget: {
      ai: budget.ai,
      compute: budget.compute,
      window: 'lifetime',
      windowStart: new Date().toISOString(),
    },
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await createHmacSignature(secret, signatureInput);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'schengen-demo-payments' }, { headers: corsHeaders });
    }

    // Create checkout
    if (url.pathname === '/checkout/create' && request.method === 'POST') {
      return handleCreateCheckout(request, env);
    }

    // Verify payment
    if (url.pathname === '/checkout/verify' && request.method === 'POST') {
      return handleVerifyPayment(request, env);
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  },
};

async function handleCreateCheckout(request: Request, env: Env): Promise<Response> {
  if (!env.DODO_API_KEY) {
    return Response.json(
      { error: 'Payment system not configured' },
      { status: 500, headers: corsHeaders }
    );
  }

  let body: { productId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine
  }

  const baseUrl = env.DODO_ENVIRONMENT === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';

  // For demo, use a fixed product or pass productId
  const productId = body.productId || 'pdt_0NWHQ6PUaiw1P1AYl6egy';
  const returnUrl = body.returnUrl || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billing: {
          city: 'San Francisco',
          country: 'US',
          state: 'CA',
          street: '123 Demo St',
          zipcode: '94102',
        },
        customer: {
          email: body.email || 'demo@example.com',
          name: 'Demo User',
        },
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        payment_link: true,
        return_url: returnUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[checkout] DodoPayments error: ${response.status} ${errorText}`);
      return Response.json(
        { error: 'Failed to create payment link', details: errorText },
        { status: 500, headers: corsHeaders }
      );
    }

    const payment = await response.json() as {
      payment_id: string;
      payment_link: string;
    };

    console.log(`[checkout] Created payment: ${payment.payment_id}`);

    return Response.json(
      {
        paymentId: payment.payment_id,
        checkoutUrl: payment.payment_link,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error(`[checkout] Error: ${(err as Error).message}`);
    return Response.json(
      { error: 'Payment service unavailable' },
      { status: 503, headers: corsHeaders }
    );
  }
}

async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  if (!env.DODO_API_KEY) {
    return Response.json(
      { error: 'Payment system not configured' },
      { status: 500, headers: corsHeaders }
    );
  }

  let body: { paymentId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid request body' },
      { status: 400, headers: corsHeaders }
    );
  }

  const { paymentId } = body;
  if (!paymentId) {
    return Response.json(
      { error: 'paymentId is required' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Check if already redeemed
  const existingToken = await env.PAYMENTS.get(`payment:${paymentId}`);
  if (existingToken) {
    console.log(`[checkout] Returning existing token for: ${paymentId}`);
    return Response.json({ token: existingToken }, { headers: corsHeaders });
  }

  const baseUrl = env.DODO_ENVIRONMENT === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';

  try {
    // Verify payment with DodoPayments
    const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${env.DODO_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[checkout] DodoPayments error: ${response.status} ${errorText}`);
      return Response.json(
        { error: 'Failed to verify payment' },
        { status: 500, headers: corsHeaders }
      );
    }

    const payment = await response.json() as {
      payment_id: string;
      status: string;
    };

    if (payment.status !== 'succeeded') {
      return Response.json(
        { error: 'Payment not completed', status: payment.status },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate token - $1 = 1,000,000 microdollars AI budget
    const token = await createToken(
      paymentId,
      env.DEMO_PROJECT_ID,
      env.DEMO_HMAC_SECRET,
      {
        ai: 1_000_000,  // $1 AI budget
        compute: 3600,   // 1 hour compute
      },
      86400 * 7  // 7 days expiry
    );

    // Store to prevent duplicate redemption
    await env.PAYMENTS.put(`payment:${paymentId}`, token, {
      expirationTtl: 86400 * 7,
    });

    console.log(`[checkout] Generated token for: ${paymentId}`);

    return Response.json({ token }, { headers: corsHeaders });
  } catch (err) {
    console.error(`[checkout] Error: ${(err as Error).message}`);
    return Response.json(
      { error: 'Payment verification failed' },
      { status: 503, headers: corsHeaders }
    );
  }
}
