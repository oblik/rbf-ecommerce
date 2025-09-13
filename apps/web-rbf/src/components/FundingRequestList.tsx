'use client';

import React from 'react';
import { useEnhancedCampaigns, type EnhancedCampaign } from '@/hooks/useEnhancedCampaigns';
import { formatUnits } from 'viem';
import Link from 'next/link';
import { RiskBadge, InvestmentRiskAnalysis } from './InvestmentRiskAnalysis';
import { CompactHealthScore } from './HealthScoreIndicator';

const USDC_DECIMALS = 6;

export default function FundingRequestList() {
  const { campaigns, loading, error } = useEnhancedCampaigns();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <FundingRequestCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">Error loading campaigns: {error}</p>;
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Ready to leverage your network and prove your business performance.</p>
        <Link 
          href="/create-campaign" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <FundingRequestCard key={campaign.address} campaign={campaign} />
      ))}
    </div>
  );
}

function FundingRequestCard({ campaign }: { campaign: EnhancedCampaign }) {
  const formattedTotal = formatUnits(BigInt(campaign.totalFunded || '0'), USDC_DECIMALS);
  const formattedGoal = formatUnits(BigInt(campaign.fundingGoal || '0'), USDC_DECIMALS);
  const progressPercentage = campaign.fundingGoal && Number(campaign.fundingGoal) > 0 
    ? (Number(campaign.totalFunded || '0') / Number(campaign.fundingGoal)) * 100 
    : 0;
  
  // Calculate time remaining
  const daysRemaining = campaign.deadline ? Math.max(0, Math.floor((Number(campaign.deadline) - Date.now() / 1000) / 86400)) : 0;
  const isActive = campaign.fundingActive;
  const isFullyFunded = progressPercentage >= 100;

  return (
    <Link 
      href={`/campaign/${campaign.address}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100 relative"
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        {isFullyFunded ? (
          <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Funded
          </div>
        ) : !isActive ? (
          <div className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Ended
          </div>
        ) : daysRemaining <= 3 && daysRemaining > 0 ? (
          <div className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {daysRemaining} days left
          </div>
        ) : null}
      </div>

      {campaign.metadata?.image ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={campaign.metadata.image.startsWith('ipfs://') 
              ? `https://ipfs.io/ipfs/${campaign.metadata.image.replace('ipfs://', '')}`
              : campaign.metadata.image
            } 
            alt={campaign.metadata?.title || 'Business'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to alternative IPFS gateways if the primary fails
              const target = e.target as HTMLImageElement;
              const originalSrc = target.src;
              
              if (originalSrc.includes('ipfs.io')) {
                target.src = originalSrc.replace('https://ipfs.io/ipfs/', 'https://dweb.link/ipfs/');
              } else if (originalSrc.includes('dweb.link')) {
                target.src = originalSrc.replace('https://dweb.link/ipfs/', 'https://cloudflare-ipfs.com/ipfs/');
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm font-medium">{campaign.metadata?.businessName || 'Business'}</p>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
            {campaign.metadata?.title || 'Untitled Campaign'}
          </h3>
          {campaign.riskAnalysis && (
            <RiskBadge riskLevel={campaign.riskAnalysis.overallRisk} size="sm" />
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {campaign.metadata?.description || 'No description available'}
        </p>

        {/* Company Name & Business Health */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-700">
                {campaign.metadata?.businessName || 'Company Name'}
              </h4>
              <div className="flex items-center gap-1">
                {campaign.businessHealth?.isVerified && (
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" title="Verified Business" />
                )}
                {campaign.businessHealth?.isRegistered && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Registered Business" />
                )}
              </div>
            </div>
          </div>
          {campaign.businessHealth && (
            <CompactHealthScore score={campaign.businessHealth.healthScore} />
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-900">
              ${parseFloat(formattedTotal).toLocaleString()} raised
            </span>
            <span className="text-xs text-gray-500">
              {progressPercentage.toFixed(1)}% of ${parseFloat(formattedGoal).toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isFullyFunded ? 'bg-green-500' : progressPercentage > 75 ? 'bg-orange-500' : 'bg-sky-600'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Investment Terms */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-500">Revenue Share</div>
            <div className="font-semibold text-sm text-gray-900">{campaign.revenueSharePercent / 100}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Max Return</div>
            <div className="font-semibold text-sm text-gray-900">{campaign.repaymentCap / 10000}x</div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="flex gap-2">
          {isActive && !isFullyFunded ? (
            <div className="flex-1 bg-sky-600 text-white text-center py-2 rounded-lg text-sm font-medium group-hover:bg-sky-700 transition-colors">
              Invest Now
            </div>
          ) : isFullyFunded ? (
            <div className="flex-1 bg-green-100 text-green-700 text-center py-2 rounded-lg text-sm font-medium">
              Fully Funded
            </div>
          ) : (
            <div className="flex-1 bg-gray-100 text-gray-500 text-center py-2 rounded-lg text-sm font-medium">
              Campaign Ended
            </div>
          )}
          <div className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 group-hover:border-gray-300 transition-colors">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}

function FundingRequestCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5">
        <div className="h-6 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
        <div className="h-2 bg-gray-200 rounded-full mb-2" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}