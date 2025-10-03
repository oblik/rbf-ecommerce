import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/stripe/callback
 *
 * Handles Stripe OAuth callback
 * Exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // merchantAddress
    const error = searchParams.get('error');

    if (error) {
      console.error('[Stripe Callback] OAuth error:', error);
      const errorUrl = new URL('/business/dashboard', process.env.NEXT_PUBLIC_APP_URL!);
      errorUrl.searchParams.set('error', 'stripe_oauth_denied');
      return NextResponse.redirect(errorUrl.toString());
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_secret: stripeSecretKey,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Stripe token exchange failed: ${errorData.error_description}`);
    }

    const tokenData = await tokenResponse.json();

    console.log('[Stripe Callback] OAuth successful:', {
      accountId: tokenData.stripe_user_id,
      scope: tokenData.scope
    });

    // Redirect to success page with tokens
    const redirectUrl = new URL('/stripe/connected', process.env.NEXT_PUBLIC_APP_URL!);
    redirectUrl.searchParams.set('accountId', tokenData.stripe_user_id);
    redirectUrl.searchParams.set('accessToken', tokenData.access_token);
    redirectUrl.searchParams.set('refreshToken', tokenData.refresh_token || '');
    redirectUrl.searchParams.set('scope', tokenData.scope);
    redirectUrl.searchParams.set('merchantAddress', state);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[Stripe Callback] Error:', error);

    const errorUrl = new URL('/business/dashboard', process.env.NEXT_PUBLIC_APP_URL!);
    errorUrl.searchParams.set('error', 'stripe_connection_failed');

    return NextResponse.redirect(errorUrl.toString());
  }
}
