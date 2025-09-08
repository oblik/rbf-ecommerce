import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002',
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  },
};

export default nextConfig;