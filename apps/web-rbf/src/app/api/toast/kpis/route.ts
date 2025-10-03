import { NextRequest, NextResponse } from 'next/server';
import {
  fetchToastOrders,
  fetchToastRefunds,
  normalizeToastOrder,
  normalizeToastRefund
} from '@/lib/toast/kpi';
import { computeKPIs } from '@/lib/commerce/kpi';

/**
 * GET /api/toast/kpis
 *
 * Fetches and computes KPIs from Toast POS data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('accessToken');
    const restaurantGuid = searchParams.get('restaurantGuid');
    const windowDays = parseInt(searchParams.get('windowDays') || '30') as 30 | 90;
    const timezone = searchParams.get('timezone') || 'America/New_York';
    const environment = (searchParams.get('environment') || 'sandbox') as 'production' | 'sandbox';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    if (!restaurantGuid) {
      return NextResponse.json(
        { error: 'restaurantGuid is required' },
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

    console.log(`[Toast KPIs] Fetching data for restaurant ${restaurantGuid} (${windowDays} days)`);

    // Fetch orders and refunds in parallel
    const [rawOrders, rawRefunds] = await Promise.all([
      fetchToastOrders(accessToken, restaurantGuid, startDate, endDate, environment),
      fetchToastRefunds(accessToken, restaurantGuid, startDate, endDate, environment)
    ]);

    console.log(`[Toast KPIs] Fetched ${rawOrders.length} orders and ${rawRefunds.length} refunds`);

    // Normalize to common format
    const orders = rawOrders.map(normalizeToastOrder);
    const refunds = rawRefunds.map(normalizeToastRefund);

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
        timezone,
        restaurant_guid: restaurantGuid
      }
    });

  } catch (error) {
    console.error('[Toast KPIs] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Toast KPIs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
