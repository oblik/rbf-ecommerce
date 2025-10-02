/**
 * KPI Normalization & Computation
 *
 * Pure functions to compute key performance indicators from commerce data.
 * Definitions:
 * - Net sales = Gross - Discounts - Refunds (excludes taxes/shipping)
 * - All monetary values stored in original currency
 * - Windows: Trailing 30/90 days from provided timezone
 */

export interface NormalizedOrder {
  id: string;
  created_at: string; // ISO 8601
  total_price: number; // Gross including everything
  subtotal_price: number; // Before shipping/tax
  total_discounts: number;
  total_line_items_price: number; // Before discounts
  financial_status: string;
  customer_id?: string;
  line_items_count: number;
  currency: string;
  cancelled_at?: string;
}

export interface NormalizedRefund {
  id: string;
  created_at: string;
  order_id: string;
  total_refund: number;
  currency: string;
}

export interface NormalizedCustomer {
  id: string;
  created_at: string;
  orders_count: number;
  total_spent: number;
}

export interface KPIInput {
  orders: NormalizedOrder[];
  refunds: NormalizedRefund[];
  customers?: NormalizedCustomer[];
  timezone: string; // IANA timezone
  windowDays: 30 | 90;
  priorWindowDays?: 30 | 90; // For growth calculation
}

export interface KPIResult {
  // Sales metrics
  gross_sales: number;
  discounts: number;
  refunds: number;
  net_sales: number;

  // Volume metrics
  orders_count: number;
  items_sold: number;

  // Value metrics
  aov: number; // Average order value (net / orders)

  // Customer metrics
  new_customers: number;
  returning_customer_rate: number; // % of orders from existing customers
  repeat_purchase_rate: number; // % of customers who ordered >1 time

  // Pricing metrics
  discount_penetration: number; // % of orders with discount
  discount_rate: number; // discounts / gross

  // Trend metrics
  growth_t30?: number; // % growth vs prior 30 days (only if priorWindowDays provided)

  // Metadata
  currency: string;
  window_start: string; // ISO 8601
  window_end: string; // ISO 8601
  timezone: string;
  data_freshness: string; // ISO 8601 timestamp
}

/**
 * Compute KPIs for a given time window
 */
