'use client';

import { useBusinessRegistry, getRiskLevel } from '@/hooks/useBusinessRegistry';
import { RiskBadge, HealthScore } from './HealthScoreIndicator';
import { BusinessMetrics } from './BusinessMetrics';

interface BusinessProfileProps {
  address: string;
}

export function BusinessProfile({ address }: BusinessProfileProps) {
  const { useBusinessProfile, useBusinessHealth, useIsVerified } = useBusinessRegistry();
  
  const { data: profile, isLoading: profileLoading, error: profileError } = useBusinessProfile(address);
  const { data: health, isLoading: healthLoading } = useBusinessHealth(address);
  const { data: isVerified, isLoading: verifiedLoading } = useIsVerified(address);

  if (profileLoading || healthLoading || verifiedLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Business Not Found</h3>
          <p className="text-gray-600">This business is not registered in our system.</p>
        </div>
      </div>
    );
  }

  const healthScore = health?.healthScore || BigInt(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-600">
              Registered {new Date(Number(profile.registeredAt) * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isVerified && (
              <span className="px-2 py-1 text-xs font-medium bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                Verified
              </span>
            )}
            <RiskBadge riskLevel={getRiskLevel(healthScore)} />
          </div>
        </div>
        
        <HealthScore score={healthScore} />
      </div>

      {/* Business Metrics */}
      <BusinessMetrics address={address} />
    </div>
  );
}