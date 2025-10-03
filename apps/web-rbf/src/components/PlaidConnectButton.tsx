'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePlaidLink } from 'react-plaid-link';
import { savePlaidConnection } from '@/lib/storage/connections';

interface PlaidConnectButtonProps {
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlaidConnectButton({
  onConnectionSuccess,
  onConnectionError,
  className = '',
  size = 'md'
}: PlaidConnectButtonProps) {
  const { address } = useAccount();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Fetch link token when component mounts
  useEffect(() => {
    if (!address) return;

    const fetchLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantAddress: address })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get Plaid link token');
        }

        setLinkToken(data.linkToken);
      } catch (error) {
        console.error('Failed to fetch Plaid link token:', error);
        onConnectionError?.(error instanceof Error ? error.message : 'Failed to initialize Plaid');
      }
    };

    fetchLinkToken();
  }, [address, onConnectionError]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      setLoading(true);
      try {
        // Exchange public token for access token
        const response = await fetch('/api/plaid/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicToken,
            merchantAddress: address,
            institutionName: metadata.institution?.name || 'Bank Account'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to connect bank account');
        }

        // Save to localStorage
        if (address) {
          savePlaidConnection(address, {
            accessToken: data.accessToken,
            itemId: data.itemId,
            institutionName: metadata.institution?.name || 'Bank Account'
          });
        }

        onConnectionSuccess?.();
      } catch (error) {
        console.error('Plaid connection error:', error);
        onConnectionError?.(error instanceof Error ? error.message : 'Connection failed');
      } finally {
        setLoading(false);
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
        onConnectionError?.(err.error_message || 'Connection cancelled');
      }
    }
  });

  const handleConnect = () => {
    if (!address) {
      onConnectionError?.('Please connect your wallet first');
      return;
    }

    if (!ready) {
      onConnectionError?.('Plaid Link is not ready yet');
      return;
    }

    open();
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading || !ready || !address}
      className={`
        inline-flex items-center justify-center space-x-2
        bg-blue-600 text-white rounded-md hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${sizeClasses[size]} ${className}
      `}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <span>🏦</span>
          <span>Connect Bank</span>
        </>
      )}
    </button>
  );
}
