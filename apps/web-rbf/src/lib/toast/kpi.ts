import { type NormalizedOrder } from '../commerce/kpi';

/**
 * Fetch orders from Toast POS API
 *
 * Toast uses a REST API to fetch orders/checks
 */
export async function fetchToastOrders(
  accessToken: string,
  restaurantGuid: string,
  startDate: Date,
  endDate: Date,
  environment: 'production' | 'sandbox' = 'sandbox'
): Promise<any[]> {
  const baseUrl = environment === 'production'
    ? 'https://ws-api.toasttab.com'
    : 'https://ws-sandbox-api.toasttab.com';

  // Toast uses "checks" as their order concept
  const response = await fetch(`${baseUrl}/orders/v2/orders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Toast-Restaurant-External-ID': restaurantGuid
    },
    // Toast pagination and filtering
    // Adjust based on actual Toast API documentation
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Toast API error: ${error.message || 'Unknown error'}`);
  }

  const data = await response.json();

  // Filter orders by date range
  const orders = (data.data || data || []).filter((order: any) => {
    const orderDate = new Date(order.createdDate || order.created_date);
    return orderDate >= startDate && orderDate <= endDate;
  });

  return orders;
}

/**
 * Normalize Toast order/check to common order format
 *
 * Toast orders contain checks with selections (items)
 */
export function normalizeToastOrder(order: any): NormalizedOrder {
  // Toast amounts are typically in cents or smallest currency unit
  const totalAmount = order.totalAmount || order.total || 0;
  const discountAmount = order.appliedDiscounts?.reduce((sum: number, d: any) => sum + (d.discountAmount || 0), 0) || 0;
  const taxAmount = order.taxAmount || order.tax || 0;

  // Convert from cents to dollars (if applicable)
  const total_price = totalAmount / 100;
  const total_discounts = discountAmount / 100;
  const total_tax = taxAmount / 100;
  const subtotal_price = total_price - total_tax;

  // Determine financial status
  let financial_status: NormalizedOrder['financial_status'] = 'pending';
  if (order.paidDate || order.paid_date) {
    financial_status = 'paid';
  } else if (order.voidDate || order.void_date || order.deletedDate) {
    financial_status = 'voided';
  }

  // Count line items (selections in Toast terminology)
  const line_items_count = order.selections?.length || order.items?.length || 0;

  return {
    id: order.guid || order.id || order.checkId,
    created_at: order.createdDate || order.created_date || new Date().toISOString(),
    total_price,
    subtotal_price,
    total_discounts,
    total_line_items_price: subtotal_price + total_discounts,
    financial_status,
    customer_id: order.customerId || order.customer?.guid,
    line_items_count,
    currency: 'USD', // Toast primarily operates in USD
    cancelled_at: order.voidDate || order.void_date || order.deletedDate || undefined
  };
}

/**
 * Fetch refunds from Toast
 *
 * Toast handles refunds as part of orders/checks
 */
export async function fetchToastRefunds(
  accessToken: string,
  restaurantGuid: string,
  startDate: Date,
  endDate: Date,
  environment: 'production' | 'sandbox' = 'sandbox'
): Promise<any[]> {
  // In Toast, refunds are typically tracked as negative payments or voided checks
  // We'll fetch orders and filter for refunded/voided ones
  const orders = await fetchToastOrders(accessToken, restaurantGuid, startDate, endDate, environment);

  const refunds = orders.filter((order: any) => {
    return order.voidDate || order.void_date || order.voided === true;
  });

  return refunds;
}

/**
 * Normalize Toast refund to common order format
 */
export function normalizeToastRefund(refund: any): NormalizedOrder {
  const normalized = normalizeToastOrder(refund);

  // Make amounts negative for refunds
  return {
    ...normalized,
    total_price: -Math.abs(normalized.total_price),
    subtotal_price: -Math.abs(normalized.subtotal_price),
    total_line_items_price: -Math.abs(normalized.total_line_items_price),
    financial_status: 'refunded',
    cancelled_at: refund.voidDate || refund.void_date || refund.deletedDate
  };
}
