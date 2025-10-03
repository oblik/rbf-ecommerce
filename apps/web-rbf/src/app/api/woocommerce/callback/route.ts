import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/woocommerce/callback
 *
 * Receives WooCommerce API credentials after authorization
 *
 * WooCommerce sends credentials as JSON in request body:
 * {
 *   "key_id": 1,
 *   "user_id": "merchantAddress",
 *   "consumer_key": "ck_...",
 *   "consumer_secret": "cs_...",
 *   "key_permissions": "read_write"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      key_id,
      user_id, // This is the merchantAddress we passed in
      consumer_key,
      consumer_secret,
      key_permissions
    } = body;

    if (!consumer_key || !consumer_secret || !user_id) {
      console.error('[WooCommerce Callback] Missing required fields:', body);
      return NextResponse.json(
        { error: 'Missing required credentials' },
        { status: 400 }
      );
    }

    console.log(`[WooCommerce Callback] Received credentials for merchant ${user_id}`);

    // Return success - credentials will be handled client-side via return_url
    return NextResponse.json({
      success: true,
      message: 'Credentials received successfully'
    });

  } catch (error) {
    console.error('[WooCommerce Callback] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process WooCommerce callback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/woocommerce/callback
 *
 * Handle GET requests (some WooCommerce versions might use GET)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // WooCommerce might pass credentials as query params in some cases
  const consumerKey = searchParams.get('consumer_key');
  const consumerSecret = searchParams.get('consumer_secret');
  const userId = searchParams.get('user_id');

  if (consumerKey && consumerSecret && userId) {
    console.log(`[WooCommerce Callback GET] Received credentials for merchant ${userId}`);
    return NextResponse.json({ success: true });
  }

  // If no credentials in query, return error
  return NextResponse.json(
    { error: 'No credentials provided' },
    { status: 400 }
  );
}
