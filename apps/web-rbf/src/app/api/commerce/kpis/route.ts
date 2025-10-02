import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import {
  computeKPIs,
  normalizeShopifyOrder,
  normalizeShopifyRefund,
  normalizeShopifyCustomer,
  type KPIResult
} from '@/lib/commerce/kpi';

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';

/**
 * GET /api/commerce/kpis
 *
 * Fetch and compute KPIs for a merchant
 *
 * Query params:
 * - shop: Shopify shop domain (required)
 * - accessToken: Shopify access token (required)
 * - timezone: IANA timezone (default: 'America/New_York')
 * - windowDays: 30 or 90 (default: 30)
 * - includeGrowth: 'true' to calculate growth vs prior period (default: 'false')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Required params
    const shop = searchParams.get('shop');
    const accessToken = searchParams.get('accessToken');

    if (!shop || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: shop, accessToken' },
        { status: 400 }
      );
    }

    // Optional params
    const timezone = searchParams.get('timezone') || 'America/New_York';
    const windowDays = parseInt(searchParams.get('windowDays') || '30') as 30 | 90;
    const includeGrowth = searchParams.get('includeGrowth') === 'true';

    if (windowDays !== 30 && windowDays !== 90) {
      return NextResponse.json(
        { error: 'windowDays must be 30 or 90' },
        { status: 400 }
      );
    }

    // Fetch data from Shopify
    console.log(`[KPI API] Fetching data for shop: ${shop}, window: ${windowDays} days`);

    const session = { shop, accessToken, scope: '' };

    // Calculate date range (dynamic, not hardcoded)
    const now = new Date();
    const startDate = new Date(now);
    const lookbackDays = includeGrowth ? windowDays * 2 : windowDays;
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Fetch orders
    const ordersUrl = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json` +
      `?status=any` +
      `&created_at_min=${startDate.toISOString()}` +
      `&limit=250` +
      `&fields=id,created_at,total_price,subtotal_price,total_discounts,total_line_items_price,financial_status,customer,line_items,currency,cancelled_at`;

    const ordersResponse = await fetch(ordersUrl, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });

    if (!ordersResponse.ok) {
      throw new Error(`Shopify orders API error: ${ordersResponse.statusText}`);
    }

    const ordersData = await ordersResponse.json();
    const rawOrders = ordersData.orders || [];

    console.log(`[KPI API] Fetched ${rawOrders.length} orders`);

    // Fetch refunds for each order
    let allRefunds: any[] = [];

    for (const order of rawOrders) {
      if (order.refunds && order.refunds.length > 0) {
        order.refunds.forEach((refund: any) => {
          allRefunds.push(normalizeShopifyRefund(refund, order.id.toString()));
        });
      } else {
        // Fetch refunds separately if not included
        try {
          const refundsUrl = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders/${order.id}/refunds.json`;
          const refundsResponse = await fetch(refundsUrl, {
            headers: { 'X-Shopify-Access-Token': accessToken }
          });

          if (refundsResponse.ok) {
            const refundsData = await refundsResponse.json();
            (refundsData.refunds || []).forEach((refund: any) => {
              allRefunds.push(normalizeShopifyRefund(refund, order.id.toString()));
            });
          }
        } catch (err) {
          console.warn(`[KPI API] Failed to fetch refunds for order ${order.id}:`, err);
        }
      }
    }

    console.log(`[KPI API] Fetched ${allRefunds.length} refunds`);

    // Fetch customers (optional, for better customer metrics)
    let customers: any[] = [];
    try {
      const customersUrl = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/customers.json` +
        `?created_at_min=${startDate.toISOString()}` +
        `&limit=250` +
        `&fields=id,created_at,orders_count,total_spent`;

      const customersResponse = await fetch(customersUrl, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      });

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        customers = (customersData.customers || []).map(normalizeShopifyCustomer);
        console.log(`[KPI API] Fetched ${customers.length} customers`);
      }
    } catch (err) {
      console.warn('[KPI API] Failed to fetch customers:', err);
    }

    // Normalize orders
    const orders = rawOrders.map(normalizeShopifyOrder);

    // Compute KPIs
    const kpis = computeKPIs({
      orders,
      refunds: allRefunds,
      customers: customers.length > 0 ? customers : undefined,
      timezone,
      windowDays,
      priorWindowDays: includeGrowth ? windowDays : undefined
    });

    console.log(`[KPI API] Computed KPIs: Net sales = ${kpis.net_sales} ${kpis.currency}`);

    return NextResponse.json({
      success: true,
      kpis,
      meta: {
        orders_fetched: orders.length,
        refunds_fetched: allRefunds.length,
        customers_fetched: customers.length
      }
    });

  } catch (error) {
    console.error('[KPI API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compute KPIs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
