import { NextRequest, NextResponse } from 'next/server';
import { computeKPIs } from '@/lib/commerce/kpi';
import {
  fetchStripeCharges,
  fetchStripeRefunds,
  normalizeStripeCharge,
  normalizeStripeRefund
} from '@/lib/stripe/kpi';

/**
 * GET /api/stripe/kpis
 *
 * Fetch and compute KPIs from Stripe
 *
 * Query params:
 * - accessToken: Stripe access token (required)
 * - timezone: IANA timezone (default: 'America/New_York')
 * - windowDays: 30 or 90 (default: 30)
 * - includeGrowth: 'true' to calculate growth (default: 'false')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const accessToken = searchParams.get('accessToken');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameter: accessToken' },
        { status: 400 }
      );
    }

    const timezone = searchParams.get('timezone') || 'America/New_York';
    const windowDays = parseInt(searchParams.get('windowDays') || '30') as 30 | 90;
    const includeGrowth = searchParams.get('includeGrowth') === 'true';

    if (windowDays !== 30 && windowDays !== 90) {
      return NextResponse.json(
        { error: 'windowDays must be 30 or 90' },
        { status: 400 }
      );
    }

    console.log(`[Stripe KPI API] Fetching data for window: ${windowDays} days`);

    // Calculate date range
    const now = new Date();
    const lookbackDays = includeGrowth ? windowDays * 2 : windowDays;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Fetch charges and refunds
    const [rawCharges, rawRefunds] = await Promise.all([
      fetchStripeCharges(accessToken, startDate),
      fetchStripeRefunds(accessToken, startDate)
    ]);

    console.log(`[Stripe KPI API] Fetched ${rawCharges.length} charges, ${rawRefunds.length} refunds`);

    // Normalize to common format
    const orders = rawCharges.map(normalizeStripeCharge);
    const refunds = rawRefunds.map(normalizeStripeRefund);

    // Compute KPIs
    const kpis = computeKPIs({
      orders,
      refunds,
      timezone,
      windowDays,
      priorWindowDays: includeGrowth ? windowDays : undefined
    });

    console.log(`[Stripe KPI API] Computed KPIs: Net sales = ${kpis.net_sales} ${kpis.currency}`);

    return NextResponse.json({
      success: true,
      kpis,
      meta: {
        charges_fetched: rawCharges.length,
        refunds_fetched: rawRefunds.length
      }
    });

  } catch (error) {
    console.error('[Stripe KPI API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compute KPIs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
