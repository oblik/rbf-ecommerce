import { KPIResult } from '../commerce/kpi';
import { AttestationV1, serializeAttestation, toFixed } from './schema';
import { keccak256, toBytes } from 'viem';

/**
 * Build canonical attestation from KPI data
 */
export function buildAttestation(
  kpis: KPIResult,
  merchantAddress: string,
  previousCid?: string
): AttestationV1 {
  const attestation: AttestationV1 = {
    schemaVersion: '1.0.0',

    period: {
      start: kpis.window_start,
      end: kpis.window_end,
      timezone: kpis.timezone
    },

    merchant: {
      merchantId: merchantAddress,
      currency: kpis.currency
    },

    metrics: {
      gross_sales: toFixed(kpis.gross_sales, 2),
      discounts: toFixed(kpis.discounts, 2),
      refunds: toFixed(kpis.refunds, 2),
      net_sales: toFixed(kpis.net_sales, 2),
      orders_count: kpis.orders_count,
      items_sold: kpis.items_sold,
      aov: toFixed(kpis.aov, 2),
      new_customers: kpis.new_customers,
      returning_customer_rate: toFixed(kpis.returning_customer_rate, 4),
      repeat_purchase_rate: toFixed(kpis.repeat_purchase_rate, 4),
      discount_penetration: toFixed(kpis.discount_penetration, 4),
      discount_rate: toFixed(kpis.discount_rate, 4),
      growth_t30: kpis.growth_t30 !== undefined ? toFixed(kpis.growth_t30, 4) : undefined
    },

    nonce: Date.now().toString(),
    timestamp: new Date().toISOString(),
    previousCid
  };

  return attestation;
}

/**
 * Hash attestation (keccak256)
 */
export function hashAttestation(attestation: AttestationV1): `0x${string}` {
  const canonical = serializeAttestation(attestation);
  const bytes = toBytes(canonical);
  return keccak256(bytes);
}
