import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPayPalTransactions,
  fetchPayPalRefunds,
  normalizePayPalTransaction,
  normalizePayPalRefund,
  filterPayPalSales
} from '@/lib/paypal/kpi';
import { computeKPIs } from '@/lib/commerce/kpi';

/**
 * GET /api/paypal/kpis
 *
 * Fetches and computes KPIs from PayPal transaction data
 *
 * Note: Requires Transaction Search API access. After activation, wait 9 hours.
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

    console.log(`[PayPal KPIs] Fetching data for ${windowDays} days (${startDate.toISOString()} to ${endDate.toISOString()})`);

    // Fetch all transactions
    const allTransactions = await fetchPayPalTransactions(accessToken, startDate, endDate, environment);

    console.log(`[PayPal KPIs] Fetched ${allTransactions.length} total transactions`);

    // Separate sales and refunds
    const salesTransactions = filterPayPalSales(allTransactions);
    const refundTransactions = allTransactions.filter((tx: any) => {
      const eventCode = tx.transaction_info?.transaction_event_code;
      return eventCode === 'T0001' || eventCode === 'T0004';
    });

    console.log(`[PayPal KPIs] ${salesTransactions.length} sales, ${refundTransactions.length} refunds`);

    // Normalize to common format
    const orders = salesTransactions.map(normalizePayPalTransaction);
    const refunds = refundTransactions.map(normalizePayPalRefund);

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
        total_transactions: allTransactions.length,
        sales_count: salesTransactions.length,
        refunds_count: refundTransactions.length,
        window_days: windowDays,
        timezone
      }
    });

  } catch (error) {
    console.error('[PayPal KPIs] Error:', error);

    // Provide helpful error message if Transaction Search API not enabled
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = errorMessage.includes('Unauthorized') || errorMessage.includes('403');

    return NextResponse.json(
      {
        error: 'Failed to fetch PayPal KPIs',
        details: errorMessage,
        hint: isAuthError
          ? 'Transaction Search API may not be enabled. Enable it in PayPal Developer Dashboard and wait 9 hours.'
          : undefined
      },
      { status: 500 }
    );
  }
}
