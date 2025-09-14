import { baseSepolia } from 'wagmi/chains';

// Base Sepolia USDC Contract Address
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

// Base Sepolia Chain Configuration
export const CHAIN_CONFIG = {
  id: baseSepolia.id,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: baseSepolia.nativeCurrency,
  rpcUrls: baseSepolia.rpcUrls,
  blockExplorers: baseSepolia.blockExplorers,
} as const;

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  USDC: USDC_ADDRESS,
  FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
  BUSINESS_REGISTRY: process.env.NEXT_PUBLIC_BUSINESS_REGISTRY_ADDRESS as `0x${string}`,
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  USDC: {
    address: USDC_ADDRESS,
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    chainId: baseSepolia.id,
  },
} as const;

// Payment Configuration
export const PAYMENT_CONFIG = {
  MIN_CONTRIBUTION: 100, // $100 minimum
  COINBASE_APP_ID: process.env.NEXT_PUBLIC_COINBASE_APP_ID as string,
  SUPPORTED_CHAINS: [baseSepolia.id],
  SUPPORTED_ASSETS: ['USDC'],
  DEFAULT_NETWORK: 'base-sepolia',
} as const;

// Gas Configuration
export const GAS_CONFIG = {
  // Conservative gas limits for Base Sepolia
  APPROVE_GAS_LIMIT: 50000n,
  CONTRIBUTE_GAS_LIMIT: 100000n,
  // Gas price buffer for faster transactions
  GAS_PRICE_BUFFER: 1.1, // 10% buffer
} as const;