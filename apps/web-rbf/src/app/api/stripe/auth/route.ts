import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/stripe/auth
 *
 * Initiates Stripe Connect OAuth flow
 * Merchant clicks "Connect Stripe" → redirects to Stripe OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantAddress = searchParams.get('merchantAddress');

    if (!merchantAddress) {
      return NextResponse.json(
        { error: 'merchantAddress parameter is required' },
        { status: 400 }
      );
    }

    const stripeClientId = process.env.STRIPE_CLIENT_ID;

    if (!stripeClientId) {
      throw new Error('STRIPE_CLIENT_ID not configured');
    }

    // Build Stripe Connect OAuth URL
    const params = new URLSearchParams({
      client_id: stripeClientId,
      state: merchantAddress, // Pass merchant address in state for security
      scope: 'read_only', // Only read permissions
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`,
      response_type: 'code'
    });

    const authUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('[Stripe Auth] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Stripe auth URL' },
      { status: 500 }
    );
  }
}
