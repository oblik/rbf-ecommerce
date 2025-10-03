'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { saveShopifyConnection } from '@/lib/storage/connections';

export default function ShopifyConnectedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address } = useAccount();
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');

  useEffect(() => {
    const shop = searchParams.get('shop');
    const accessToken = searchParams.get('accessToken');
    const scope = searchParams.get('scope');

    if (!shop || !accessToken || !scope || !address) {
      setStatus('error');
      return;
    }

    try {
      // Save to localStorage
      saveShopifyConnection(address, {
        shop,
        accessToken,
        scope
      });

      setStatus('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/business/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to save connection:', error);
      setStatus('error');
    }
  }, [searchParams, address, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'saving' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
            <h1 className="text-xl font-semibold text-gray-900 mt-4">
              Connecting Shopify...
            </h1>
            <p className="text-gray-600 mt-2">
              Saving your connection securely
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-gray-900">
              Shopify Connected!
            </h1>
            <p className="text-gray-600 mt-2">
              Your store is now connected. Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <h1 className="text-xl font-semibold text-gray-900">
              Connection Failed
            </h1>
            <p className="text-gray-600 mt-2">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => router.push('/business/dashboard')}
              className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
