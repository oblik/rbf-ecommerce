'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

const GET_ALL_CAMPAIGNS = gql`
  query GetAllCampaigns {
    campaigns(orderBy: createdAt, orderDirection: desc) {
      id
      campaignId
      creator
      metadataURI
      deadline
      goalAmount
      totalRaised
      totalDirectTransfers
      actualBalance
      ended
      tokenAddress
      state
      claimed
      createdAt
    }
  }
`;

interface CampaignMetadata {
  title: string;
  description: string;
  image?: string;
  businessName?: string;
  website?: string;
  creditScore?: {
    score: number;
    riskLevel: string;
  };
}

interface Campaign {
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
  metadata: CampaignMetadata | null;
}

async function getIPFSMetadata(cid: string): Promise<CampaignMetadata | null> {
  if (!cid) return null;
  try {
    const url = `${IPFS_GATEWAY}${cid.replace('ipfs://', '')}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch metadata from IPFS: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching or parsing IPFS metadata:", error);
    return null;
  }
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { data, loading, error, refetch } = useQuery(GET_ALL_CAMPAIGNS, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data?.campaigns) {
      processCampaigns();
    }
  }, [data]);

  const processCampaigns = async () => {
    if (!data?.campaigns) return;

    try {
      const campaignPromises = data.campaigns.map(async (campaign: any) => {
        let metadata: CampaignMetadata | null = null;
        
        if (campaign.metadataURI) {
          metadata = await getIPFSMetadata(campaign.metadataURI);
        }

        return {
          address: campaign.id as `0x${string}`,
          owner: campaign.creator,
          fundingGoal: campaign.goalAmount.toString(),
          totalFunded: campaign.totalRaised.toString(),
          deadline: campaign.deadline,
          revenueSharePercent: 500, // Default 5% - would come from contract details
          repaymentCap: 15000, // Default 1.5x - would come from contract details
          fundingActive: !campaign.ended,
          repaymentActive: false,
          backerCount: 0, // Default - would come from contract details
          metadata,
        };
      });

      const results = await Promise.all(campaignPromises);
      setCampaigns(results);
    } catch (e) {
      console.error('Failed to process campaigns:', e);
    }
  };

  return { 
    campaigns, 
    loading, 
    error: error?.message || null, 
    refetch 
  };
}