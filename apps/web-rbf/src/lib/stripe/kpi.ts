import { KPIResult, type NormalizedOrder, type NormalizedRefund } from '../commerce/kpi';

/**
 * Normalize Stripe charge to common order format
 */
export function normalizeStripeCharge(charge: any): NormalizedOrder {
  return {
    id: charge.id,
    created_at: new Date(charge.created * 1000).toISOString(),
    total_price: charge.amount / 100, // Convert from cents
    subtotal_price: charge.amount / 100,
    total_discounts: 0, // Stripe doesn't track discounts directly
    total_line_items_price: charge.amount / 100,
    financial_status: charge.paid ? 'paid' : 'pending',
    customer_id: charge.customer || undefined,
    line_items_count: 1, // Charges don't have line items
    currency: charge.currency.toUpperCase(),
    cancelled_at: charge.refunded ? new Date(charge.created * 1000).toISOString() : undefined
  };
}

/**
 * Normalize Stripe refund to common format
 */
export function normalizeStripeRefund(refund: any): NormalizedRefund {
  return {
    id: refund.id,
    created_at: new Date(refund.created * 1000).toISOString(),
    order_id: refund.charge,
    total_refund: refund.amount / 100, // Convert from cents
    currency: refund.currency.toUpperCase()
  };
}

/**
 * Fetch charges from Stripe API
 */
export async function fetchStripeCharges(
  accessToken: string,
  startDate: Date,
  limit: number = 100
): Promise<any[]> {
  const url = new URL('https://api.stripe.com/v1/charges');
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('created[gte]', Math.floor(startDate.getTime() / 1000).toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Stripe-Version': '2023-10-16'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch refunds from Stripe API
 */
export async function fetchStripeRefunds(
  accessToken: string,
  startDate: Date,
  limit: number = 100
): Promise<any[]> {
  const url = new URL('https://api.stripe.com/v1/refunds');
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('created[gte]', Math.floor(startDate.getTime() / 1000).toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Stripe-Version': '2023-10-16'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}
