import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/plaid/exchange
 *
 * Exchanges Plaid public token for access token
 */
export async function POST(request: NextRequest) {
  try {
    const { publicToken, merchantAddress, institutionName } = await request.json();

    if (!publicToken || !merchantAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plaidClientId = process.env.PLAID_CLIENT_ID;
    const plaidSecret = process.env.PLAID_SECRET;
    const plaidEnv = process.env.PLAID_ENV || 'sandbox';

    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not configured');
    }

    // Exchange public token for access token
    const response = await fetch(`https://${plaidEnv}.plaid.com/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        public_token: publicToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Plaid API error: ${error.error_message}`);
    }

    const data = await response.json();

    console.log(`[Plaid Exchange] Success for merchant ${merchantAddress}`);

    return NextResponse.json({
      accessToken: data.access_token,
      itemId: data.item_id
    });

  } catch (error) {
    console.error('[Plaid Exchange] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to exchange Plaid token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
