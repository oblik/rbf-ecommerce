'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

interface WooCommerceConnectButtonProps {
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WooCommerceConnectButton({
  onConnectionSuccess,
  onConnectionError,
  className = '',
  size = 'md'
}: WooCommerceConnectButtonProps) {
  const { address } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showStoreInput, setShowStoreInput] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');

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

    if (!storeUrl || !storeUrl.trim()) {
      onConnectionError?.('Please enter your WooCommerce store URL');
      return;
    }

    setIsConnecting(true);

    try {
      // Validate URL format
      let cleanUrl = storeUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      // Get WooCommerce auth URL from our API
      const response = await fetch(
        `/api/woocommerce/auth?merchantAddress=${address}&storeUrl=${encodeURIComponent(cleanUrl)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get WooCommerce authorization URL');
      }

      // Store pending connection data for the callback
      // (WooCommerce sends credentials to callback_url, not return_url)
      sessionStorage.setItem('woocommerce_pending_auth', JSON.stringify({
        merchantAddress: address,
        storeUrl: data.storeUrl
      }));

      // Redirect to WooCommerce authorization page
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('WooCommerce connection error:', error);
      setIsConnecting(false);
      onConnectionError?.(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  if (showStoreInput) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="yourstore.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isConnecting}
        />
        <div className="flex gap-2">
          <button
            onClick={handleConnect}
            disabled={isConnecting || !storeUrl.trim()}
            className={`
              flex-1 inline-flex items-center justify-center space-x-2
              bg-purple-600 text-white rounded-md hover:bg-purple-700
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              px-3 py-2 text-sm
            `}
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <span>Connect</span>
            )}
          </button>
          <button
            onClick={() => {
              setShowStoreInput(false);
              setStoreUrl('');
            }}
            disabled={isConnecting}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowStoreInput(true)}
      disabled={!address}
      className={`
        inline-flex items-center justify-center space-x-2
        bg-purple-600 text-white rounded-md hover:bg-purple-700
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${sizeClasses[size]} ${className}
      `}
    >
      <span>🛒</span>
      <span>Connect WooCommerce</span>
    </button>
  );
}
