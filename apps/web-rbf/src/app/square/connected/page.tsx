'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { saveSquareConnection } from '@/lib/storage/connections';

export default function SquareConnectedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address } = useAccount();
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const merchantId = searchParams.get('merchantId');
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const expiresAt = searchParams.get('expiresAt');
    const merchantAddress = searchParams.get('merchantAddress');

    if (!merchantId || !accessToken || !merchantAddress) {
      setStatus('error');
      setErrorMessage('Missing required connection data');
      return;
    }

    if (!address) {
      setStatus('error');
      setErrorMessage('Wallet not connected');
      return;
    }

    // Verify the merchant address matches the connected wallet
    if (address.toLowerCase() !== merchantAddress.toLowerCase()) {
      setStatus('error');
      setErrorMessage('Wallet address mismatch');
      return;
    }

    try {
      // Save Square connection to localStorage
      saveSquareConnection(address, {
        merchantId,
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: expiresAt || undefined,
        scope: 'ORDERS_READ MERCHANT_PROFILE_READ PAYMENTS_READ'
      });

      setStatus('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/business/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to save Square connection:', error);
      setStatus('error');
      setErrorMessage('Failed to save connection');
    }
  }, [searchParams, address, router]);

  if (status === 'saving') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting Square...</h2>
          <p className="text-gray-600">Please wait while we save your connection</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push('/business/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Square Connected!</h2>
          <p className="text-gray-600 mb-4">
            Your Square account has been successfully connected. Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}
