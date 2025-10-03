import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  getConnections,
  hasConnection,
  removeConnection,
  type ShopifyConnection,
  type WooCommerceConnection,
  type StripeConnection,
  type PlaidConnection,
  type SquareConnection,
  type ToastConnection,
  type PayPalConnection
} from '@/lib/storage/connections';

interface MerchantConnections {
  shopify?: ShopifyConnection;
  woocommerce?: WooCommerceConnection;
  stripe?: StripeConnection;
  plaid?: PlaidConnection;
  square?: SquareConnection;
  toast?: ToastConnection;
  paypal?: PayPalConnection;
}

export function useMerchantConnections() {
  const { address } = useAccount();
  const [connections, setConnections] = useState<MerchantConnections>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setConnections({});
      setLoading(false);
      return;
    }

    // Load connections from localStorage
    const storedConnections = getConnections(address);
    setConnections(storedConnections);
    setLoading(false);
  }, [address]);

  const disconnect = (type: 'shopify' | 'woocommerce' | 'stripe' | 'plaid' | 'square' | 'toast' | 'paypal') => {
    if (!address) return;

    removeConnection(address, type);
    setConnections(prev => {
      const updated = { ...prev };
      delete updated[type];
      return updated;
    });
  };

  const refresh = () => {
    if (!address) return;
    const storedConnections = getConnections(address);
    setConnections(storedConnections);
  };

  return {
    connections,
    loading,
    hasShopify: !!connections.shopify,
    hasWooCommerce: !!connections.woocommerce,
    hasStripe: !!connections.stripe,
    hasPlaid: !!connections.plaid,
    hasSquare: !!connections.square,
    hasToast: !!connections.toast,
    hasPayPal: !!connections.paypal,
    disconnect,
    refresh
  };
}
