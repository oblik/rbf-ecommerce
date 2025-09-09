'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
  address: string;
  fundingGoal: string;
  totalRaised: string;
  deadline: string;
  isActive: boolean;
  backerCount?: number;
  metadata?: {
    title?: string;
    description?: string;
    businessName?: string;
    website?: string;
    image?: string;
    revenueShare?: number;
    repaymentCap?: number;
    createdAt?: string;
  };
}

interface CampaignManagementCardProps {
  campaign: Campaign;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

export default function CampaignManagementCard({ 
  campaign, 
  isSelected, 
  onSelect 
}: CampaignManagementCardProps) {
  const [showActions, setShowActions] = useState(false);

  const progressPercentage = (Number(campaign.totalRaised) / Number(campaign.fundingGoal)) * 100;
  const daysLeft = Math.max(0, Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
  const raised = Number(campaign.totalRaised);
  const goal = Number(campaign.fundingGoal);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-300 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Selection checkbox */}
        <div className="flex items-center pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Campaign image */}
        <div className="flex-shrink-0">
          {campaign.metadata?.image ? (
            <img 
              src={campaign.metadata.image} 
              alt={campaign.metadata.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
              <span className="text-green-800 font-bold text-lg">
                {campaign.metadata?.businessName?.[0] || 'C'}
              </span>
            </div>
          )}
        </div>

        {/* Campaign details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Link 
                  href={`/campaign/${campaign.address}`}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
                >
                  {campaign.metadata?.title || 'Untitled Campaign'}
                </Link>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  campaign.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.isActive ? 'Active' : 'Ended'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                By {campaign.metadata?.businessName || 'Unknown Business'}
              </p>
              
              {campaign.metadata?.description && (
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {campaign.metadata.description}
                </p>
              )}

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    ${raised.toLocaleString()} raised
                  </span>
                  <span className="text-sm text-gray-500">
                    {progressPercentage.toFixed(1)}% of ${goal.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>{campaign.backerCount || 0} investors</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {campaign.isActive 
                      ? `${daysLeft} days left`
                      : 'Campaign ended'
                    }
                  </span>
                </div>
                {campaign.metadata?.createdAt && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      Created {formatDistanceToNow(new Date(campaign.metadata.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <Link
                    href={`/campaign/${campaign.address}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Campaign
                  </Link>
                  <Link
                    href={`/campaign/${campaign.address}/analytics`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Analytics
                  </Link>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Submit Revenue Report
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Edit Campaign
                  </button>
                  {campaign.isActive && (
                    <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      End Campaign
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue sharing terms */}
      {campaign.metadata?.revenueShare && campaign.metadata?.repaymentCap && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-3 py-1 rounded-full">
                <span className="text-blue-700 font-medium">
                  {campaign.metadata.revenueShare}% revenue share
                </span>
              </div>
              <div className="bg-purple-50 px-3 py-1 rounded-full">
                <span className="text-purple-700 font-medium">
                  {campaign.metadata.repaymentCap}x repayment cap
                </span>
              </div>
            </div>
            
            {campaign.isActive && (
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 text-xs font-medium">Revenue sharing phase</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}