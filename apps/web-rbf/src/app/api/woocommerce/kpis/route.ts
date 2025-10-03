import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWooCommerceOrders,
  fetchWooCommerceRefunds,
  normalizeWooCommerceOrder,
  normalizeWooCommerceRefund
} from '@/lib/woocommerce/kpi';
import { computeKPIs } from '@/lib/commerce/kpi';

/**
 * GET /api/woocommerce/kpis
 *
 * Fetches and computes KPIs from WooCommerce store data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeUrl = searchParams.get('storeUrl');
    const consumerKey = searchParams.get('consumerKey');
    const consumerSecret = searchParams.get('consumerSecret');
    const windowDays = parseInt(searchParams.get('windowDays') || '30') as 30 | 90;
    const timezone = searchParams.get('timezone') || 'America/New_York';

    if (!storeUrl) {
      return NextResponse.json(
        { error: 'storeUrl is required' },
        { status: 400 }
      );
    }

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'consumerKey and consumerSecret are required' },
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

    console.log(`[WooCommerce KPIs] Fetching data for store ${storeUrl} (${windowDays} days)`);

    // Fetch orders and refunds
    const [rawOrders, rawRefunds] = await Promise.all([
      fetchWooCommerceOrders(storeUrl, consumerKey, consumerSecret, startDate, endDate),
      fetchWooCommerceRefunds(storeUrl, consumerKey, consumerSecret, startDate, endDate)
    ]);

    console.log(`[WooCommerce KPIs] Fetched ${rawOrders.length} orders and ${rawRefunds.length} refunds`);

    // Filter out refunded orders from the main orders list
    const refundedOrderIds = new Set(rawRefunds.map((r: any) => r.id));
    const completedOrders = rawOrders.filter((order: any) =>
      !refundedOrderIds.has(order.id) &&
      (order.status === 'completed' || order.status === 'processing')
    );

    // Normalize to common format
    const orders = completedOrders.map(normalizeWooCommerceOrder);
    const refunds = rawRefunds.map(normalizeWooCommerceRefund);

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
        total_orders: rawOrders.length,
        completed_orders: completedOrders.length,
        refunds_count: rawRefunds.length,
        window_days: windowDays,
        timezone,
        store_url: storeUrl
      }
    });

  } catch (error) {
    console.error('[WooCommerce KPIs] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch WooCommerce KPIs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
