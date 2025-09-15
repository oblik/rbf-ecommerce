'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { campaignAbi } from '@/abi/campaign';
import { TOKEN_CONFIG } from '@/lib/constants';
import { useInvestorData } from '@/hooks/useInvestorData';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface InvestmentReturn {
  campaignAddress: `0x${string}`;
  campaignTitle: string;
  businessName: string;
  contribution: bigint;
  pendingReturns: bigint;
  totalReceived: bigint;
  expectedReturn: bigint;
  status: 'active' | 'completed' | 'pending';
}

function InvestmentCard({ investment, onWithdraw }: { 
  investment: InvestmentReturn;
  onWithdraw: (address: `0x${string}`) => void;
}) {
  const roi = investment.contribution > 0n 
    ? Number(((investment.totalReceived + investment.pendingReturns - investment.contribution) * 100n) / investment.contribution)
    : 0;
  
  const progressPercent = investment.expectedReturn > 0n
    ? Number(((investment.totalReceived + investment.pendingReturns) * 100n) / investment.expectedReturn)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{investment.campaignTitle}</h3>
          <p className="text-sm text-gray-600">{investment.businessName}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          investment.status === 'completed' 
            ? 'bg-green-100 text-green-800'
            : investment.status === 'active'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {investment.status === 'completed' ? 'Completed' : investment.status === 'active' ? 'Receiving' : 'Pending'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Investment Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Invested</p>
            <p className="text-lg font-semibold text-gray-900">
              ${formatUnits(investment.contribution, TOKEN_CONFIG.USDC.decimals)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">ROI</p>
            <p className={`text-lg font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Returns Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Returns Progress</span>
            <span className="font-medium text-gray-900">
              ${formatUnits(investment.totalReceived + investment.pendingReturns, TOKEN_CONFIG.USDC.decimals)} / 
              ${formatUnits(investment.expectedReturn, TOKEN_CONFIG.USDC.decimals)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Pending Returns */}
        {investment.pendingReturns > 0n && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Available to Withdraw</p>
                <p className="text-2xl font-bold text-green-600">
                  ${formatUnits(investment.pendingReturns, TOKEN_CONFIG.USDC.decimals)}
                </p>
              </div>
              <button
                onClick={() => onWithdraw(investment.campaignAddress)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Received</span>
            <span className="font-medium text-gray-900">
              ${formatUnits(investment.totalReceived, TOKEN_CONFIG.USDC.decimals)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Expected Total</span>
            <span className="font-medium text-gray-900">
              ${formatUnits(investment.expectedReturn, TOKEN_CONFIG.USDC.decimals)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvestorReturnsPage() {
  const { address, isConnected } = useAccount();
  const { 
    investments, 
    summary, 
    loading, 
    error, 
    formatCurrency, 
    getInvestmentsByStatus 
  } = useInvestorData();
  const [withdrawingFrom, setWithdrawingFrom] = useState<`0x${string}` | null>(null);
  
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleWithdraw = async (campaignAddress: `0x${string}`) => {
    setWithdrawingFrom(campaignAddress);
    try {
      await writeContract({
        address: campaignAddress,
        abi: campaignAbi,
        functionName: 'withdrawReturns',
      });
    } catch (error) {
      console.error('Error withdrawing returns:', error);
      setWithdrawingFrom(null);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setWithdrawingFrom(null);
      // Refresh investments data
      // In real app, would refetch from contracts
    }
  }, [isSuccess]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Investor Returns Dashboard</h2>
          <p className="text-gray-600">Please connect your wallet to view your returns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/portfolio"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Portfolio
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Your Investment Returns</h1>
          <p className="text-gray-600 mt-2">Track and withdraw your revenue share returns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Invested</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(summary.totalInvested)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Received</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(summary.totalReceived)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Returns</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(summary.totalPending)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total ROI</p>
            <p className={`text-2xl font-bold mt-2 ${summary.totalROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.totalROI > 0 ? '+' : ''}{summary.totalROI.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Withdraw All Button */}
        {summary.totalPending > 0n && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">
                  You have {formatCurrency(summary.totalPending)} available to withdraw
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Withdraw from all campaigns with pending returns
                </p>
              </div>
              <button
                onClick={() => {
                  investments.forEach(inv => {
                    if (inv.pendingReturns > 0n) {
                      handleWithdraw(inv.campaignAddress);
                    }
                  });
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Withdraw All
              </button>
            </div>
          </div>
        )}

        {/* Investment Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : investments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investments.map(investment => (
              <InvestmentCard 
                key={investment.campaignAddress} 
                investment={investment}
                onWithdraw={handleWithdraw}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Investments Yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start funding campaigns to receive revenue share returns.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700"
            >
              Browse Campaigns
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}