'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { saveWooCommerceConnection } from '@/lib/storage/connections';

export default function WooCommerceConnectedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address } = useAccount();
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // WooCommerce passes success/user_id in return_url
    const success = searchParams.get('success');
    const userId = searchParams.get('user_id'); // This is merchantAddress

    // Consumer key/secret are sent to callback_url (server-side)
    // We need to get them from sessionStorage (set by connect flow)
    const storedData = typeof window !== 'undefined'
      ? sessionStorage.getItem('woocommerce_pending_connection')
      : null;

    if (!success || success !== '1') {
      setStatus('error');
      setErrorMessage('Authorization was not successful');
      return;
    }

    if (!address) {
      setStatus('error');
      setErrorMessage('Wallet not connected');
      return;
    }

    if (!storedData) {
      setStatus('error');
      setErrorMessage('Connection data not found. Please try again.');
      return;
    }

    try {
      const { storeUrl, consumerKey, consumerSecret } = JSON.parse(storedData);

      if (!storeUrl || !consumerKey || !consumerSecret) {
        throw new Error('Incomplete connection data');
      }

      // Verify user_id matches
      if (userId && userId.toLowerCase() !== address.toLowerCase()) {
        setStatus('error');
        setErrorMessage('Wallet address mismatch');
        return;
      }

      // Save WooCommerce connection to localStorage
      saveWooCommerceConnection(address, {
        storeUrl,
        consumerKey,
        consumerSecret,
        keyPermissions: 'read_write'
      });

      // Clear session storage
      sessionStorage.removeItem('woocommerce_pending_connection');

      setStatus('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/business/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to save WooCommerce connection:', error);
      setStatus('error');
      setErrorMessage('Failed to save connection');
    }
  }, [searchParams, address, router]);

  if (status === 'saving') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting WooCommerce...</h2>
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
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">WooCommerce Connected!</h2>
          <p className="text-gray-600 mb-4">
            Your WooCommerce store has been successfully connected. Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}
