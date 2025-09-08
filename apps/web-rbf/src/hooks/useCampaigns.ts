'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { factoryAbi } from '@/abi/factory';
import { campaignAbi } from '@/abi/campaign';

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

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
  revenueSharePercent: number;
  repaymentCap: number;
  fundingActive: boolean;
  repaymentActive: boolean;
  metadata: CampaignMetadata | null;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.NEXT_PUBLIC_RPC_URL),
      });

      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
      
      if (!factoryAddress) {
        throw new Error('Factory address not configured');
      }

      // Get all campaigns from factory
      const campaignAddresses = await publicClient.readContract({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'getCampaigns',
      }) as `0x${string}`[];

      // Fetch details for each campaign
      const campaignPromises = campaignAddresses.map(async (address) => {
        try {
          // Get campaign details
          const [details, metadataURI] = await Promise.all([
            publicClient.readContract({
              address,
              abi: campaignAbi,
              functionName: 'getCampaignDetails',
            }) as Promise<any>,
            publicClient.readContract({
              address,
              abi: campaignAbi,
              functionName: 'metadataURI',
            }) as Promise<string>,
          ]);

          // Fetch metadata from IPFS
          let metadata: CampaignMetadata | null = null;
          if (metadataURI) {
            try {
              const url = `${IPFS_GATEWAY}${metadataURI.replace('ipfs://', '')}`;
              const response = await fetch(url);
              if (response.ok) {
                metadata = await response.json();
              }
            } catch (e) {
              console.error(`Failed to fetch metadata for ${address}:`, e);
            }
          }

          return {
            address: address as `0x${string}`,
            owner: await publicClient.readContract({
              address,
              abi: campaignAbi,
              functionName: 'owner',
            }) as string,
            fundingGoal: details[0].toString(),
            totalFunded: details[1].toString(),
            revenueSharePercent: Number(details[3]),
            repaymentCap: Number(details[4]),
            fundingActive: details[5],
            repaymentActive: details[6],
            metadata,
          };
        } catch (e) {
          console.error(`Failed to fetch campaign ${address}:`, e);
          return null;
        }
      });

      const results = await Promise.all(campaignPromises);
      const validCampaigns = results.filter((c): c is Campaign => c !== null);
      
      setCampaigns(validCampaigns);
    } catch (e) {
      console.error('Failed to fetch campaigns:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  return { campaigns, loading, error, refetch: fetchCampaigns };
}