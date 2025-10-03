'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface PayPalConnectButtonProps {
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PayPalConnectButton({
  onConnectionSuccess,
  onConnectionError,
  className = '',
  size = 'md'
}: PayPalConnectButtonProps) {
  const { address } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const handleConnect = async () => {
    if (!address) {
      onConnectionError?.('Please connect your wallet first');
      return;
    }

    setIsConnecting(true);

    try {
      // Get PayPal OAuth URL from our API
      const response = await fetch(`/api/paypal/auth?merchantAddress=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get PayPal authorization URL');
      }

      // Redirect to PayPal OAuth page
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('PayPal connection error:', error);
      setIsConnecting(false);
      onConnectionError?.(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={!address || isConnecting}
      className={`
        inline-flex items-center justify-center space-x-2
        bg-[#0070ba] text-white rounded-md hover:bg-[#005ea6]
        focus:outline-none focus:ring-2 focus:ring-[#0070ba] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${sizeClasses[size]} ${className}
      `}
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <span>💙</span>
          <span>Connect PayPal</span>
        </>
      )}
    </button>
  );
}
