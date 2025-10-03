import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/toast/auth
 *
 * Generates Toast OAuth authorization URL
 *
 * Note: Toast uses OAuth 2.0 but requires manual registration with Toast integrations team
 * to obtain client credentials (client_id and client_secret)
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

    const toastClientId = process.env.TOAST_CLIENT_ID;
    const toastEnvironment = process.env.TOAST_ENVIRONMENT || 'sandbox'; // 'production' or 'sandbox'

    if (!toastClientId) {
      throw new Error('Toast credentials not configured. Contact Toast integrations team to obtain API credentials.');
    }

    // Toast OAuth authorization URL
    // Note: Toast's OAuth flow may vary - this is a standard implementation
    const baseUrl = toastEnvironment === 'production'
      ? 'https://ws-api.toasttab.com'
      : 'https://ws-sandbox-api.toasttab.com';

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/toast/callback`;

    const params = new URLSearchParams({
      client_id: toastClientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state: merchantAddress, // Pass merchant address through state
      scope: 'orders:read payments:read' // Adjust scopes based on Toast API requirements
    });

    const authUrl = `${baseUrl}/oauth/authorize?${params.toString()}`;

    console.log(`[Toast Auth] Generated auth URL for merchant ${merchantAddress}`);

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('[Toast Auth] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate Toast auth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
