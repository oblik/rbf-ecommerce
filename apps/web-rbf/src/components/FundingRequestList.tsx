'use client';

import React from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatUnits } from 'viem';
import Link from 'next/link';

const USDC_DECIMALS = 6;

export default function FundingRequestList() {
  const { campaigns, loading, error } = useCampaigns();

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
        <p className="text-gray-500 mb-4">No funding requests found.</p>
        <Link 
          href="/create" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          Create Campaign
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

function FundingRequestCard({ campaign }: { campaign: any }) {
  const formattedTotal = formatUnits(BigInt(campaign.totalFunded || '0'), USDC_DECIMALS);
  const formattedGoal = formatUnits(BigInt(campaign.fundingGoal || '0'), USDC_DECIMALS);
  const progressPercentage = campaign.fundingGoal && Number(campaign.fundingGoal) > 0 
    ? (Number(campaign.totalFunded || '0') / Number(campaign.fundingGoal)) * 100 
    : 0;

  return (
    <Link 
      href={`/campaign/${campaign.address}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
    >
      {campaign.metadata?.image && (
        <div className="relative h-48 w-full">
          <img 
            src={campaign.metadata.image.startsWith('ipfs://') 
              ? `https://gateway.pinata.cloud/ipfs/${campaign.metadata.image.replace('ipfs://', '')}`
              : campaign.metadata.image
            } 
            alt={campaign.metadata?.title || 'Business'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {campaign.metadata?.title || 'Untitled Campaign'}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {campaign.metadata?.description || 'No description available'}
        </p>

        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900">
              ${parseFloat(formattedTotal).toLocaleString()} funded
            </span>
            <span className="text-sm text-gray-500">
              of ${parseFloat(formattedGoal).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Revenue share: {campaign.revenueSharePercent / 100}%</span>
          <span>Cap: {campaign.repaymentCap / 10000}x</span>
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