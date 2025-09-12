'use client';

import { useParams } from 'next/navigation';
import { BusinessProfile } from '@/components/BusinessProfile';
import Link from 'next/link';

export default function BusinessProfilePage() {
  const params = useParams();
  const address = params.address as string;

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Profile</h1>
          <p className="text-gray-600">Invalid business address provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-sky-600 hover:text-sky-800 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Campaigns
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Profile</h1>
        <p className="text-gray-600">View detailed information about this business</p>
      </div>

      <BusinessProfile address={address} />
    </div>
  );
}