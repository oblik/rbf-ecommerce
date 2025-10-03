import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/plaid/token
 *
 * Creates a Plaid Link token for initiating OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const { merchantAddress } = await request.json();

    if (!merchantAddress) {
      return NextResponse.json(
        { error: 'merchantAddress is required' },
        { status: 400 }
      );
    }

    const plaidClientId = process.env.PLAID_CLIENT_ID;
    const plaidSecret = process.env.PLAID_SECRET;
    const plaidEnv = process.env.PLAID_ENV || 'sandbox';

    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not configured');
    }

    // Create Link token
    const response = await fetch(`https://${plaidEnv}.plaid.com/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        user: {
          client_user_id: merchantAddress
        },
        client_name: 'RBF Platform',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/plaid/connected`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Plaid API error: ${error.error_message}`);
    }

    const data = await response.json();

    return NextResponse.json({
      linkToken: data.link_token,
      expiration: data.expiration
    });

  } catch (error) {
    console.error('[Plaid Token] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create Plaid link token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
