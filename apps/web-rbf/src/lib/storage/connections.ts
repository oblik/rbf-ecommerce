/**
 * Local Storage for OAuth Connections
 *
 * Development: Uses localStorage
 * Production: Will migrate to Vercel KV
 */

export interface ShopifyConnection {
  shop: string;
  accessToken: string;
  scope: string;
  connectedAt: string;
  merchantAddress: string;
}

export interface StripeConnection {
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  scope: string;
  connectedAt: string;
  merchantAddress: string;
}

export interface PlaidConnection {
  accessToken: string;
  itemId: string;
  institutionName: string;
  connectedAt: string;
  merchantAddress: string;
}

export interface SquareConnection {
  merchantId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope: string;
  connectedAt: string;
  merchantAddress: string;
}

export interface ToastConnection {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  restaurantGuid?: string;
  scope: string;
  connectedAt: string;
  merchantAddress: string;
}

export interface PayPalConnection {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  merchantId?: string;
  scope: string;
  connectedAt: string;
  merchantAddress: string;
}

export interface WooCommerceConnection {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  keyPermissions: string;
  connectedAt: string;
  merchantAddress: string;
}

interface MerchantConnections {
  shopify?: ShopifyConnection;
  woocommerce?: WooCommerceConnection;
  stripe?: StripeConnection;
  plaid?: PlaidConnection;
  square?: SquareConnection;
  toast?: ToastConnection;
  paypal?: PayPalConnection;
}

const STORAGE_KEY = 'rbf_merchant_connections';

/**
 * Get all connections for current merchant
 */
export function getConnections(merchantAddress: string): MerchantConnections {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${merchantAddress.toLowerCase()}`);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load connections:', error);
    return {};
  }
}

/**
 * Save Shopify connection
 */
export function saveShopifyConnection(
  merchantAddress: string,
  connection: Omit<ShopifyConnection, 'merchantAddress' | 'connectedAt'>
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  connections.shopify = {
    ...connection,
    merchantAddress,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] Shopify connected for ${merchantAddress}`);
}

/**
 * Save Stripe connection
 */
export function saveStripeConnection(
  merchantAddress: string,
  connection: Omit<StripeConnection, 'merchantAddress' | 'connectedAt'>
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  connections.stripe = {
    ...connection,
    merchantAddress,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] Stripe connected for ${merchantAddress}`);
}

/**
 * Save Plaid connection
 */
export function savePlaidConnection(
  merchantAddress: string,
  connection: Omit<PlaidConnection, 'merchantAddress' | 'connectedAt'>
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  connections.plaid = {
    ...connection,
    merchantAddress,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] Plaid connected for ${merchantAddress}`);
}

/**
 * Save Square connection
 */
export function saveSquareConnection(
  merchantAddress: string,
  connection: Omit<SquareConnection, 'merchantAddress' | 'connectedAt'>
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  connections.square = {
    ...connection,
    merchantAddress,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] Square connected for ${merchantAddress}`);
}

/**
 * Save Toast connection
 */
export function saveToastConnection(
  merchantAddress: string,
  connection: Omit<ToastConnection, 'merchantAddress' | 'connectedAt'>
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  connections.toast = {
    ...connection,
    merchantAddress,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] Toast connected for ${merchantAddress}`);
}

/**
 * Save PayPal connection
 */
export function savePayPalConnection(
  merchantAddress: string,
  connection: Omit<PayPalConnection, 'merchantAddress' | 'connectedAt'>
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  connections.paypal = {
    ...connection,
    merchantAddress,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] PayPal connected for ${merchantAddress}`);
}

/**
 * Save WooCommerce connection
 */
export function saveWooCommerceConnection(
  merchantAddress: string,
  connection: Omit<WooCommerceConnection, 'merchantAddress' | 'connectedAt'>
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  connections.woocommerce = {
    ...connection,
    merchantAddress,
    connectedAt: new Date().toISOString()
  };

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] WooCommerce connected for ${merchantAddress}`);
}

/**
 * Remove a specific connection
 */
export function removeConnection(
  merchantAddress: string,
  type: 'shopify' | 'woocommerce' | 'stripe' | 'plaid' | 'square' | 'toast' | 'paypal'
): void {
  if (typeof window === 'undefined') return;

  const connections = getConnections(merchantAddress);
  delete connections[type];

  localStorage.setItem(
    `${STORAGE_KEY}_${merchantAddress.toLowerCase()}`,
    JSON.stringify(connections)
  );

  console.log(`[Storage] ${type} disconnected for ${merchantAddress}`);
}

/**
 * Clear all connections for merchant
 */
export function clearConnections(merchantAddress: string): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(`${STORAGE_KEY}_${merchantAddress.toLowerCase()}`);
  console.log(`[Storage] All connections cleared for ${merchantAddress}`);
}

/**
 * Check if a specific connection exists
 */
export function hasConnection(
  merchantAddress: string,
  type: 'shopify' | 'woocommerce' | 'stripe' | 'plaid' | 'square' | 'toast' | 'paypal'
): boolean {
  const connections = getConnections(merchantAddress);
  return !!connections[type];
}
