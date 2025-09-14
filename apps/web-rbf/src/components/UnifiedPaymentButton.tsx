"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePaymentProvider } from '@/providers/payment/PaymentProvider';
import { PaymentMethod } from '@/providers/payment/types';
import PaymentMethodSelector from './PaymentMethodSelector';
import { useUSDCPayment } from '@/hooks/useUSDCPayment';

interface UnifiedPaymentButtonProps {
  campaignAddress: `0x${string}`;
  campaignNumericId: string;
  fiatAmount: number;
  disabled?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  className?: string;
}

export default function UnifiedPaymentButton({
  campaignAddress,
  campaignNumericId,
  fiatAmount,
  disabled = false,
  onSuccess,
  onError,
  className = "w-full bg-sky-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
}: UnifiedPaymentButtonProps) {
  const { isConnected } = useAccount();
  const { initiatePayment } = usePaymentProvider();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wallet');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // USDC payment hook for wallet transactions
  const usdcPayment = useUSDCPayment({
    campaignAddress,
    amount: fiatAmount,
  });
  
  // Handle USDC payment completion
  useEffect(() => {
    if (usdcPayment.isCompleted) {
      setShowPaymentMethods(false);
      onSuccess?.(`Successfully contributed ${fiatAmount} USDC to the campaign!`);
      usdcPayment.reset();
    }
  }, [usdcPayment.isCompleted, fiatAmount, onSuccess]);
  
  // Handle USDC payment errors
  useEffect(() => {
    if (usdcPayment.error) {
      onError?.(usdcPayment.error);
    }
  }, [usdcPayment.error, onError]);

  const handlePayment = async () => {
    if (!fiatAmount || isProcessing) return;

    // Handle wallet payments directly with USDC hook
    if (selectedMethod === 'wallet') {
      if (!isConnected) {
        onError?.('Please connect your wallet first');
        return;
      }
      
      try {
        await usdcPayment.executePayment();
      } catch (error: any) {
        onError?.(error.message || 'Wallet payment failed');
      }
      return;
    }

    // Handle Coinbase Pay and other payment methods
    setIsProcessing(true);
    
    try {
      const result = await initiatePayment({
        method: selectedMethod,
        campaignAddress,
        campaignNumericId,
        fiatAmount,
        onSuccess: (message: string) => {
          setIsProcessing(false);
          setShowPaymentMethods(false);
          onSuccess?.(message);
        },
        onError: (error: string) => {
          setIsProcessing(false);
          onError?.(error);
        },
      });

      if (!result.success) {
        setIsProcessing(false);
        onError?.(result.error || 'Payment failed');
      }
    } catch (error: any) {
      setIsProcessing(false);
      onError?.(error.message || 'Payment failed');
    }
  };

  const getButtonText = () => {
    // Handle USDC payment states for wallet method
    if (selectedMethod === 'wallet') {
      if (usdcPayment.isApproving) {
        return 'Approving USDC...';
      }
      
      if (usdcPayment.isContributing) {
        return 'Contributing to Campaign...';
      }
      
      if (!isConnected) {
        return 'Connect Wallet to Fund';
      }
      
      return 'Fund with Wallet';
    }
    
    // Handle other payment methods
    if (isProcessing) {
      return selectedMethod === 'card' ? 'Redirecting to Coinbase...' : 
             'Connecting to Exchange...';
    }
    
    return `Fund with ${selectedMethod === 'card' ? 'Card' : 'Coinbase'}`;
  };

  if (!showPaymentMethods) {
    return (
      <button
        onClick={() => setShowPaymentMethods(true)}
        disabled={disabled}
        className={className}
      >
        Fund This Campaign
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <PaymentMethodSelector
        selected={selectedMethod}
        onChange={setSelectedMethod}
      />
      
      <div className="flex space-x-3">
        <button
          onClick={() => setShowPaymentMethods(false)}
          disabled={isProcessing}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handlePayment}
          disabled={
            disabled || 
            isProcessing || 
            usdcPayment.isApproving || 
            usdcPayment.isContributing || 
            (!isConnected && selectedMethod === 'wallet')
          }
          className={`flex-1 ${className}`}
        >
          {getButtonText()}
        </button>
      </div>
      
      {/* Payment Method Specific Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-xs text-blue-800">
          {selectedMethod === 'wallet' && (
            <>
              <strong>💳 Wallet Payment:</strong> This will use USDC from your connected wallet. 
              Make sure you have sufficient USDC balance and ETH for gas fees.
              {(usdcPayment.isApproving || usdcPayment.isContributing) && (
                <div className="mt-2 text-blue-700 font-medium">
                  {usdcPayment.isApproving && '🔐 Step 1/2: Approving USDC spending...'}
                  {usdcPayment.isContributing && '💰 Step 2/2: Contributing to campaign...'}
                </div>
              )}
            </>
          )}
          {selectedMethod === 'card' && (
            <>
              <strong>💳 Card Payment:</strong> You'll be redirected to Coinbase to buy USDC 
              with your credit/debit card, then automatically fund the campaign.
            </>
          )}
          {selectedMethod === 'exchange' && (
            <>
              <strong>🏦 Exchange Payment:</strong> Connect your Coinbase account to use 
              USDC from your exchange balance with lower fees.
            </>
          )}
        </div>
      </div>
    </div>
  );
}