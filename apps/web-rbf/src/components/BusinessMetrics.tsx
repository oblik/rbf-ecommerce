'use client';

import { formatUnits } from 'viem';
import { useBusinessRegistry, formatRepaymentRate } from '@/hooks/useBusinessRegistry';
import { CompactHealthScore } from './HealthScoreIndicator';

interface BusinessMetricsProps {
  address: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

function MetricCard({ title, value, subtitle, trend, className = "" }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    neutral: null,
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {trend && (
          <div className={`flex items-center ${trendColors[trend]}`}>
            {trendIcons[trend]}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

interface PerformanceOverviewProps {
  profile: any;
  health: any;
}

function PerformanceOverview({ profile, health }: PerformanceOverviewProps) {
  const totalRaised = Number(formatUnits(profile?.totalRaised || BigInt(0), 6));
  const totalRepaid = Number(formatUnits(profile?.totalRepaid || BigInt(0), 6));
  const repaymentRate = Number(health?.repaymentRate || 0) / 100;
  const successRate = Number(health?.successRate || 0) / 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard 
        title="Total Raised" 
        value={`$${totalRaised.toLocaleString()}`}
        subtitle="Lifetime funding"
        trend={totalRaised > 0 ? 'up' : 'neutral'}
      />
      <MetricCard 
        title="Total Repaid" 
        value={`$${totalRepaid.toLocaleString()}`}
        subtitle="Lifetime repayments"
        trend={totalRepaid > totalRaised ? 'up' : totalRepaid > 0 ? 'neutral' : 'down'}
      />
      <MetricCard 
        title="Repayment Rate" 
        value={`${repaymentRate.toFixed(1)}%`}
        subtitle="On-time payments"
        trend={repaymentRate >= 90 ? 'up' : repaymentRate >= 70 ? 'neutral' : 'down'}
      />
      <MetricCard 
        title="Success Rate" 
        value={`${successRate.toFixed(1)}%`}
        subtitle="Funded campaigns"
        trend={successRate >= 80 ? 'up' : successRate >= 60 ? 'neutral' : 'down'}
      />
    </div>
  );
}

interface CampaignStatsProps {
  profile: any;
}

function CampaignStats({ profile }: CampaignStatsProps) {
  const totalCampaigns = Number(profile?.campaignCount || 0);
  const successfulCampaigns = Number(profile?.successfulCampaigns || 0);
  const activeInvestors = Number(profile?.activeInvestors || 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Campaigns" 
          value={totalCampaigns}
          subtitle="All time"
        />
        <MetricCard 
          title="Successful Campaigns" 
          value={successfulCampaigns}
          subtitle={`${totalCampaigns > 0 ? ((successfulCampaigns / totalCampaigns) * 100).toFixed(0) : 0}% success rate`}
        />
        <MetricCard 
          title="Active Investors" 
          value={activeInvestors}
          subtitle="Current backers"
        />
      </div>
    </div>
  );
}

interface PaymentHistoryProps {
  profile: any;
}

function PaymentHistory({ profile }: PaymentHistoryProps) {
  const onTimePayments = Number(profile?.onTimePayments || 0);
  const latePayments = Number(profile?.latePayments || 0);
  const defaultedAmount = Number(formatUnits(profile?.defaultedAmount || BigInt(0), 6));
  
  const totalPayments = onTimePayments + latePayments;
  const onTimePercentage = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
      
      {totalPayments > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Payment Performance</span>
            <span className="text-sm font-bold text-gray-900">{onTimePercentage.toFixed(1)}% on time</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${onTimePercentage}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="On-Time Payments" 
          value={onTimePayments}
          className="border-green-200 bg-green-50"
          trend={onTimePercentage >= 90 ? 'up' : 'neutral'}
        />
        <MetricCard 
          title="Late Payments" 
          value={latePayments}
          className="border-yellow-200 bg-yellow-50"
          trend={latePayments === 0 ? 'up' : 'down'}
        />
        <MetricCard 
          title="Defaulted Amount" 
          value={`$${defaultedAmount.toLocaleString()}`}
          className="border-red-200 bg-red-50"
          trend={defaultedAmount === 0 ? 'up' : 'down'}
        />
      </div>
    </div>
  );
}

interface BusinessMetricsSummaryProps {
  address: string;
  compact?: boolean;
}

export function BusinessMetricsSummary({ address, compact = false }: BusinessMetricsSummaryProps) {
  const { useBusinessProfile, useBusinessHealth } = useBusinessRegistry();
  
  const { data: profile, isLoading: profileLoading } = useBusinessProfile(address);
  const { data: health, isLoading: healthLoading } = useBusinessHealth(address);

  if (profileLoading || healthLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded-lg h-24"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-500 text-sm">
        Business metrics not available
      </div>
    );
  }

  const healthScore = health?.healthScore || BigInt(0);
  const totalRaised = Number(formatUnits(profile.totalRaised || BigInt(0), 6));
  const campaignCount = Number(profile.campaignCount || 0);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <CompactHealthScore score={healthScore} showLabel />
          <div className="text-sm">
            <p className="font-medium text-gray-900">${totalRaised.toLocaleString()} raised</p>
            <p className="text-gray-500">{campaignCount} campaigns</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PerformanceOverview profile={profile} health={health} />
      <CampaignStats profile={profile} />
      <PaymentHistory profile={profile} />
    </div>
  );
}

export function BusinessMetrics({ address }: BusinessMetricsProps) {
  return <BusinessMetricsSummary address={address} compact={false} />;
}