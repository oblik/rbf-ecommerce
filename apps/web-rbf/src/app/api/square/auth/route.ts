import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/square/auth
 *
 * Generates Square OAuth authorization URL
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

    const squareAppId = process.env.SQUARE_APP_ID;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox'; // 'production' or 'sandbox'

    if (!squareAppId) {
      throw new Error('Square credentials not configured');
    }

    const baseUrl = squareEnvironment === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/callback`;

    // Build Square OAuth URL
    const params = new URLSearchParams({
      client_id: squareAppId,
      scope: 'ORDERS_READ MERCHANT_PROFILE_READ PAYMENTS_READ',
      state: merchantAddress, // Pass merchant address through state
    });

    const authUrl = `${baseUrl}/oauth2/authorize?${params.toString()}`;

    console.log(`[Square Auth] Generated auth URL for merchant ${merchantAddress}`);

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('[Square Auth] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate Square auth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
