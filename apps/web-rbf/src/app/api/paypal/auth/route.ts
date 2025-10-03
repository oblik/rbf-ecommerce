import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/paypal/auth
 *
 * Generates PayPal OAuth authorization URL using "Log in with PayPal"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantAddress = searchParams.get('merchantAddress');

    if (!merchantAddress) {
      return NextResponse.json(
        { error: 'merchantAddress is required' },
        { status: 400 }
      );
    }

    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

    if (!paypalClientId) {
      throw new Error('PayPal credentials not configured');
    }

    // PayPal OAuth base URLs
    const baseUrl = paypalEnvironment === 'production'
      ? 'https://www.paypal.com'
      : 'https://www.sandbox.paypal.com';

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/callback`;

    // Build PayPal OAuth URL
    // Using "Log in with PayPal" with additional Transaction Search scope
    const params = new URLSearchParams({
      client_id: paypalClientId,
      response_type: 'code',
      scope: 'openid profile email https://uri.paypal.com/services/reporting/search/read',
      redirect_uri: redirectUri,
      state: merchantAddress, // Pass merchant address through state
      nonce: Date.now().toString() // CSRF protection
    });

    const authUrl = `${baseUrl}/connect?${params.toString()}`;

    console.log(`[PayPal Auth] Generated auth URL for merchant ${merchantAddress}`);

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('[PayPal Auth] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PayPal auth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
