'use client';

import { useMerchantKpis } from '@/hooks/useMerchantKpis';
import { formatCurrency, formatPercent, type KPIResult } from '@/lib/commerce/kpi';

interface MerchantKPICardsProps {
  shop: string;
  accessToken: string;
  timezone?: string;
  windowDays?: 30 | 90;
}

export function MerchantKPICards({ shop, accessToken, timezone, windowDays = 30 }: MerchantKPICardsProps) {
  const { kpis, loading, error } = useMerchantKpis({
    shop,
    accessToken,
    timezone,
    windowDays,
    includeGrowth: true
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800 text-sm">
          ⚠️ Unable to load merchant KPIs: {error}
        </p>
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  const freshness = new Date(kpis.data_freshness);
  const freshnessText = freshness.toLocaleString('en-US', {
    timeZone: kpis.timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Business Performance (Last {windowDays} Days)
        </h3>
        <span className="text-xs text-gray-500">
          Data fresh as of {freshnessText}
        </span>
      </div>

      {/* Sales Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Revenue</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Net Sales"
            value={formatCurrency(kpis.net_sales, kpis.currency)}
            growth={kpis.growth_t30}
            status={getGrowthStatus(kpis.growth_t30)}
          />
          <KPICard
            label="Gross Sales"
            value={formatCurrency(kpis.gross_sales, kpis.currency)}
          />
          <KPICard
            label="Discounts"
            value={formatCurrency(kpis.discounts, kpis.currency)}
          />
          <KPICard
            label="Refunds"
            value={formatCurrency(kpis.refunds, kpis.currency)}
            status={kpis.refunds / kpis.gross_sales > 0.1 ? 'warning' : 'good'}
          />
        </div>
      </div>

      {/* Volume Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Volume & Value</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard
            label="Orders"
            value={kpis.orders_count.toLocaleString()}
          />
          <KPICard
            label="Items Sold"
            value={kpis.items_sold.toLocaleString()}
          />
          <KPICard
            label="Avg Order Value"
            value={formatCurrency(kpis.aov, kpis.currency)}
          />
        </div>
      </div>

      {/* Customer Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Customers</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard
            label="New Customers"
            value={kpis.new_customers.toLocaleString()}
          />
          <KPICard
            label="Returning Rate"
            value={formatPercent(kpis.returning_customer_rate)}
            status={kpis.returning_customer_rate > 0.3 ? 'good' : 'warning'}
          />
          <KPICard
            label="Repeat Purchase Rate"
            value={formatPercent(kpis.repeat_purchase_rate)}
            status={kpis.repeat_purchase_rate > 0.2 ? 'good' : 'warning'}
          />
        </div>
      </div>

      {/* Pricing Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Pricing Strategy</h4>
        <div className="grid grid-cols-2 gap-4">
          <KPICard
            label="Discount Penetration"
            value={formatPercent(kpis.discount_penetration)}
            tooltip="% of orders with a discount applied"
          />
          <KPICard
            label="Discount Rate"
            value={formatPercent(kpis.discount_rate)}
            tooltip="Discounts as % of gross sales"
            status={kpis.discount_rate > 0.2 ? 'warning' : 'good'}
          />
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string | number;
  growth?: number;
  status?: 'good' | 'warning' | 'bad';
  tooltip?: string;
}

function KPICard({ label, value, growth, status, tooltip }: KPICardProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">{label}</span>
        {tooltip && (
          <span className="text-gray-400 cursor-help" title={tooltip}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {growth !== undefined && (
          <span className={`text-sm font-medium ${
            growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {growth > 0 ? '↑' : growth < 0 ? '↓' : '→'} {Math.abs(growth).toFixed(1)}%
          </span>
        )}
        {status === 'good' && <span className="text-green-600 text-lg">✓</span>}
        {status === 'warning' && <span className="text-yellow-600 text-lg">⚠</span>}
        {status === 'bad' && <span className="text-red-600 text-lg">✗</span>}
      </div>
    </div>
  );
}

function getGrowthStatus(growth?: number): 'good' | 'warning' | 'bad' | undefined {
  if (growth === undefined) return undefined;
  if (growth > 10) return 'good';
  if (growth < -10) return 'bad';
  return undefined;
}
