import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSquareOrders,
  fetchSquareRefunds,
  normalizeSquareOrder,
  normalizeSquareRefund
} from '@/lib/square/kpi';
import { computeKPIs } from '@/lib/commerce/kpi';

/**
 * GET /api/square/kpis
 *
 * Fetches and computes KPIs from Square data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('accessToken');
    const windowDays = parseInt(searchParams.get('windowDays') || '30') as 30 | 90;
    const timezone = searchParams.get('timezone') || 'America/New_York';
    const environment = (searchParams.get('environment') || 'sandbox') as 'production' | 'sandbox';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    if (![30, 90].includes(windowDays)) {
      return NextResponse.json(
        { error: 'windowDays must be 30 or 90' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);

    console.log(`[Square KPIs] Fetching data for ${windowDays} days (${startDate.toISOString()} to ${endDate.toISOString()})`);

    // Fetch orders and refunds in parallel
    const [rawOrders, rawRefunds] = await Promise.all([
      fetchSquareOrders(accessToken, startDate, endDate, environment),
      fetchSquareRefunds(accessToken, startDate, endDate, environment)
    ]);

    console.log(`[Square KPIs] Fetched ${rawOrders.length} orders and ${rawRefunds.length} refunds`);

    // Normalize to common format
    const orders = rawOrders.map(normalizeSquareOrder);
    const refunds = rawRefunds.map(normalizeSquareRefund);

    // Compute KPIs
    const kpis = computeKPIs({
      orders,
      refunds,
      timezone,
      windowDays
    });

    return NextResponse.json({
      success: true,
      kpis,
      meta: {
        orders_count: rawOrders.length,
        refunds_count: rawRefunds.length,
        window_days: windowDays,
        timezone
      }
    });

  } catch (error) {
    console.error('[Square KPIs] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Square KPIs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
