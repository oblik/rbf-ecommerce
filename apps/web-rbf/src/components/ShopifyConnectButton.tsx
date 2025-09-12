'use client';

import { useState } from 'react';
import { 
  ShoppingBagIcon, 
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface ShopifyConnectButtonProps {
  onConnectionSuccess?: (creditScore: any) => void;
  onConnectionError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ShopifyConnectButton({
  onConnectionSuccess,
  onConnectionError,
  className = '',
  size = 'md'
}: ShopifyConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [showInput, setShowInput] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base', 
    lg: 'px-6 py-3 text-lg'
  };

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      setShowInput(true);
      return;
    }

    if (!shopDomain.includes('.myshopify.com')) {
      onConnectionError?.('Please enter a valid Shopify domain (e.g., yourstore.myshopify.com)');
      return;
    }

    setIsConnecting(true);

    try {
      // Get auth URL from our API
      const response = await fetch(`/api/shopify/auth?shop=${encodeURIComponent(shopDomain)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Shopify connection');
      }

      // Redirect to Shopify OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Shopify connection error:', error);
      onConnectionError?.(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(false);
    }
  };

  if (showInput && !isConnecting) {
    return (
      <div className="space-y-3">
        <div>
          <label htmlFor="shopDomain" className="block text-sm font-medium text-gray-700 mb-2">
            Shopify Store Domain
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="shopDomain"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="yourstore.myshopify.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              onClick={handleConnect}
              disabled={!shopDomain.trim()}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            We'll securely connect to your Shopify store to verify revenue data
          </p>
        </div>
        <button
          onClick={() => setShowInput(false)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`
        inline-flex items-center justify-center space-x-2 
        bg-cyan-600 text-white rounded-md hover:bg-cyan-700 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
          <ShoppingBagIcon className="h-5 w-5" />
          <span>Connect Shopify Store</span>
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </>
      )}
    </button>
  );
}