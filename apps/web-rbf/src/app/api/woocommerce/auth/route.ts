import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/woocommerce/auth
 *
 * Generates WooCommerce authorization URL using the WC Auth endpoint
 *
 * Note: Requires the merchant to provide their WooCommerce store URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantAddress = searchParams.get('merchantAddress');
    const storeUrl = searchParams.get('storeUrl');

    if (!merchantAddress) {
      return NextResponse.json(
        { error: 'merchantAddress is required' },
        { status: 400 }
      );
    }

    if (!storeUrl) {
      return NextResponse.json(
        { error: 'storeUrl is required (e.g., https://yourstore.com)' },
        { status: 400 }
      );
    }

    // Clean up store URL (remove trailing slash)
    const cleanStoreUrl = storeUrl.replace(/\/$/, '');

    // WooCommerce Auth endpoint
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/woocommerce/callback`;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/woocommerce/connected`;

    // Build WooCommerce authorization URL
    const params = new URLSearchParams({
      app_name: 'RBF Platform',
      scope: 'read_write', // read, write, or read_write
      user_id: merchantAddress, // Use merchant address as user_id
      return_url: returnUrl,
      callback_url: callbackUrl
    });

    const authUrl = `${cleanStoreUrl}/wc-auth/v1/authorize?${params.toString()}`;

    console.log(`[WooCommerce Auth] Generated auth URL for merchant ${merchantAddress}, store: ${cleanStoreUrl}`);

    return NextResponse.json({
      authUrl,
      storeUrl: cleanStoreUrl
    });

  } catch (error) {
    console.error('[WooCommerce Auth] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate WooCommerce auth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
