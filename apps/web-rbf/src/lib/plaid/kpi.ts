import { type NormalizedOrder } from '../commerce/kpi';

/**
 * Fetch transactions from Plaid
 */
export async function fetchPlaidTransactions(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const plaidClientId = process.env.PLAID_CLIENT_ID;
  const plaidSecret = process.env.PLAID_SECRET;
  const plaidEnv = process.env.PLAID_ENV || 'sandbox';

  const response = await fetch(`https://${plaidEnv}.plaid.com/transactions/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: plaidClientId,
      secret: plaidSecret,
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
      end_date: endDate.toISOString().split('T')[0]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Plaid API error: ${error.error_message}`);
  }

  const data = await response.json();
  return data.transactions || [];
}

/**
 * Infer revenue from Plaid transactions
 *
 * Revenue heuristics:
 * - Positive amounts (deposits)
 * - From payment processors (Stripe, Square, PayPal, etc.)
 * - Exclude transfers, refunds, fees
 */
export function inferRevenueFromTransactions(transactions: any[]): NormalizedOrder[] {
  const revenueKeywords = [
    'stripe',
    'square',
    'paypal',
    'shopify',
    'revenue',
    'sales',
    'payment',
    'deposit'
  ];

  const excludeKeywords = [
    'refund',
    'fee',
    'transfer',
    'withdrawal',
    'tax',
    'interest'
  ];

  return transactions
    .filter(tx => {
      // Only positive amounts (credits/deposits)
      if (tx.amount <= 0) return false;

      const name = (tx.name || '').toLowerCase();
      const category = (tx.category || []).join(' ').toLowerCase();

      // Check if likely revenue
      const isRevenue = revenueKeywords.some(keyword =>
        name.includes(keyword) || category.includes(keyword)
      );

      // Exclude certain transaction types
      const shouldExclude = excludeKeywords.some(keyword =>
        name.includes(keyword) || category.includes(keyword)
      );

      return isRevenue && !shouldExclude;
    })
    .map(tx => normalizePlaidTransaction(tx));
}

/**
 * Normalize Plaid transaction to common order format
 */
export function normalizePlaidTransaction(transaction: any): NormalizedOrder {
  return {
    id: transaction.transaction_id,
    created_at: transaction.date + 'T12:00:00Z', // Plaid only has date, not time
    total_price: Math.abs(transaction.amount), // Plaid uses negative for credits
    subtotal_price: Math.abs(transaction.amount),
    total_discounts: 0,
    total_line_items_price: Math.abs(transaction.amount),
    financial_status: 'paid',
    customer_id: undefined,
    line_items_count: 1,
    currency: transaction.iso_currency_code || 'USD',
    cancelled_at: undefined
  };
}
