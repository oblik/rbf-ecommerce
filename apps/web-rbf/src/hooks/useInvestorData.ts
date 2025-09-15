'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useEnhancedCampaigns } from './useEnhancedCampaigns';
import { TOKEN_CONFIG } from '@/lib/constants';
import { campaignAbi } from '@/abi/campaign';

export interface InvestorInvestment {
  campaignAddress: `0x${string}`;
  campaignTitle: string;
  businessName: string;
  contribution: bigint;
  pendingReturns: bigint;
  totalReceived: bigint;
  expectedReturn: bigint;
  revenueSharePercent: number;
  repaymentCap: number;
  status: 'funding' | 'active' | 'completed';
  image?: string;
  description?: string;
}

export interface InvestorSummary {
  totalInvested: bigint;
  totalPending: bigint;
  totalReceived: bigint;
  totalValue: bigint;
  totalROI: number;
  activeInvestments: number;
  completedInvestments: number;
}

export function useInvestorData() {
  const { address, isConnected } = useAccount();
  const { campaigns } = useEnhancedCampaigns();
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [summary, setSummary] = useState<InvestorSummary>({
    totalInvested: 0n,
    totalPending: 0n,
    totalReceived: 0n,
    totalValue: 0n,
    totalROI: 0,
    activeInvestments: 0,
    completedInvestments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create contract calls for all campaigns
  const contractCalls = campaigns.flatMap(campaign => [
    {
      address: campaign.address as `0x${string}`,
      abi: campaignAbi,
      functionName: 'contributions',
      args: [address],
    },
    {
      address: campaign.address as `0x${string}`,
      abi: campaignAbi,
      functionName: 'pendingReturns',
      args: [address],
    },
    {
      address: campaign.address as `0x${string}`,
      abi: campaignAbi,
      functionName: 'getCampaignDetails',
    },
  ]);

  // Read all contract data at once
  const { data: contractResults, isLoading: contractsLoading, error: contractsError } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: !!address && !!isConnected && campaigns.length > 0,
    },
  });

  // Process contract results
  useEffect(() => {
    if (!address || !isConnected || !campaigns.length) {
      setLoading(false);
      setInvestments([]);
      setSummary({
        totalInvested: 0n,
        totalPending: 0n,
        totalReceived: 0n,
        totalValue: 0n,
        totalROI: 0,
        activeInvestments: 0,
        completedInvestments: 0,
      });
      return;
    }

    if (contractsLoading) {
      setLoading(true);
      return;
    }

    if (contractsError) {
      setError('Failed to fetch investment data from contracts');
      setLoading(false);
      return;
    }

    if (contractResults) {
      processContractData();
    }
  }, [address, isConnected, campaigns, contractResults, contractsLoading, contractsError]);

  const processContractData = () => {
    if (!contractResults) return;

    setLoading(true);
    setError(null);

    try {
      const userInvestments: InvestorInvestment[] = [];

      // Process results for each campaign (3 calls per campaign)
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const contributionResult = contractResults[i * 3];
        const pendingReturnsResult = contractResults[i * 3 + 1];
        const campaignDetailsResult = contractResults[i * 3 + 2];

        // Only include campaigns where user has contributed
        const contribution = contributionResult.result as bigint;
        if (contribution && contribution > 0n) {
          const pendingReturns = (pendingReturnsResult.result as bigint) || 0n;
          const campaignDetails = campaignDetailsResult.result as any[];

          // Extract campaign details
          const revenueSharePercent = campaignDetails ? Number(campaignDetails[3]) : 5;
          const repaymentCapBigInt = campaignDetails ? campaignDetails[4] as bigint : 150n;
          const repaymentCap = Number(repaymentCapBigInt) / 100; // Convert from basis points
          const fundingActive = campaignDetails ? campaignDetails[5] as boolean : false;
          const repaymentActive = campaignDetails ? campaignDetails[6] as boolean : false;

          // Calculate expected return based on repayment cap
          const expectedReturn = (contribution * repaymentCapBigInt) / 100n;

          // Determine status based on campaign state
          let status: 'funding' | 'active' | 'completed' = 'funding';
          if (!fundingActive && repaymentActive) {
            status = 'active';
          } else if (!fundingActive && !repaymentActive) {
            status = 'completed';
          }

          // For now, we'll assume totalReceived is 0 since we don't track historical withdrawals yet
          // In a full implementation, you'd track this via events or additional contract state
          const totalReceived = 0n;

          userInvestments.push({
            campaignAddress: campaign.address as `0x${string}`,
            campaignTitle: campaign.metadata?.title || 'Untitled Campaign',
            businessName: campaign.metadata?.businessName || 'Unknown Business',
            contribution,
            pendingReturns,
            totalReceived,
            expectedReturn,
            revenueSharePercent,
            repaymentCap,
            status,
            image: campaign.metadata?.image,
            description: campaign.metadata?.description,
          });
        }
      }

      setInvestments(userInvestments);

      // Calculate summary
      const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.contribution, 0n);
      const totalPending = userInvestments.reduce((sum, inv) => sum + inv.pendingReturns, 0n);
      const totalReceived = userInvestments.reduce((sum, inv) => sum + inv.totalReceived, 0n);
      const totalValue = totalReceived + totalPending;
      const totalROI = totalInvested > 0n ? Number((totalValue - totalInvested) * 100n / totalInvested) : 0;
      const activeInvestments = userInvestments.filter(inv => inv.status === 'active').length;
      const completedInvestments = userInvestments.filter(inv => inv.status === 'completed').length;

      setSummary({
        totalInvested,
        totalPending,
        totalReceived,
        totalValue,
        totalROI,
        activeInvestments,
        completedInvestments,
      });

    } catch (err) {
      console.error('Error processing contract data:', err);
      setError('Failed to process investment data');
    } finally {
      setLoading(false);
    }
  };

  // Format currency values for display
  const formatCurrency = (value: bigint) => {
    return `$${parseFloat(formatUnits(value, TOKEN_CONFIG.USDC.decimals)).toLocaleString()}`;
  };

  // Get investments by status
  const getInvestmentsByStatus = (status: 'funding' | 'active' | 'completed') => {
    return investments.filter(inv => inv.status === status);
  };

  // Refresh data manually
  const refetch = () => {
    if (address && isConnected && campaigns.length && contractResults) {
      processContractData();
    }
  };

  return {
    investments,
    summary,
    loading,
    error,
    formatCurrency,
    getInvestmentsByStatus,
    refetch,
    isConnected: isConnected && !!address,
  };
}