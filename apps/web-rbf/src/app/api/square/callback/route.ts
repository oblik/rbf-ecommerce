import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/square/callback
 *
 * Handles Square OAuth callback and exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // merchantAddress
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('[Square Callback] OAuth error:', error, errorDescription);
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

    const squareAppId = process.env.SQUARE_APP_ID;
    const squareAppSecret = process.env.SQUARE_APP_SECRET;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    if (!squareAppId || !squareAppSecret) {
      throw new Error('Square credentials not configured');
    }

    const baseUrl = squareEnvironment === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2025-01-23' // Latest API version
      },
      body: JSON.stringify({
        client_id: squareAppId,
        client_secret: squareAppSecret,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[Square Callback] Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.message || 'Unknown error'}`);
    }

    const tokenData = await tokenResponse.json();

    console.log(`[Square Callback] Success for merchant ${state}`);

    // Redirect to success page with tokens in URL params
    const redirectUrl = new URL('/square/connected', process.env.NEXT_PUBLIC_APP_URL!);
    redirectUrl.searchParams.set('merchantId', tokenData.merchant_id);
    redirectUrl.searchParams.set('accessToken', tokenData.access_token);
    redirectUrl.searchParams.set('refreshToken', tokenData.refresh_token || '');
    redirectUrl.searchParams.set('expiresAt', tokenData.expires_at || '');
    redirectUrl.searchParams.set('merchantAddress', state);

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('[Square Callback] Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/business/dashboard?error=${encodeURIComponent('Square connection failed')}`
    );
  }
}
