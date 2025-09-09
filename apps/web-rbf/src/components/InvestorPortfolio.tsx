'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import Link from 'next/link';
import { useCampaigns } from '@/hooks/useCampaigns';
import { campaignAbi } from '@/abi/campaign';

const USDC_DECIMALS = 6;

interface PortfolioInvestment {
  campaignId: string;
  campaignAddress: string;
  businessName: string;
  title: string;
  invested: number;
  returns: number;
  totalFunded: number;
  totalRepaid: number;
  revenueSharePercentage: number;
  repaymentCap: number;
  status: 'funding' | 'active' | 'completed';
  expectedReturn: number;
  progressPercentage: number;
}

export default function InvestorPortfolio() {
  const { address } = useAccount();
  const { campaigns, loading } = useCampaigns();
  const [portfolio, setPortfolio] = useState<PortfolioInvestment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [availableWithdrawals, setAvailableWithdrawals] = useState(0);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  // Withdraw returns
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
  // Load portfolio data
  useEffect(() => {
    if (!address || !campaigns.length) return;
    
    loadPortfolioData();
  }, [address, campaigns]);
  
  const loadPortfolioData = async () => {
    // Mock implementation - in production this would query the subgraph
    // for all campaigns where the user has investments
    const mockInvestments: PortfolioInvestment[] = [
      {
        campaignId: '1',
        campaignAddress: campaigns[0]?.address || '',
        businessName: campaigns[0]?.metadata?.businessName || 'Tech Startup Inc.',
        title: campaigns[0]?.metadata?.title || 'Expand Our SaaS Platform',
        invested: 5000,
        returns: 1250,
        totalFunded: Number(campaigns[0]?.totalFunded || 0),
        totalRepaid: 0,
        revenueSharePercentage: 5,
        repaymentCap: 1.5,
        status: 'active',
        expectedReturn: 7500,
        progressPercentage: 16.7
      },
      {
        campaignId: '2', 
        campaignAddress: campaigns[1]?.address || '',
        businessName: 'Green Energy Co.',
        title: 'Solar Panel Manufacturing',
        invested: 10000,
        returns: 12500,
        totalFunded: 150000,
        totalRepaid: 12500,
        revenueSharePercentage: 4,
        repaymentCap: 1.8,
        status: 'completed',
        expectedReturn: 18000,
        progressPercentage: 100
      }
    ];

    const filteredInvestments = mockInvestments.filter(inv => inv.campaignAddress);
    setPortfolio(filteredInvestments);
    
    const invested = filteredInvestments.reduce((sum, inv) => sum + inv.invested, 0);
    const returns = filteredInvestments.reduce((sum, inv) => sum + inv.returns, 0);
    const available = filteredInvestments
      .filter(inv => inv.status === 'active' && inv.returns > 0)
      .reduce((sum, inv) => sum + Math.min(inv.returns, 1000), 0); // Mock available withdrawals
    
    setTotalInvested(invested);
    setTotalReturns(returns);
    setAvailableWithdrawals(available);
  };
  
  const handleWithdraw = async (campaignAddress: string) => {
    try {
      writeContract({
        address: campaignAddress as `0x${string}`,
        abi: campaignAbi,
        functionName: 'withdrawReturns',
      });
      setSelectedCampaign(campaignAddress);
    } catch (error) {
      console.error('Error withdrawing returns:', error);
      alert('Failed to withdraw returns');
    }
  };
  
  // Calculate portfolio metrics
  const activeInvestments = portfolio.filter(inv => inv.status === 'active').length;
  const completedInvestments = portfolio.filter(inv => inv.status === 'completed').length;
  const averageReturn = totalInvested > 0 ? ((totalReturns / totalInvested - 1) * 100) : 0;
  
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Your Investment Portfolio
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700">Total Invested</span>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${totalInvested.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700">Total Returns</span>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${totalReturns.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600">
              {averageReturn > 0 ? '+' : ''}{averageReturn.toFixed(1)}% ROI
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-700">Active Investments</span>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {activeInvestments}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-700">Available</span>
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${availableWithdrawals.toLocaleString()}
            </p>
            {availableWithdrawals > 0 && (
              <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                Withdraw →
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Portfolio Distribution Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          Portfolio Distribution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Pie chart placeholder */}
            <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Chart visualization coming soon</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Investment Breakdown</h4>
            {portfolio.slice(0, 5).map((investment, index) => (
              <div key={investment.campaignId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][index]
                  }`} />
                  <span className="text-sm text-gray-700">{investment.businessName}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${investment.invested.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Active Investments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Active Investments</h3>
        
        <div className="space-y-4">
          {portfolio.filter(inv => inv.status === 'active').map((investment) => (
            <div key={investment.campaignId} className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link 
                    href={`/campaign/${investment.campaignAddress}`} 
                    className="font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {investment.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    By {investment.businessName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {investment.revenueSharePercentage}% revenue share · {investment.repaymentCap}x cap
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Invested</p>
                  <p className="font-medium text-gray-900">${investment.invested.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Received</p>
                  <p className="font-medium text-gray-900">${investment.returns.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expected</p>
                  <p className="font-medium text-gray-900">${investment.expectedReturn.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(investment.progressPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{investment.progressPercentage.toFixed(1)}% returned</p>
              </div>
              
              {investment.returns > 0 && (
                <button
                  onClick={() => handleWithdraw(investment.campaignAddress)}
                  disabled={isPending || isConfirming}
                  className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending || isConfirming ? 'Processing...' : `Withdraw Available Returns`}
                </button>
              )}
            </div>
          ))}
          
          {portfolio.filter(inv => inv.status === 'active').length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No active investments</p>
              <Link href="/" className="text-blue-600 hover:text-green-700 font-medium text-sm">
                Browse funding opportunities →
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Completed Investments */}
      {completedInvestments > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed Investments
          </h3>
          
          <div className="space-y-3">
            {portfolio.filter(inv => inv.status === 'completed').map((investment) => {
              const roi = ((investment.returns / investment.invested - 1) * 100).toFixed(1);
              
              return (
                <div key={investment.campaignId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{investment.title}</p>
                    <p className="text-sm text-gray-500">
                      By {investment.businessName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Invested ${investment.invested.toLocaleString()} → Returned ${investment.returns.toLocaleString()}
                    </p>
                  </div>
                  <span className={`font-semibold ${Number(roi) > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                    {Number(roi) > 0 ? '+' : ''}{roi}% ROI
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Success message */}
      {isSuccess && selectedCampaign && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-900 font-medium">Returns withdrawn successfully!</p>
          </div>
        </div>
      )}
    </div>
  );
}