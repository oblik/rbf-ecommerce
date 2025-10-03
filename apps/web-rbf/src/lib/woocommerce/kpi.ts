import { type NormalizedOrder } from '../commerce/kpi';

/**
 * Generate OAuth 1.0a signature for WooCommerce REST API
 *
 * WooCommerce uses OAuth 1.0a for authentication
 */
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string
): string {
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // Create signing key (consumer_secret&)
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  // For Node.js environment, we'll use a simple HMAC-SHA1
  // In production, you might want to use crypto-js or similar
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
}

/**
 * Fetch orders from WooCommerce REST API
 */
export async function fetchWooCommerceOrders(
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  // Clean store URL
  const baseUrl = storeUrl.replace(/\/$/, '');

  // WooCommerce REST API v3 endpoint
  const endpoint = `${baseUrl}/wp-json/wc/v3/orders`;

  // Format dates for WooCommerce (ISO 8601)
  const afterDate = startDate.toISOString();
  const beforeDate = endDate.toISOString();

  // Build query parameters
  const params = new URLSearchParams({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    after: afterDate,
    before: beforeDate,
    per_page: '100', // Max per page
    status: 'any' // Get all statuses
  });

  const url = `${endpoint}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`WooCommerce API error: ${error.message || response.statusText}`);
  }

  let orders = await response.json();

  // Handle pagination (WooCommerce uses Link header)
  const linkHeader = response.headers.get('Link');
  if (linkHeader && linkHeader.includes('rel="next"')) {
    // For simplicity, we'll just fetch first page
    // In production, you'd want to handle pagination properly
    console.log('[WooCommerce] Note: More pages available, only fetching first 100 orders');
  }

  return orders;
}

/**
 * Normalize WooCommerce order to common order format
 */
export function normalizeWooCommerceOrder(order: any): NormalizedOrder {
  const totalPrice = parseFloat(order.total || '0');
  const totalDiscount = parseFloat(order.discount_total || '0');
  const totalTax = parseFloat(order.total_tax || '0');
  const shippingTotal = parseFloat(order.shipping_total || '0');

  // Calculate subtotal (total - tax - shipping)
  const subtotalPrice = totalPrice - totalTax - shippingTotal;

  // Determine financial status
  let financial_status: NormalizedOrder['financial_status'] = 'pending';
  const status = order.status?.toLowerCase();

  if (status === 'completed' || status === 'processing') {
    financial_status = 'paid';
  } else if (status === 'refunded') {
    financial_status = 'refunded';
  } else if (status === 'cancelled' || status === 'failed') {
    financial_status = 'voided';
  } else if (status === 'on-hold' || status === 'pending') {
    financial_status = 'pending';
  }

  // Count line items
  const lineItemsCount = order.line_items?.length || 0;

  return {
    id: order.id?.toString() || order.number?.toString(),
    created_at: order.date_created || order.date_created_gmt || new Date().toISOString(),
    total_price: totalPrice,
    subtotal_price: subtotalPrice,
    total_discounts: totalDiscount,
    total_line_items_price: subtotalPrice + totalDiscount,
    financial_status,
    customer_id: order.customer_id?.toString(),
    line_items_count: lineItemsCount,
    currency: order.currency || 'USD',
    cancelled_at: status === 'cancelled' || status === 'refunded' ? order.date_modified : undefined
  };
}

/**
 * Fetch refunds from WooCommerce
 *
 * WooCommerce handles refunds as separate objects linked to orders
 */
export async function fetchWooCommerceRefunds(
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  // First, fetch orders that have been refunded
  const orders = await fetchWooCommerceOrders(
    storeUrl,
    consumerKey,
    consumerSecret,
    startDate,
    endDate
  );

  // Filter for refunded orders
  const refundedOrders = orders.filter((order: any) =>
    order.status === 'refunded' || parseFloat(order.refunds_total || '0') > 0
  );

  return refundedOrders;
}

/**
 * Normalize WooCommerce refund to common order format
 */
export function normalizeWooCommerceRefund(order: any): NormalizedOrder {
  const normalized = normalizeWooCommerceOrder(order);

  // Get refund amount
  const refundAmount = parseFloat(order.refunds_total || order.total || '0');

  return {
    ...normalized,
    total_price: -Math.abs(refundAmount),
    subtotal_price: -Math.abs(refundAmount),
    total_line_items_price: -Math.abs(refundAmount),
    financial_status: 'refunded',
    cancelled_at: order.date_modified || order.date_created
  };
}