export function computeKPIs(input: KPIInput): KPIResult {
  const { orders, refunds, customers, timezone, windowDays } = input;

  // Determine window boundaries
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - windowDays);

  // Filter orders in window
  const ordersInWindow = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    return orderDate >= windowStart && orderDate <= now && o.financial_status !== 'voided';
  });

  // Filter refunds in window (based on refund date, not order date)
  const refundsInWindow = refunds.filter(r => {
    const refundDate = new Date(r.created_at);
    return refundDate >= windowStart && refundDate <= now;
  });

  // Sales metrics
  const gross_sales = ordersInWindow.reduce((sum, o) => sum + o.subtotal_price, 0);
  const discounts = ordersInWindow.reduce((sum, o) => sum + o.total_discounts, 0);
  const refunds_amount = refundsInWindow.reduce((sum, r) => sum + r.total_refund, 0);
  const net_sales = gross_sales - discounts - refunds_amount;

  // Volume metrics
  const orders_count = ordersInWindow.length;
  const items_sold = ordersInWindow.reduce((sum, o) => sum + o.line_items_count, 0);

  // Value metrics
  const aov = orders_count > 0 ? net_sales / orders_count : 0;

  // Customer metrics
  let new_customers = 0;
  let returning_customer_rate = 0;
  let repeat_purchase_rate = 0;

  if (customers && customers.length > 0) {
    // Customers created in window
    new_customers = customers.filter(c => {
      const created = new Date(c.created_at);
      return created >= windowStart && created <= now;
    }).length;

    // Orders from returning customers
    const returningOrders = ordersInWindow.filter(o => {
      if (!o.customer_id) return false;
      const customer = customers.find(c => c.id === o.customer_id);
      return customer && customer.orders_count > 1;
    }).length;

    returning_customer_rate = orders_count > 0 ? returningOrders / orders_count : 0;

    // Customers with repeat purchases
    const customerOrderCounts = new Map<string, number>();
    ordersInWindow.forEach(o => {
      if (o.customer_id) {
        customerOrderCounts.set(
          o.customer_id,
          (customerOrderCounts.get(o.customer_id) || 0) + 1
        );
      }
    });

    const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
    const totalCustomers = customerOrderCounts.size;
    repeat_purchase_rate = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;
  }

  // Pricing metrics
  const ordersWithDiscount = ordersInWindow.filter(o => o.total_discounts > 0).length;
  const discount_penetration = orders_count > 0 ? ordersWithDiscount / orders_count : 0;
  const discount_rate = gross_sales > 0 ? discounts / gross_sales : 0;

  // Currency (use first order's currency or default to USD)
  const currency = ordersInWindow[0]?.currency || 'USD';

  // Build result
  const result: KPIResult = {
    gross_sales,
    discounts,
    refunds: refunds_amount,
    net_sales,
    orders_count,
    items_sold,
    aov,
    new_customers,
    returning_customer_rate,
    repeat_purchase_rate,
    discount_penetration,
    discount_rate,
    currency,
    window_start: windowStart.toISOString(),
    window_end: now.toISOString(),
    timezone,
    data_freshness: now.toISOString()
  };

  // Growth calculation (if prior window requested)
  if (input.priorWindowDays) {
    const priorStart = new Date(windowStart);
    priorStart.setDate(priorStart.getDate() - input.priorWindowDays);
    const priorEnd = windowStart;

    const priorOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= priorStart && orderDate < priorEnd && o.financial_status !== 'voided';
    });

    const priorRefunds = refunds.filter(r => {
      const refundDate = new Date(r.created_at);
      return refundDate >= priorStart && refundDate < priorEnd;
    });

    const priorGross = priorOrders.reduce((sum, o) => sum + o.subtotal_price, 0);
    const priorDiscounts = priorOrders.reduce((sum, o) => sum + o.total_discounts, 0);
    const priorRefundsAmount = priorRefunds.reduce((sum, r) => sum + r.total_refund, 0);
    const priorNet = priorGross - priorDiscounts - priorRefundsAmount;

    result.growth_t30 = priorNet > 0 ? ((net_sales - priorNet) / priorNet) * 100 : 0;
  }

  return result;
}

/**
 * Format currency with appropriate precision
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Normalize Shopify order data
 */
export function normalizeShopifyOrder(shopifyOrder: any): NormalizedOrder {
  return {
    id: shopifyOrder.id?.toString() || '',
    created_at: shopifyOrder.created_at,
    total_price: parseFloat(shopifyOrder.total_price || '0'),
    subtotal_price: parseFloat(shopifyOrder.subtotal_price || '0'),
    total_discounts: parseFloat(shopifyOrder.total_discounts || '0'),
    total_line_items_price: parseFloat(shopifyOrder.total_line_items_price || '0'),
    financial_status: shopifyOrder.financial_status || 'pending',
    customer_id: shopifyOrder.customer?.id?.toString(),
    line_items_count: shopifyOrder.line_items?.length || 0,
    currency: shopifyOrder.currency || 'USD',
    cancelled_at: shopifyOrder.cancelled_at
  };
}

/**
 * Normalize Shopify refund data
 */
export function normalizeShopifyRefund(shopifyRefund: any, orderId: string): NormalizedRefund {
  const total = shopifyRefund.transactions?.reduce((sum: number, t: any) => {
    return sum + parseFloat(t.amount || '0');
  }, 0) || 0;

  return {
    id: shopifyRefund.id?.toString() || '',
    created_at: shopifyRefund.created_at,
    order_id: orderId,
    total_refund: total,
    currency: shopifyRefund.transactions?.[0]?.currency || 'USD'
  };
}

/**
 * Normalize Shopify customer data
 */
export function normalizeShopifyCustomer(shopifyCustomer: any): NormalizedCustomer {
  return {
    id: shopifyCustomer.id?.toString() || '',
    created_at: shopifyCustomer.created_at,
    orders_count: shopifyCustomer.orders_count || 0,
    total_spent: parseFloat(shopifyCustomer.total_spent || '0')
  };
}
