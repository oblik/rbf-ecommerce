'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
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

  const progressPercentage = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;
  const remainingAmount = Number(campaign.fundingGoal) - Number(campaign.totalFunded);
  const daysLeft = Math.max(0, Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Investment Successful!</h3>
          <p className="text-green-700 mb-4">
            You've successfully invested ${fundAmount} USDC in this campaign.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-cyan-600 hover:text-green-700 underline"
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
            className="bg-cyan-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Raised:</span>
            <span className="font-semibold">${Number(campaign.totalFunded).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Goal:</span>
            <span className="font-semibold">${Number(campaign.fundingGoal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Remaining:</span>
            <span className="font-semibold text-cyan-600">
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
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Revenue Share:</span>
            <span className="font-medium">{(campaign.revenueSharePercent / 100) || 5}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Repayment Cap:</span>
            <span className="font-medium">{(campaign.repaymentCap / 10000) || 1.5}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Min Investment:</span>
            <span className="font-medium">$100</span>
          </div>
        </div>
      </div>

      {/* Funding Actions */}
      {campaign.fundingActive && daysLeft > 0 ? (
        <div className="space-y-4">
          {!showFundingForm ? (
            <button
              onClick={() => setShowFundingForm(true)}
              disabled={!isConnected}
              className="w-full bg-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isConnected ? 'Fund This Campaign' : 'Connect Wallet to Fund'}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="100"
                    min="100"
                    max={remainingAmount.toString()}
                    className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: $100 | Available: ${remainingAmount.toLocaleString()}
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
                  className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          ⚠️ <strong>Investment Risk:</strong> Revenue-based financing involves risk. 
          Only invest what you can afford to lose. Returns are not guaranteed.
        </p>
      </div>
    </div>
  );
}