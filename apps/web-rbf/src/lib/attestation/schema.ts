/**
 * Attestation v1 - Canonical Schema
 *
 * Rules:
 * - Sorted keys (alphabetical)
 * - Fixed decimal precision (2 decimals for currency, 4 for rates)
 * - No PII
 * - Deterministic serialization
 */

export interface AttestationV1 {
  schemaVersion: '1.0.0';

  period: {
    start: string; // ISO 8601
    end: string;
    timezone: string; // IANA
  };

  merchant: {
    merchantId: string; // Business wallet address
    platformId?: string; // Optional internal ID
    currency: string; // e.g., 'USD'
  };

  metrics: {
    // Revenue
    gross_sales: string; // Fixed 2 decimals, e.g., "45000.00"
    discounts: string;
    refunds: string;
    net_sales: string;

    // Volume
    orders_count: number;
    items_sold: number;

    // Value
    aov: string; // Average order value, 2 decimals

    // Customers
    new_customers: number;
    returning_customer_rate: string; // 4 decimals, e.g., "0.4200"
    repeat_purchase_rate: string;

    // Pricing
    discount_penetration: string;
    discount_rate: string;

    // Trend
    growth_t30?: string; // Optional, 4 decimals

    // Risk (if available)
    chargebacks?: number;
  };

  // Attestation metadata
  nonce: string; // Unique per attestation (timestamp or UUID)
  timestamp: string; // ISO 8601 when created
  previousCid?: string; // Link to previous month's IPFS CID (chain attestations)
}

/**
 * Serialize attestation to canonical JSON string
 * (sorted keys, consistent formatting)
 */
export function serializeAttestation(attestation: AttestationV1): string {
  // Sort all keys recursively
  const sortObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }

    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObject(obj[key]);
    });
    return sorted;
  };

  const sorted = sortObject(attestation);
  return JSON.stringify(sorted, null, 2);
}

/**
 * Format number to fixed decimals string
 */
export function toFixed(value: number, decimals: number): string {
  return value.toFixed(decimals);
}
