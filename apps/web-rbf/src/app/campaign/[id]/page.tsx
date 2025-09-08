'use client';

import { useParams, useRouter } from 'next/navigation';
import CampaignDetails from '@/components/CampaignDetails';
import FundingCard from '@/components/FundingCard';

export default function CampaignPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const handleFundClick = () => {
    router.push(`/campaign/${id}/fund`);
  };

  if (!id || typeof id !== 'string') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">Invalid campaign ID</p>
          <a href="/" className="text-green-600 hover:text-green-700 underline mt-2 inline-block">
            Browse campaigns →
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8">
          <CampaignDetails campaignId={id} />
        </div>
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-8">
            <FundingCard campaignId={id} onFundClick={handleFundClick} />
          </div>
        </div>
      </div>
    </main>
  );
}