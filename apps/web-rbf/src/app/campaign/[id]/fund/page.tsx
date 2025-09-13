'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useCampaigns } from '@/hooks/useCampaigns';
import { campaignAbi } from '@/abi/campaign';

export default function FundCampaignPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const { address, isConnected } = useAccount();
  const { campaigns, loading } = useCampaigns();
  
  const [fundAmount, setFundAmount] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const campaign = campaigns.find(c => c.address === campaignId);

  const handleFund = async () => {
    if (!fundAmount || !campaign || !isConnected || !agreedToTerms) return;

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

  if (!campaignId || typeof campaignId !== 'string') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">Invalid campaign ID</p>
          <a href="/" className="text-sky-600 hover:text-green-700 underline mt-2 inline-block">
            Browse campaigns →
          </a>
        </div>
      </div>
    );
  }

  if (loading || !campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const USDC_DECIMALS = 6;
  const formattedTotalFunded = formatUnits(BigInt(campaign.totalFunded || '0'), USDC_DECIMALS);
  const formattedFundingGoal = formatUnits(BigInt(campaign.fundingGoal || '0'), USDC_DECIMALS);
  const remainingAmount = Number(formattedFundingGoal) - Number(formattedTotalFunded);
  const progressPercentage = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Funding Successful!</h1>
          <p className="text-xl text-gray-600 mb-6">
            You've successfully contributed ${fundAmount} USDC to {campaign.metadata?.title}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push(`/campaign/${campaignId}`)}
              className="bg-sky-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sky-700"
            >
              View Campaign
            </button>
            <button
              onClick={() => router.push('/portfolio')}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              View Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Funding Summary</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {campaign.metadata?.title || 'Untitled Campaign'}
              </h3>
              <p className="text-gray-600">
                By {campaign.metadata?.businessName}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Campaign Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Raised:</span>
                  <span className="font-semibold">${parseFloat(formattedTotalFunded).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Goal:</span>
                  <span className="font-semibold">${parseFloat(formattedFundingGoal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-semibold text-sky-600">
                    ${Math.max(0, remainingAmount).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-sky-600 h-2 rounded-full"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-sky-50 rounded-lg p-4">
              <h4 className="font-medium text-sky-900 mb-3">Funding Terms</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-sky-700">Revenue Share:</span>
                  <span className="font-medium text-sky-900">
                    {(campaign.revenueSharePercent / 100) || 5}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-700">Repayment Cap:</span>
                  <span className="font-medium text-sky-900">
                    {(campaign.repaymentCap / 10000) || 1.5}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-700">Min Contribution:</span>
                  <span className="font-medium text-sky-900">$100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Make Your Contribution</h2>

          {!isConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-4">
                Please connect your wallet to make a contribution
              </p>
              <button className="bg-sky-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sky-700">
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-6">
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
                <p className="text-sm text-gray-500 mt-1">
                  Minimum: $100 | Maximum: ${Math.max(0, remainingAmount).toLocaleString()}
                </p>
              </div>

              {fundAmount && Number(fundAmount) >= 100 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Contribution Preview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Contribution:</span>
                      <span className="font-medium">${Number(fundAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Monthly Revenue Share:</span>
                      <span className="font-medium">{(campaign.revenueSharePercent / 100) || 5}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Maximum Repayment:</span>
                      <span className="font-medium">
                        ${(Number(fundAmount) * ((campaign.repaymentCap / 10000) || 1.5)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    I understand the risks involved in revenue-based financing and agree to the funding terms. 
                    I acknowledge that repayments are not guaranteed and I may lose my contribution.
                  </span>
                </label>

                <button
                  onClick={handleFund}
                  disabled={!fundAmount || !agreedToTerms || isPending || isConfirming || Number(fundAmount) < 100}
                  className="w-full bg-sky-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending || isConfirming 
                    ? 'Processing Contribution...' 
                    : `Contribute $${fundAmount || '0'} USDC`
                  }
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}