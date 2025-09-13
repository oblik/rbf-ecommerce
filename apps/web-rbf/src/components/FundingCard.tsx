'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useCampaigns } from '@/hooks/useCampaigns';
import { campaignAbi } from '@/abi/campaign';

interface FundingCardProps {
  campaignId: string;
  onFundClick: () => void;
}

export default function FundingCard({ campaignId, onFundClick }: FundingCardProps) {
  const { address, isConnected } = useAccount();
  const { campaigns, loading } = useCampaigns();
  const [fundAmount, setFundAmount] = useState('');
  const [showFundingForm, setShowFundingForm] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const campaign = campaigns.find(c => c.address === campaignId);

  const handleFund = async () => {
    if (!fundAmount || !campaign || !isConnected) return;

    try {
      const amount = parseUnits(fundAmount, 6); // USDC has 6 decimals
      writeContract({
        address: campaignId as `0x${string}`,
        abi: campaignAbi,
        functionName: 'contribute',
        args: [amount],
      });
    } catch (error) {
      console.error('Error funding campaign:', error);
    }
  };

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

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Investment Successful!</h3>
          <p className="text-green-700 mb-4">
            You've successfully invested ${fundAmount} USDC in this campaign.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sky-600 hover:text-green-700 underline"
          >
            View Updated Campaign
          </button>
        </div>
      </div>
    );
  }

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

      {/* Investment Terms */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Investment Terms</h4>
        <div className="flex justify-between items-center mb-3">
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 mb-0.5">Revenue Share</div>
            <div className="font-medium text-xs text-gray-900">{(campaign.revenueSharePercent / 100) || 5}%</div>
          </div>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 mb-0.5">Max Return</div>
            <div className="font-medium text-xs text-gray-900">{(campaign.repaymentCap / 10000) || 1.5}x</div>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Min Contribution:</span>
          <span className="font-medium">$100</span>
        </div>
      </div>

      {/* Funding Actions */}
      {campaign.fundingActive && daysLeft > 0 ? (
        <div className="space-y-4">
          {!showFundingForm ? (
            <>
              <button
                onClick={() => setShowFundingForm(true)}
                disabled={!isConnected}
                className="w-full bg-sky-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isConnected ? 'Fund This Campaign' : 'Connect Wallet to Fund'}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Share functionality
                  const shareData = {
                    title: campaign.metadata?.title || 'Support this campaign',
                    text: `Support ${campaign.metadata?.businessName || 'this business'} on Jama`,
                    url: `${window.location.origin}/campaign/${campaignId}`
                  };
                  if (navigator.share && navigator.canShare(shareData)) {
                    navigator.share(shareData);
                  } else {
                    navigator.clipboard.writeText(shareData.url);
                  }
                }}
                className="w-full bg-white border-2 border-transparent bg-gradient-to-r from-blue-600 to-green-600 p-0.5 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all group"
              >
                <div className="w-full h-full bg-white rounded-md py-2 px-4 flex items-center justify-center gap-2 group-hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="font-bold text-blue-600">Share</span>
                </div>
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contribution Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="100"
                    min="100"
                    max={remainingAmount.toString()}
                    className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: $100 | Available: ${Math.max(0, remainingAmount).toLocaleString()}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFundingForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFund}
                  disabled={!fundAmount || isPending || isConfirming || Number(fundAmount) < 100}
                  className="flex-1 bg-sky-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending || isConfirming ? 'Investing...' : 'Invest'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error.message}</p>
            </div>
          )}
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
    </div>
  );
}