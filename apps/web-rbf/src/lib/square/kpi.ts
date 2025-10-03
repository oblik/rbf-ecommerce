import { type NormalizedOrder } from '../commerce/kpi';

/**
 * Fetch orders from Square using the Orders API
 */
export async function fetchSquareOrders(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  environment: 'production' | 'sandbox' = 'sandbox'
): Promise<any[]> {
  const baseUrl = environment === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

  const response = await fetch(`${baseUrl}/v2/orders/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2025-01-23'
    },
    body: JSON.stringify({
      query: {
        filter: {
          date_time_filter: {
            created_at: {
              start_at: startDate.toISOString(),
              end_at: endDate.toISOString()
            }
          },
          state_filter: {
            states: ['COMPLETED', 'OPEN'] // Include completed and open orders
          }
        },
        sort: {
          sort_field: 'CREATED_AT',
          sort_order: 'DESC'
        }
      },
      limit: 500 // Max per request
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Square API error: ${error.errors?.[0]?.detail || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.orders || [];
}

/**
 * Normalize Square order to common order format
 */
export function normalizeSquareOrder(order: any): NormalizedOrder {
  const totalMoney = order.total_money?.amount || 0;
  const totalDiscountMoney = order.total_discount_money?.amount || 0;
  const totalTaxMoney = order.total_tax_money?.amount || 0;
  const serviceChargeMoney = order.total_service_charge_money?.amount || 0;

  // Square uses smallest currency unit (cents for USD)
  const total_price = totalMoney / 100;
  const total_discounts = totalDiscountMoney / 100;
  const total_tax = totalTaxMoney / 100;

  // Calculate subtotal (before tax and service charges)
  const subtotal_price = total_price - total_tax - (serviceChargeMoney / 100);

  // Determine financial status
  let financial_status: NormalizedOrder['financial_status'] = 'pending';
  if (order.state === 'COMPLETED') {
    financial_status = 'paid';
  } else if (order.state === 'CANCELED') {
    financial_status = 'refunded';
  }

  return {
    id: order.id,
    created_at: order.created_at,
    total_price,
    subtotal_price,
    total_discounts,
    total_line_items_price: subtotal_price + total_discounts, // Gross before discounts
    financial_status,
    customer_id: order.customer_id,
    line_items_count: order.line_items?.length || 0,
    currency: order.total_money?.currency || 'USD',
    cancelled_at: order.state === 'CANCELED' ? order.updated_at : undefined
  };
}

/**
 * Fetch refunds from Square
 */
export async function fetchSquareRefunds(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  environment: 'production' | 'sandbox' = 'sandbox'
): Promise<any[]> {
  const baseUrl = environment === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

  // First, get all payments in the date range
  const response = await fetch(`${baseUrl}/v2/payments`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2025-01-23'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Square API error: ${error.errors?.[0]?.detail || 'Unknown error'}`);
  }

  const data = await response.json();
  const payments = data.payments || [];

  // Filter refunds from payments
  const refunds: any[] = [];
  for (const payment of payments) {
    if (payment.refund_ids && payment.refund_ids.length > 0) {
      // Fetch refund details
      for (const refundId of payment.refund_ids) {
        try {
          const refundResponse = await fetch(`${baseUrl}/v2/refunds/${refundId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Square-Version': '2025-01-23'
            }
          });

          if (refundResponse.ok) {
            const refundData = await refundResponse.json();
            const refundCreatedAt = new Date(refundData.refund.created_at);

            // Filter by date range
            if (refundCreatedAt >= startDate && refundCreatedAt <= endDate) {
              refunds.push(refundData.refund);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch refund ${refundId}:`, error);
        }
      }
    }
  }

  return refunds;
}

/**
 * Normalize Square refund to common order format
 */
export function normalizeSquareRefund(refund: any): NormalizedOrder {
  const amountMoney = refund.amount_money?.amount || 0;
  const total_price = amountMoney / 100;

  return {
    id: refund.id,
    created_at: refund.created_at,
    total_price: -total_price, // Negative for refund
    subtotal_price: -total_price,
    total_discounts: 0,
    total_line_items_price: -total_price,
    financial_status: 'refunded',
    customer_id: undefined,
    line_items_count: 0,
    currency: refund.amount_money?.currency || 'USD',
    cancelled_at: refund.created_at
  };
}
