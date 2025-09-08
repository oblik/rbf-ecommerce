import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io'],
  },
  env: {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
    NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS,
    NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
    NEXT_PUBLIC_SUBGRAPH_URL: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
  },
};

export default nextConfig;