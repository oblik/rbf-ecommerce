'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { campaignAbi } from '@/abi/campaign';
import { usdcAbi } from '@/abi/usdc';
import { TOKEN_CONFIG } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface CampaignRepaymentData {
  address: `0x${string}`;
  fundingGoal: bigint;
  totalFunded: bigint;
  totalRepaid: bigint;
  revenueSharePercent: bigint;
  repaymentCap: bigint;
  repaymentActive: boolean;
  lastRevenueReport?: bigint;
  nextPaymentDue?: bigint;
}

function CampaignRepaymentCard({ campaign }: { campaign: CampaignRepaymentData }) {
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Calculate repayment details
  const maxRepayment = (campaign.totalFunded * campaign.repaymentCap) / 10000n;
  const remainingRepayment = maxRepayment - campaign.totalRepaid;
  const revenueShareAmount = monthlyRevenue 
    ? (parseUnits(monthlyRevenue, TOKEN_CONFIG.USDC.decimals) * campaign.revenueSharePercent) / 10000n
    : 0n;
  
  const actualPayment = revenueShareAmount > remainingRepayment ? remainingRepayment : revenueShareAmount;
  const progressPercent = Number((campaign.totalRepaid * 100n) / maxRepayment);

  const handleSubmitRevenue = async () => {
    if (!monthlyRevenue || actualPayment === 0n) return;
    
    setIsSubmitting(true);
    try {
      // First approve USDC spending
      await writeContract({
        address: TOKEN_CONFIG.USDC.address,
        abi: usdcAbi,
        functionName: 'approve',
        args: [campaign.address, actualPayment],
      });

      // Wait a bit for approval
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Then submit revenue share
      await writeContract({
        address: campaign.address,
        abi: campaignAbi,
        functionName: 'submitRevenueShare',
        args: [parseUnits(monthlyRevenue, TOKEN_CONFIG.USDC.decimals)],
      });
    } catch (error) {
      console.error('Error submitting revenue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setMonthlyRevenue('');
    }
  }, [isSuccess]);

  if (!campaign.repaymentActive) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Campaign #{campaign.address.slice(0, 6)}...{campaign.address.slice(-4)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Revenue Share: {Number(campaign.revenueSharePercent) / 100}% | 
            Cap: {Number(campaign.repaymentCap) / 10000}x
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Funded</p>
          <p className="text-lg font-semibold text-gray-900">
            ${formatUnits(campaign.totalFunded, TOKEN_CONFIG.USDC.decimals)}
          </p>
        </div>
      </div>

      {/* Repayment Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Repayment Progress</span>
          <span className="font-medium text-gray-900">
            ${formatUnits(campaign.totalRepaid, TOKEN_CONFIG.USDC.decimals)} / 
            ${formatUnits(maxRepayment, TOKEN_CONFIG.USDC.decimals)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{progressPercent.toFixed(1)}% Complete</p>
      </div>

      {/* Revenue Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Revenue (USD)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="10000"
            />
          </div>
        </div>

        {monthlyRevenue && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Revenue Share ({Number(campaign.revenueSharePercent) / 100}%)</span>
              <span className="font-medium">${formatUnits(revenueShareAmount, TOKEN_CONFIG.USDC.decimals)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining Cap</span>
              <span className="font-medium">${formatUnits(remainingRepayment, TOKEN_CONFIG.USDC.decimals)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium text-gray-900">Payment Amount</span>
              <span className="font-semibold text-green-600">
                ${formatUnits(actualPayment, TOKEN_CONFIG.USDC.decimals)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmitRevenue}
          disabled={!monthlyRevenue || actualPayment === 0n || isSubmitting || isConfirming}
          className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? 'Processing...' : isSubmitting ? 'Approving...' : 'Submit Revenue Share'}
        </button>

        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">Revenue share submitted successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessRepaymentPage() {
  const { address, isConnected } = useAccount();
  const [campaigns, setCampaigns] = useState<CampaignRepaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, we'd fetch user's campaigns from the factory
  // For now, using mock data
  useEffect(() => {
    if (address) {
      // This would be replaced with actual contract calls
      setLoading(false);
      // Mock campaign for testing
      setCampaigns([
        {
          address: '0x1234567890123456789012345678901234567890',
          fundingGoal: parseUnits('50000', TOKEN_CONFIG.USDC.decimals),
          totalFunded: parseUnits('50000', TOKEN_CONFIG.USDC.decimals),
          totalRepaid: parseUnits('5000', TOKEN_CONFIG.USDC.decimals),
          revenueSharePercent: 500n, // 5%
          repaymentCap: 15000n, // 1.5x
          repaymentActive: true,
        }
      ]);
    }
  }, [address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Repayment Portal</h2>
          <p className="text-gray-600">Please connect your wallet to manage repayments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/business/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Share Payments</h1>
          <p className="text-gray-600 mt-2">Submit your monthly revenue shares to investors</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                Revenue shares are due monthly. Your payment will be automatically distributed to all investors 
                proportionally based on their contribution amounts.
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : campaigns.length > 0 ? (
          <div className="space-y-6">
            {campaigns.map(campaign => (
              <CampaignRepaymentCard key={campaign.address} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Repayments</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any campaigns in the repayment phase yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}