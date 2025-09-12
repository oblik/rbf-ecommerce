'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface CampaignMetadata {
  title: string;
  description: string;
  image?: string;
  businessName?: string;
  website?: string;
  creditScore?: {
    score: number;
    riskLevel: string;
  };
}

interface Campaign {
  address: `0x${string}`;
  owner: string;
  fundingGoal: string;
  totalFunded: string;
  deadline: string;
  revenueSharePercent: number;
  repaymentCap: number;
  fundingActive: boolean;
  repaymentActive: boolean;
  backerCount?: number;
  metadata: CampaignMetadata | null;
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

  const progressPercentage = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;
  const daysLeft = Math.max(0, Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
  const raised = Number(campaign.totalFunded);
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
            className="h-4 w-4 text-cyan-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Campaign image or placeholder */}
        <div className="flex-shrink-0">
          {campaign.metadata?.image ? (
            <img 
              src={campaign.metadata.image} 
              alt={campaign.metadata.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
              <span className="text-green-800 font-bold text-xl">
                {campaign.metadata?.businessName?.[0] || 'B'}
              </span>
            </div>
          )}
        </div>

        {/* Campaign details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {campaign.metadata?.title || 'Untitled Campaign'}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  campaign.fundingActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.fundingActive ? 'Active' : 'Ended'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {campaign.metadata?.description || 'No description available'}
              </p>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-cyan-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${raised.toLocaleString()} raised</span>
                  <span>${goal.toLocaleString()} goal</span>
                </div>
              </div>
            </div>

            {/* Action menu */}
            <div className="relative ml-4">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              
              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <Link 
                    href={`/campaign/${campaign.address}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Campaign
                  </Link>
                  <Link 
                    href={`/campaign/${campaign.address}/analytics`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Analytics
                  </Link>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Edit Campaign
                  </button>
                  {campaign.fundingActive && (
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
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-700 font-medium">
                {(campaign.revenueSharePercent / 100) || 5}% revenue share
              </span>
            </div>
            <div className="bg-purple-50 px-3 py-1 rounded-full">
              <span className="text-purple-700 font-medium">
                {(campaign.repaymentCap / 10000) || 1.5}x repayment cap
              </span>
            </div>
          </div>
            
          {campaign.fundingActive && (
            <div className="flex items-center space-x-2">
              <span className="text-cyan-600 text-xs font-medium">Revenue sharing phase</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}