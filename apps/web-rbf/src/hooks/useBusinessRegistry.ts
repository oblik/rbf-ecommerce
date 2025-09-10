'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { businessRegistryAbi } from '@/abi/businessRegistry';

const BUSINESS_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_BUSINESS_REGISTRY_ADDRESS as `0x${string}`;

interface BusinessProfile {
  name: string;
  metadataURI: string;
  owner: string;
  verified: boolean;
  totalRaised: bigint;
  totalRepaid: bigint;
  onTimePayments: bigint;
  latePayments: bigint;
  defaultedAmount: bigint;
  campaignCount: bigint;
  successfulCampaigns: bigint;
  activeInvestors: bigint;
  registeredAt: bigint;
  lastActivityAt: bigint;
}

interface BusinessMetrics {
  repaymentRate: bigint;
  successRate: bigint;
  healthScore: bigint;
}

interface BusinessParams {
  name: string;
  metadataURI: string;
}

export function useBusinessRegistry() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check if business is registered
  const useIsRegistered = (address?: string) => {
    return useReadContract({
      address: BUSINESS_REGISTRY_ADDRESS,
      abi: businessRegistryAbi,
      functionName: 'isRegistered',
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Check if business is verified
  const useIsVerified = (address?: string) => {
    return useReadContract({
      address: BUSINESS_REGISTRY_ADDRESS,
      abi: businessRegistryAbi,
      functionName: 'isVerified',
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Get business profile
  const useBusinessProfile = (address?: string) => {
    return useReadContract({
      address: BUSINESS_REGISTRY_ADDRESS,
      abi: businessRegistryAbi,
      functionName: 'getBusinessProfile',
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Get business health metrics
  const useBusinessHealth = (address?: string) => {
    return useReadContract({
      address: BUSINESS_REGISTRY_ADDRESS,
      abi: businessRegistryAbi,
      functionName: 'getBusinessHealth',
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Register business function
  const registerBusiness = useCallback(
    (params: BusinessParams) => {
      return writeContract({
        address: BUSINESS_REGISTRY_ADDRESS,
        abi: businessRegistryAbi,
        functionName: 'registerBusiness',
        args: [params.name, params.metadataURI],
      });
    },
    [writeContract]
  );

  // Update business metadata function
  const updateBusinessMetadata = useCallback(
    (newURI: string) => {
      return writeContract({
        address: BUSINESS_REGISTRY_ADDRESS,
        abi: businessRegistryAbi,
        functionName: 'updateBusinessMetadata',
        args: [newURI],
      });
    },
    [writeContract]
  );

  return {
    // Hooks for reading contract state
    useIsRegistered,
    useIsVerified,
    useBusinessProfile,
    useBusinessHealth,

    // Functions for writing to contract
    registerBusiness,
    updateBusinessMetadata,

    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Utility function to calculate risk level from health score
export function getRiskLevel(healthScore: bigint): 'Low' | 'Medium' | 'High' {
  const score = Number(healthScore);
  if (score >= 8000) return 'Low';
  if (score >= 6000) return 'Medium';
  return 'High';
}

// Utility function to format health score percentage
export function formatHealthScore(healthScore: bigint): string {
  return `${(Number(healthScore) / 100).toFixed(1)}%`;
}

// Utility function to format repayment rate
export function formatRepaymentRate(repaymentRate: bigint): string {
  return `${(Number(repaymentRate) / 100).toFixed(1)}%`;
}