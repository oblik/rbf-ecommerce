import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { TOKEN_CONFIG, GAS_CONFIG } from '@/lib/constants';
import { usdcAbi } from '@/abi/usdc';
import { campaignAbi } from '@/abi/campaign';

interface UseUSDCPaymentParams {
  campaignAddress: `0x${string}`;
  amount: number; // USD amount
}

interface UseUSDCPaymentReturn {
  // State
  isApproving: boolean;
  isContributing: boolean;
  isCompleted: boolean;
  error: string | null;
  
  // Functions
  executePayment: () => Promise<void>;
  reset: () => void;
  
  // Transaction hashes
  approvalTxHash?: `0x${string}`;
  contributionTxHash?: `0x${string}`;
}

export function useUSDCPayment({ 
  campaignAddress, 
  amount 
}: UseUSDCPaymentParams): UseUSDCPaymentReturn {
  const { address, isConnected } = useAccount();
  
  // Local state
  const [isApproving, setIsApproving] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Contract write hooks
  const {
    writeContract: writeApproval,
    data: approvalTxHash,
    error: approvalError,
    reset: resetApproval
  } = useWriteContract();
  
  const {
    writeContract: writeContribution,
    data: contributionTxHash,
    error: contributionError,
    reset: resetContribution
  } = useWriteContract();
  
  // Transaction receipt hooks
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = 
    useWaitForTransactionReceipt({ hash: approvalTxHash });
    
  const { isLoading: isContributionConfirming, isSuccess: isContributionConfirmed } = 
    useWaitForTransactionReceipt({ hash: contributionTxHash });
  
  // Check current allowance
  const { data: currentAllowance } = useReadContract({
    address: TOKEN_CONFIG.USDC.address,
    abi: usdcAbi,
    functionName: 'allowance',
    args: address && campaignAddress ? [address, campaignAddress] : undefined,
  });
  
  // Check user's USDC balance
  const { data: userBalance } = useReadContract({
    address: TOKEN_CONFIG.USDC.address,
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  // Convert amount to USDC units (6 decimals)
  const usdcAmount = parseUnits(amount.toString(), TOKEN_CONFIG.USDC.decimals);
  
  const executePayment = async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }
    
    if (!userBalance || userBalance < usdcAmount) {
      setError(`Insufficient USDC balance. Required: ${amount} USDC`);
      return;
    }
    
    setError(null);
    
    try {
      // Step 1: Check if approval is needed
      const needsApproval = !currentAllowance || currentAllowance < usdcAmount;
      
      if (needsApproval) {
        console.log('🔐 Approving USDC spending...', {
          amount: usdcAmount.toString(),
          spender: campaignAddress
        });
        
        setIsApproving(true);
        
        // Approve USDC spending
        writeApproval({
          address: TOKEN_CONFIG.USDC.address,
          abi: usdcAbi,
          functionName: 'approve',
          args: [campaignAddress, usdcAmount],
          gas: GAS_CONFIG.APPROVE_GAS_LIMIT,
        });
        
        // Wait for approval to be confirmed
        // The effect below will handle the next step
      } else {
        // Skip approval, go directly to contribution
        await executeContribution();
      }
    } catch (err: any) {
      console.error('Payment execution error:', err);
      setError(err.message || 'Payment failed');
      setIsApproving(false);
      setIsContributing(false);
    }
  };
  
  const executeContribution = async () => {
    console.log('💰 Contributing to campaign...', {
      campaign: campaignAddress,
      amount: usdcAmount.toString()
    });
    
    setIsContributing(true);
    
    // Call the campaign's contribute function
    writeContribution({
      address: campaignAddress,
      abi: campaignAbi,
      functionName: 'contribute',
      args: [usdcAmount],
      gas: GAS_CONFIG.CONTRIBUTE_GAS_LIMIT,
    });
  };
  
  // Effect to handle approval completion
  React.useEffect(() => {
    if (isApprovalConfirmed && isApproving) {
      console.log('✅ Approval confirmed, proceeding to contribution');
      setIsApproving(false);
      executeContribution();
    }
  }, [isApprovalConfirmed, isApproving]);
  
  // Effect to handle contribution completion
  React.useEffect(() => {
    if (isContributionConfirmed && isContributing) {
      console.log('🎉 Contribution confirmed!');
      setIsContributing(false);
      setIsCompleted(true);
    }
  }, [isContributionConfirmed, isContributing]);
  
  // Effect to handle errors
  React.useEffect(() => {
    if (approvalError) {
      console.error('Approval error:', approvalError);
      setError(approvalError.message || 'Approval failed');
      setIsApproving(false);
    }
    
    if (contributionError) {
      console.error('Contribution error:', contributionError);
      setError(contributionError.message || 'Contribution failed');
      setIsContributing(false);
    }
  }, [approvalError, contributionError]);
  
  const reset = () => {
    setIsApproving(false);
    setIsContributing(false);
    setIsCompleted(false);
    setError(null);
    resetApproval();
    resetContribution();
  };
  
  return {
    // State
    isApproving: isApproving || isApprovalConfirming,
    isContributing: isContributing || isContributionConfirming,
    isCompleted,
    error,
    
    // Functions
    executePayment,
    reset,
    
    // Transaction hashes
    approvalTxHash,
    contributionTxHash,
  };
}