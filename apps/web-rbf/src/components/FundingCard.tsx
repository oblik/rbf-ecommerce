'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';
import { useCampaigns } from '@/hooks/useCampaigns';
import ShareModal from './ShareModal';
import type { CampaignShareData } from '@/utils/shareUtils';
import { getRevenueShareRating, getRepaymentCapRating, type RiskLevel } from '@/utils/riskComparison';
import { ProgressiveBar } from './ProgressiveBar';

interface FundingCardProps {
  campaignId: string;
  onFundClick: () => void;
}

export default function FundingCard({ campaignId, onFundClick }: FundingCardProps) {
  const router = useRouter();
  const { campaigns, loading } = useCampaigns();
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const campaign = campaigns.find(c => c.address === campaignId);

  if (loading || !campaign) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const USDC_DECIMALS = 6;
  const formattedTotalFunded = formatUnits(BigInt(campaign.totalFunded || '0'), USDC_DECIMALS);
  const formattedFundingGoal = formatUnits(BigInt(campaign.fundingGoal || '0'), USDC_DECIMALS);
  const progressPercentage = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;
  const remainingAmount = Number(formattedFundingGoal) - Number(formattedTotalFunded);
  const daysLeft = Math.max(0, Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));

  // Risk-adjusted ratings (using Medium risk as default for demo)
  const riskLevel: RiskLevel = 'Medium'; // In real implementation, this would come from campaign.riskAnalysis?.overallRisk
  const revenueShareRating = getRevenueShareRating(campaign.revenueSharePercent, riskLevel);
  const repaymentCapRating = getRepaymentCapRating(campaign.repaymentCap, riskLevel);


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Funding Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-sky-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Raised:</span>
            <span className="font-semibold">${parseFloat(formattedTotalFunded).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Goal:</span>
            <span className="font-semibold">${parseFloat(formattedFundingGoal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Remaining:</span>
            <span className="font-semibold text-sky-600">
              ${remainingAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Time left:</span>
            <span className="font-semibold">
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 mb-0.5">Revenue Share</div>
            <div className="font-semibold text-sm text-gray-900 mb-2">
              {(campaign.revenueSharePercent / 100) || 5}%
            </div>
            <div className="flex justify-center">
              <ProgressiveBar rating={revenueShareRating} size="sm" />
            </div>
          </div>
          <div className="w-px h-8 bg-gray-300 mx-2"></div>
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 mb-0.5">Max Repayment</div>
            <div className="font-semibold text-sm text-gray-900 mb-2">
              {(campaign.repaymentCap / 10000) || 1.5}x
            </div>
            <div className="flex justify-center">
              <ProgressiveBar rating={repaymentCapRating} size="sm" />
            </div>
          </div>
          <div className="w-px h-8 bg-gray-300 mx-2"></div>
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 mb-0.5">Duration</div>
            <div className="font-semibold text-sm text-gray-900">
              24 months
            </div>
          </div>
        </div>
      </div>

      {/* Funding Actions */}
      {campaign.fundingActive && daysLeft > 0 ? (
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/campaign/${campaignId}/fund`)}
            className="w-full bg-sky-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-sky-700 transition-colors"
          >
            Fund This Campaign
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShareModalOpen(true);
            }}
            className="w-full bg-gradient-to-r from-blue-500/70 to-green-500/70 p-[3px] rounded-lg hover:from-blue-500/80 hover:to-green-500/80 transition-all group"
          >
            <div className="w-full h-full bg-white rounded-md py-2 px-4 flex items-center justify-center gap-2 group-hover:bg-gray-50/50 transition-colors">
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="font-medium text-gray-700 group-hover:text-gray-800">Share</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 font-medium">
            {remainingAmount <= 0 ? 'Campaign Fully Funded' : 'Campaign Ended'}
          </p>
        </div>
      )}

      {/* Risk Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          ⚠️ <strong>Funding Risk:</strong> Revenue-based financing involves risk. 
          Only contribute what you can afford to lose. Repayments are not guaranteed.
        </p>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        campaign={{
          id: campaignId,
          title: campaign.metadata?.title || 'Funding Campaign',
          businessName: campaign.metadata?.businessName || 'Business',
          description: campaign.metadata?.description,
          image: campaign.metadata?.image,
          goal: Number(formattedFundingGoal),
          raised: Number(formattedTotalFunded),
          progressPercentage,
          daysLeft
        } as CampaignShareData}
      />
    </div>
  );
}