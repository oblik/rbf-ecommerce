import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/toast/callback
 *
 * Handles Toast OAuth callback and exchanges authorization code for access token
 *
 * Note: Toast uses client credentials authentication. The actual implementation
 * may need adjustment based on Toast's specific OAuth flow requirements.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // merchantAddress
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('[Toast Callback] OAuth error:', error, errorDescription);
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

    const toastClientId = process.env.TOAST_CLIENT_ID;
    const toastClientSecret = process.env.TOAST_CLIENT_SECRET;
    const toastEnvironment = process.env.TOAST_ENVIRONMENT || 'sandbox';

    if (!toastClientId || !toastClientSecret) {
      throw new Error('Toast credentials not configured');
    }

    const baseUrl = toastEnvironment === 'production'
      ? 'https://ws-api.toasttab.com'
      : 'https://ws-sandbox-api.toasttab.com';

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/toast/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: toastClientId,
        client_secret: toastClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[Toast Callback] Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.message || 'Unknown error'}`);
    }

    const tokenData = await tokenResponse.json();

    console.log(`[Toast Callback] Success for merchant ${state}`);

    // Redirect to success page with tokens in URL params
    const redirectUrl = new URL('/toast/connected', process.env.NEXT_PUBLIC_APP_URL!);
    redirectUrl.searchParams.set('accessToken', tokenData.access_token);
    redirectUrl.searchParams.set('refreshToken', tokenData.refresh_token || '');
    redirectUrl.searchParams.set('expiresIn', tokenData.expires_in?.toString() || '');
    redirectUrl.searchParams.set('merchantAddress', state);
    // Toast may return restaurant GUID or other identifiers
    if (tokenData.restaurant_guid) {
      redirectUrl.searchParams.set('restaurantGuid', tokenData.restaurant_guid);
    }

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('[Toast Callback] Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/business/dashboard?error=${encodeURIComponent('Toast connection failed')}`
    );
  }
}
