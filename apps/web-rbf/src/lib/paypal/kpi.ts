import { type NormalizedOrder } from '../commerce/kpi';

/**
 * Fetch transactions from PayPal Transaction Search API
 *
 * Note: Transaction Search API requires special activation.
 * After activation, wait 9 hours before using.
 */
export async function fetchPayPalTransactions(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  environment: 'production' | 'sandbox' = 'sandbox'
): Promise<any[]> {
  const baseUrl = environment === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  // Format dates as required by PayPal (YYYY-MM-DDTHH:MM:SSZ)
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  const params = new URLSearchParams({
    start_date: startDateStr,
    end_date: endDateStr,
    fields: 'all', // Get all available fields
    page_size: '500' // Max transactions per request
  });

  const response = await fetch(`${baseUrl}/v1/reporting/transactions?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`PayPal API error: ${error.message || 'Unknown error'}`);
  }

  const data = await response.json();

  // PayPal returns paginated results
  let transactions = data.transaction_details || [];

  // Handle pagination if more results exist
  let nextPageLink = data.links?.find((link: any) => link.rel === 'next');
  while (nextPageLink) {
    const nextResponse = await fetch(nextPageLink.href, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!nextResponse.ok) break;

    const nextData = await nextResponse.json();
    transactions = transactions.concat(nextData.transaction_details || []);
    nextPageLink = nextData.links?.find((link: any) => link.rel === 'next');
  }

  return transactions;
}

/**
 * Normalize PayPal transaction to common order format
 *
 * PayPal transactions include various types:
 * - T0000: Payment (sale)
 * - T0001: Refund
 * - T0002: Currency conversion
 * - T0003: Credit
 * etc.
 */
export function normalizePayPalTransaction(transaction: any): NormalizedOrder {
  const transactionInfo = transaction.transaction_info || {};
  const payerInfo = transaction.payer_info || {};

  // Extract amount (PayPal uses string with currency)
  const amountStr = transactionInfo.transaction_amount?.value || '0';
  const amount = parseFloat(amountStr);

  // Determine financial status based on transaction status
  let financial_status: NormalizedOrder['financial_status'] = 'pending';
  const status = transactionInfo.transaction_status?.toUpperCase();

  if (status === 'S' || status === 'SUCCESS' || status === 'COMPLETED') {
    financial_status = 'paid';
  } else if (status === 'V' || status === 'VOIDED') {
    financial_status = 'voided';
  } else if (status === 'F' || status === 'FAILED') {
    financial_status = 'failed';
  } else if (status === 'P' || status === 'PENDING') {
    financial_status = 'pending';
  }

  // Extract fees
  const feeAmount = parseFloat(transactionInfo.fee_amount?.value || '0');

  // Calculate net amount (gross - fees)
  const netAmount = amount - Math.abs(feeAmount);

  return {
    id: transactionInfo.transaction_id || transaction.transaction_id,
    created_at: transactionInfo.transaction_initiation_date || transactionInfo.transaction_updated_date || new Date().toISOString(),
    total_price: amount,
    subtotal_price: amount,
    total_discounts: 0,
    total_line_items_price: amount,
    financial_status,
    customer_id: payerInfo.payer_id || payerInfo.email_address,
    line_items_count: 1,
    currency: transactionInfo.transaction_amount?.currency_code || 'USD',
    cancelled_at: status === 'V' || status === 'VOIDED' ? transactionInfo.transaction_updated_date : undefined
  };
}

/**
 * Fetch refunds from PayPal transactions
 *
 * PayPal refunds are identified by transaction_event_code T0001
 */
export async function fetchPayPalRefunds(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  environment: 'production' | 'sandbox' = 'sandbox'
): Promise<any[]> {
  // Fetch all transactions, then filter for refunds
  const transactions = await fetchPayPalTransactions(accessToken, startDate, endDate, environment);

  const refunds = transactions.filter((transaction: any) => {
    const eventCode = transaction.transaction_info?.transaction_event_code;
    // T0001 = Refund, T0004 = Reversal
    return eventCode === 'T0001' || eventCode === 'T0004';
  });

  return refunds;
}

/**
 * Normalize PayPal refund to common order format
 */
export function normalizePayPalRefund(refund: any): NormalizedOrder {
  const normalized = normalizePayPalTransaction(refund);

  // Make amount negative for refunds
  return {
    ...normalized,
    total_price: -Math.abs(normalized.total_price),
    subtotal_price: -Math.abs(normalized.subtotal_price),
    total_line_items_price: -Math.abs(normalized.total_line_items_price),
    financial_status: 'refunded',
    cancelled_at: refund.transaction_info?.transaction_updated_date || normalized.created_at
  };
}

/**
 * Filter sales transactions (excluding refunds, fees, etc.)
 */
export function filterPayPalSales(transactions: any[]): any[] {
  return transactions.filter((transaction: any) => {
    const eventCode = transaction.transaction_info?.transaction_event_code;

    // Include only sales/payments
    // T0000 = General Payment
    // T0006 = Payment (eCheck)
    // T0007 = Payment Authorization
    // T0013 = Buyer Credit Payment
    const salesEventCodes = ['T0000', 'T0006', 'T0007', 'T0013'];

    return salesEventCodes.includes(eventCode);
  });
}
