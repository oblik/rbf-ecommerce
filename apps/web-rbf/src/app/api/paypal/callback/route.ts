import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/paypal/callback
 *
 * Handles PayPal OAuth callback and exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // merchantAddress
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('[PayPal Callback] OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/business/dashboard?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const baseUrl = paypalEnvironment === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/callback`;

    // Encode credentials for Basic Auth
    const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[PayPal Callback] Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.message || 'Unknown error'}`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info to retrieve merchant ID
    const userInfoResponse = await fetch(`${baseUrl}/v1/identity/openidconnect/userinfo?schema=openid`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    let merchantId = 'unknown';
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      merchantId = userInfo.user_id || userInfo.payer_id || 'unknown';
    }

    console.log(`[PayPal Callback] Success for merchant ${state}`);

    // Redirect to success page with tokens in URL params
    const redirectUrl = new URL('/paypal/connected', process.env.NEXT_PUBLIC_APP_URL!);
    redirectUrl.searchParams.set('accessToken', tokenData.access_token);
    redirectUrl.searchParams.set('refreshToken', tokenData.refresh_token || '');
    redirectUrl.searchParams.set('expiresIn', tokenData.expires_in?.toString() || '32400'); // Default 9 hours
    redirectUrl.searchParams.set('scope', tokenData.scope || '');
    redirectUrl.searchParams.set('merchantId', merchantId);
    redirectUrl.searchParams.set('merchantAddress', state);

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('[PayPal Callback] Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/business/dashboard?error=${encodeURIComponent('PayPal connection failed')}`
    );
  }
}
