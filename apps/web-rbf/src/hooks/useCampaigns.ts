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
      owner
      metadataURI
      fundingGoal
      totalFunded
      deadline
      revenueSharePercent
      repaymentCap
      fundingActive
      repaymentActive
      totalRepaid
      contributionCount
      investorCount
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
  createdAt?: string;
  metadata: CampaignMetadata | null;
}

async function getIPFSMetadata(cid: string): Promise<CampaignMetadata | null> {
  if (!cid) return null;
  
  // Multiple IPFS gateways to try in order
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ];
  
  const cleanCid = cid.replace('ipfs://', '');
  console.log('Fetching IPFS metadata for CID:', cleanCid);
  
  for (const gateway of gateways) {
    try {
      const url = `${gateway}${cleanCid}`;
      console.log('Trying IPFS URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const metadata = await response.json();
        console.log('Successfully fetched metadata:', metadata);
        return metadata;
      } else {
        console.warn(`Gateway ${gateway} failed with status:`, response.status);
      }
    } catch (error) {
      console.warn(`Gateway ${gateway} failed with error:`, error);
      // Continue to next gateway
    }
  }
  
  console.error(`All IPFS gateways failed for CID: ${cleanCid}`);
  return null;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { data, loading, error, refetch } = useQuery(GET_ALL_CAMPAIGNS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all', // Continue even if there's an error
  });

  useEffect(() => {
    if (data?.campaigns) {
      processCampaigns();
    } else if (error) {
      // Fallback to mock data if GraphQL fails
      console.warn('GraphQL query failed, using mock data:', error.message);
      setMockCampaigns();
    }
  }, [data, error]);

  const processCampaigns = async () => {
    if (!data?.campaigns) return;

    try {
      console.log('Processing campaigns from subgraph:', data.campaigns);
      
      const campaignPromises = data.campaigns.map(async (campaign: any) => {
        console.log('Processing campaign:', campaign);
        let metadata: CampaignMetadata | null = null;
        
        if (campaign.metadataURI) {
          metadata = await getIPFSMetadata(campaign.metadataURI);
        }

        return {
          address: campaign.id as `0x${string}`,
          owner: campaign.owner,
          fundingGoal: campaign.fundingGoal.toString(),
          totalFunded: campaign.totalFunded.toString(),
          deadline: campaign.deadline.toString(),
          revenueSharePercent: parseInt(campaign.revenueSharePercent.toString()), // Keep as basis points (500 = 5%)
          repaymentCap: parseInt(campaign.repaymentCap.toString()), // Keep as basis points (15000 = 1.5x) 
          fundingActive: campaign.fundingActive,
          repaymentActive: campaign.repaymentActive,
          backerCount: campaign.investorCount || 0,
          createdAt: campaign.createdAt,
          metadata,
        };
      });

      const results = await Promise.all(campaignPromises);
      setCampaigns(results);
    } catch (e) {
      console.error('Failed to process campaigns:', e);
    }
  };

  const setMockCampaigns = () => {
    const mockCampaigns: Campaign[] = [
      {
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        owner: '0x0987654321098765432109876543210987654321',
        fundingGoal: '50000000000',
        totalFunded: '32500000000',
        deadline: (Date.now() / 1000 + 86400 * 30).toString(), // 30 days from now
        revenueSharePercent: 500, // 5%
        repaymentCap: 15000, // 1.5x
        fundingActive: true,
        repaymentActive: false,
        backerCount: 23,
        createdAt: (Date.now() / 1000 - 86400 * 14).toString(), // 14 days ago
        metadata: {
          title: 'Expand E-commerce Platform',
          description: 'We\'re looking to raise capital to expand our e-commerce platform into new markets and add AI-powered recommendation features.',
          businessName: 'TechFlow Commerce',
          website: 'https://techflow.com',
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
          creditScore: {
            score: 750,
            riskLevel: 'Low'
          }
        }
      },
      {
        address: '0x2345678901234567890123456789012345678901' as `0x${string}`,
        owner: '0x1876543210987654321098765432109876543210',
        fundingGoal: '25000000000',
        totalFunded: '18750000000',
        deadline: (Date.now() / 1000 + 86400 * 45).toString(), // 45 days from now
        revenueSharePercent: 600, // 6%
        repaymentCap: 20000, // 2x
        fundingActive: true,
        repaymentActive: false,
        backerCount: 15,
        createdAt: (Date.now() / 1000 - 86400 * 7).toString(), // 7 days ago
        metadata: {
          title: 'SaaS Platform Scale-Up',
          description: 'Growing our B2B SaaS platform to handle enterprise clients and expand our feature set with advanced analytics.',
          businessName: 'DataFlow Solutions',
          website: 'https://dataflow.io',
          image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
          creditScore: {
            score: 680,
            riskLevel: 'Medium'
          }
        }
      }
    ];
    
    setCampaigns(mockCampaigns);
  };

  return { 
    campaigns, 
    loading: loading && !error, // Don't show loading if we have an error and fallback data
    error: error && campaigns.length === 0 ? error.message : null, // Only show error if no fallback data
    refetch 
  };
}