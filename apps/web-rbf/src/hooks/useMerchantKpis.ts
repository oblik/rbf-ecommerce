import { useState, useEffect } from 'react';
import type { KPIResult } from '@/lib/commerce/kpi';

interface UseMerchantKpisOptions {
  shop?: string;
  accessToken?: string;
  timezone?: string;
  windowDays?: 30 | 90;
  includeGrowth?: boolean;
  enabled?: boolean; // Allow conditional fetching
}

interface UseMerchantKpisResult {
  kpis: KPIResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache merchant KPIs
 *
 * Usage:
 * const { kpis, loading, error } = useMerchantKpis({
 *   shop: 'mystore.myshopify.com',
 *   accessToken: 'shpat_xxx',
 *   windowDays: 30,
 *   includeGrowth: true
 * });
 */
export function useMerchantKpis(options: UseMerchantKpisOptions): UseMerchantKpisResult {
  const {
    shop,
    accessToken,
    timezone = 'America/New_York',
    windowDays = 30,
    includeGrowth = true,
    enabled = true
  } = options;

  const [kpis, setKpis] = useState<KPIResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = async () => {
    if (!shop || !accessToken) {
      setError('Missing shop or accessToken');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        shop,
        accessToken,
        timezone,
        windowDays: windowDays.toString(),
        includeGrowth: includeGrowth.toString()
      });

      const response = await fetch(`/api/commerce/kpis?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch KPIs');
      }

      const data = await response.json();

      if (data.success && data.kpis) {
        setKpis(data.kpis);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[useMerchantKpis] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && shop && accessToken) {
      fetchKpis();
    }
  }, [shop, accessToken, timezone, windowDays, includeGrowth, enabled]);

  return {
    kpis,
    loading,
    error,
    refetch: fetchKpis
  };
}
