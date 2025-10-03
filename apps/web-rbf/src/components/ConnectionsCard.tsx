'use client';

import { useMerchantConnections } from '@/hooks/useMerchantConnections';
import ShopifyConnectButton from './ShopifyConnectButton';
import WooCommerceConnectButton from './WooCommerceConnectButton';
import StripeConnectButton from './StripeConnectButton';
import PlaidConnectButton from './PlaidConnectButton';
import SquareConnectButton from './SquareConnectButton';
import ToastConnectButton from './ToastConnectButton';
import PayPalConnectButton from './PayPalConnectButton';

export function ConnectionsCard() {
  const { connections, loading, hasShopify, hasWooCommerce, hasStripe, hasPlaid, hasSquare, hasToast, hasPayPal, disconnect } = useMerchantConnections();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Connections</h3>
        <p className="text-sm text-gray-600">
          Connect your business accounts to enable automatic KPI tracking
        </p>
      </div>

      <div className="space-y-4">
        {/* Shopify */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              🛍️
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Shopify</h4>
              {hasShopify ? (
                <p className="text-sm text-gray-600">
                  Connected: {connections.shopify?.shop}
                </p>
              ) : (
                <p className="text-sm text-gray-500">E-commerce platform</p>
              )}
            </div>
          </div>
          <div>
            {hasShopify ? (
              <button
                onClick={() => disconnect('shopify')}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md"
              >
                Disconnect
              </button>
            ) : (
              <ShopifyConnectButton size="sm" />
            )}
          </div>
        </div>

        {/* WooCommerce */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              🛒
            </div>
            <div>
              <h4 className="font-medium text-gray-900">WooCommerce</h4>
              {hasWooCommerce ? (
                <p className="text-sm text-gray-600">
                  Connected: {new URL(connections.woocommerce?.storeUrl || '').hostname}
                </p>
              ) : (
                <p className="text-sm text-gray-500">WordPress e-commerce</p>
              )}
            </div>
          </div>
          <div>
            {hasWooCommerce ? (
              <button
                onClick={() => disconnect('woocommerce')}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md"
              >
                Disconnect
              </button>
            ) : (
              <WooCommerceConnectButton size="sm" />
            )}
          </div>
        </div>

        {/* Stripe */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              💳
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Stripe</h4>
              {hasStripe ? (
                <p className="text-sm text-gray-600">
                  Connected: {connections.stripe?.accountId}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Payments & subscriptions</p>
              )}
            </div>
          </div>
          <div>
            {hasStripe ? (
              <button
                onClick={() => disconnect('stripe')}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md"
              >
                Disconnect
              </button>
            ) : (
              <StripeConnectButton size="sm" />
            )}
          </div>
        </div>

        {/* Plaid */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              🏦
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Plaid</h4>
              {hasPlaid ? (
                <p className="text-sm text-gray-600">
                  Connected: {connections.plaid?.institutionName}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Bank account data</p>
              )}
            </div>
          </div>
          <div>
            {hasPlaid ? (
              <button
                onClick={() => disconnect('plaid')}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md"
              >
                Disconnect
              </button>
            ) : (
              <PlaidConnectButton size="sm" />
            )}
          </div>
        </div>

        {/* Square */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              ⬛
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Square</h4>
              {hasSquare ? (
                <p className="text-sm text-gray-600">
                  Connected: {connections.square?.merchantId}
                </p>
              ) : (
                <p className="text-sm text-gray-500">POS & payments</p>
              )}
            </div>
          </div>
          <div>
            {hasSquare ? (
              <button
                onClick={() => disconnect('square')}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md"
              >
                Disconnect
              </button>
            ) : (
              <SquareConnectButton size="sm" />
            )}
          </div>
        </div>

        {/* Toast */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              🍞
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Toast</h4>
              {hasToast ? (
                <p className="text-sm text-gray-600">
                  Connected: {connections.toast?.restaurantGuid || 'Restaurant'}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Restaurant POS</p>
              )}
            </div>
          </div>
          <div>
            {hasToast ? (
              <button
                onClick={() => disconnect('toast')}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md"
              >
                Disconnect
              </button>
            ) : (
              <ToastConnectButton size="sm" />
            )}
          </div>
        </div>

        {/* PayPal */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              💙
            </div>
            <div>
              <h4 className="font-medium text-gray-900">PayPal</h4>
              {hasPayPal ? (
                <p className="text-sm text-gray-600">
                  Connected: {connections.paypal?.merchantId || 'Account'}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Universal payments</p>
              )}
            </div>
          </div>
          <div>
            {hasPayPal ? (
              <button
                onClick={() => disconnect('paypal')}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md"
              >
                Disconnect
              </button>
            ) : (
              <PayPalConnectButton size="sm" />
            )}
          </div>
        </div>
      </div>

      {(hasShopify || hasWooCommerce || hasStripe || hasPlaid || hasSquare || hasToast || hasPayPal) && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Your connection tokens are stored locally in your browser. For production use, we'll migrate to encrypted server-side storage.
          </p>
        </div>
      )}
    </div>
  );
}
