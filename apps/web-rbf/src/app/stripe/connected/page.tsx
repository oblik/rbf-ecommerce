'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { saveStripeConnection } from '@/lib/storage/connections';

export default function StripeConnectedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');

  useEffect(() => {
    const accountId = searchParams.get('accountId');
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const scope = searchParams.get('scope');
    const merchantAddress = searchParams.get('merchantAddress');

    if (!accountId || !accessToken || !scope || !merchantAddress) {
      setStatus('error');
      return;
    }

    try {
      // Save to localStorage
      saveStripeConnection(merchantAddress, {
        accountId,
        accessToken,
        refreshToken: refreshToken || undefined,
        scope
      });

      setStatus('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/business/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to save Stripe connection:', error);
      setStatus('error');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {status === 'saving' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <h1 className="text-xl font-semibold text-gray-900 mt-4">
              Connecting Stripe...
            </h1>
            <p className="text-gray-600 mt-2">
              Saving your connection securely
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-purple-600 text-5xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-gray-900">
              Stripe Connected!
            </h1>
            <p className="text-gray-600 mt-2">
              Your Stripe account is now connected. Redirecting to dashboard...
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
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
