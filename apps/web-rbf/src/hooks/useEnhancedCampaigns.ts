'use client';

import { useState, useEffect } from 'react';
import { useBusinessRegistry } from './useBusinessRegistry';
import { useCampaigns } from './useCampaigns';

export interface BusinessHealth {
  healthScore: bigint;
  repaymentRate: bigint;
  successRate: bigint;
  riskLevel: 'Low' | 'Medium' | 'High';
  isRegistered: boolean;
  isVerified: boolean;
}

export interface EnhancedCampaign {
  address: `0x${string}`;
  owner: string;
  fundingGoal: string;
  totalFunded: string;
  deadline: string;
  revenueSharePercent: number;
  repaymentCap: number;
  fundingActive: boolean;
  repaymentActive: boolean;
  backerCount?: number;
  metadata: any | null;
  businessHealth?: BusinessHealth;
  riskAnalysis?: {
    overallRisk: 'Low' | 'Medium' | 'High';
    riskFactors: string[];
    investmentRecommendation: string;
  };
}

export function useEnhancedCampaigns() {
  const { campaigns, loading, error, refetch } = useCampaigns();
  const { useIsRegistered, useIsVerified, useBusinessHealth } = useBusinessRegistry();
  const [enhancedCampaigns, setEnhancedCampaigns] = useState<EnhancedCampaign[]>([]);
  const [enhancedLoading, setEnhancedLoading] = useState(false);

  useEffect(() => {
    if (campaigns.length > 0) {
      enhanceCampaignsWithBusinessData();
    }
  }, [campaigns]);

  const enhanceCampaignsWithBusinessData = async () => {
    setEnhancedLoading(true);
    
    const enhancedData = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          // For now, we'll use the campaign owner as the business address
          // In production, this would come from the campaign contract or metadata
          const businessAddress = campaign.owner;
          
          // Create mock business health data for demonstration
          // In production, these would be actual contract calls
          const mockBusinessHealth: BusinessHealth = {
            healthScore: BigInt(Math.floor(Math.random() * 4000) + 6000), // 60-100%
            repaymentRate: BigInt(Math.floor(Math.random() * 2000) + 8000), // 80-100%
            successRate: BigInt(Math.floor(Math.random() * 3000) + 7000), // 70-100%
            riskLevel: 'Low' as const,
            isRegistered: Math.random() > 0.3, // 70% chance of being registered
            isVerified: Math.random() > 0.6, // 40% chance of being verified
          };

          // Determine risk level based on health score
          const healthScore = Number(mockBusinessHealth.healthScore);
          if (healthScore >= 8000) {
            mockBusinessHealth.riskLevel = 'Low';
          } else if (healthScore >= 6000) {
            mockBusinessHealth.riskLevel = 'Medium';
          } else {
            mockBusinessHealth.riskLevel = 'High';
          }

          // Generate risk analysis
          const riskAnalysis = generateRiskAnalysis(campaign, mockBusinessHealth);

          return {
            ...campaign,
            businessHealth: mockBusinessHealth,
            riskAnalysis,
          };
        } catch (error) {
          console.error(`Failed to enhance campaign ${campaign.address}:`, error);
          return {
            ...campaign,
            businessHealth: undefined,
            riskAnalysis: undefined,
          };
        }
      })
    );

    setEnhancedCampaigns(enhancedData);
    setEnhancedLoading(false);
  };

  const generateRiskAnalysis = (campaign: any, businessHealth: BusinessHealth) => {
    const riskFactors: string[] = [];
    let overallRisk: 'Low' | 'Medium' | 'High' = 'Low';

    // Analyze funding progress
    const fundingProgress = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;
    if (fundingProgress < 25) {
      riskFactors.push('Low funding progress');
    }

    // Analyze business health
    if (businessHealth.riskLevel === 'High') {
      riskFactors.push('Poor business health score');
      overallRisk = 'High';
    } else if (businessHealth.riskLevel === 'Medium') {
      riskFactors.push('Moderate business health score');
      if (overallRisk !== 'High') overallRisk = 'Medium';
    }

    // Analyze registration status
    if (!businessHealth.isRegistered) {
      riskFactors.push('Business not registered on platform');
      if (overallRisk === 'Low') overallRisk = 'Medium';
    }

    if (!businessHealth.isVerified) {
      riskFactors.push('Business not verified');
    }

    // Analyze repayment terms
    if (campaign.revenueSharePercent > 800) { // 8%+
      riskFactors.push('High revenue share percentage');
      if (overallRisk === 'Low') overallRisk = 'Medium';
    }

    // Generate investment recommendation
    let investmentRecommendation: string;
    if (overallRisk === 'Low') {
      investmentRecommendation = 'This investment shows strong fundamentals with good business health and reasonable terms.';
    } else if (overallRisk === 'Medium') {
      investmentRecommendation = 'This investment has moderate risk. Consider the risk factors before investing.';
    } else {
      investmentRecommendation = 'This investment carries high risk. Proceed with caution and only invest what you can afford to lose.';
    }

    return {
      overallRisk,
      riskFactors,
      investmentRecommendation,
    };
  };

  return {
    campaigns: enhancedCampaigns,
    loading: loading || enhancedLoading,
    error,
    refetch: async () => {
      const result = await refetch();
      if (result.data) {
        enhanceCampaignsWithBusinessData();
      }
      return result;
    },
  };
}

// Helper function to get risk color classes
export function getRiskColorClasses(riskLevel: 'Low' | 'Medium' | 'High') {
  switch (riskLevel) {
    case 'Low':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        badge: 'bg-green-100 text-green-800',
      };
    case 'Medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        badge: 'bg-yellow-100 text-yellow-800',
      };
    case 'High':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-100 text-red-800',
      };
  }
}

// Hook for individual campaign business data
export function useCampaignBusinessHealth(campaignAddress: string, ownerAddress: string) {
  const { useIsRegistered, useIsVerified, useBusinessHealth } = useBusinessRegistry();
  
  const { data: isRegistered } = useIsRegistered(ownerAddress);
  const { data: isVerified } = useIsVerified(ownerAddress);
  const { data: health } = useBusinessHealth(ownerAddress);

  const businessHealth: BusinessHealth | undefined = health ? {
    healthScore: health.healthScore || BigInt(0),
    repaymentRate: health.repaymentRate || BigInt(0),
    successRate: health.successRate || BigInt(0),
    riskLevel: health.healthScore && Number(health.healthScore) >= 8000 ? 'Low' : 
               health.healthScore && Number(health.healthScore) >= 6000 ? 'Medium' : 'High',
    isRegistered: !!isRegistered,
    isVerified: !!isVerified,
  } : undefined;

  return businessHealth;
}