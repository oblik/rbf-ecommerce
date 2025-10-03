'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface SquareConnectButtonProps {
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SquareConnectButton({
  onConnectionSuccess,
  onConnectionError,
  className = '',
  size = 'md'
}: SquareConnectButtonProps) {
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
      // Get Square OAuth URL from our API
      const response = await fetch(`/api/square/auth?merchantAddress=${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get Square authorization URL');
      }

      // Redirect to Square OAuth page
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Square connection error:', error);
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
        bg-black text-white rounded-md hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
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
          <span>⬛</span>
          <span>Connect Square</span>
        </>
      )}
    </button>
  );
}
