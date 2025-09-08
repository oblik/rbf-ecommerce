'use client';

import { useState } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatDistanceToNow } from 'date-fns';
import RiskAssessment from './RiskAssessment';

interface CampaignDetailsProps {
  campaignId: string;
}

export default function CampaignDetails({ campaignId }: CampaignDetailsProps) {
  const { campaigns, loading, error } = useCampaigns();
  const [activeTab, setActiveTab] = useState('overview');
  
  const campaign = campaigns.find(c => c.address === campaignId);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800 font-medium">
          {error || 'Campaign not found'}
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'terms', label: 'Terms' },
    { id: 'updates', label: 'Updates' },
    { id: 'comments', label: 'Comments' },
  ];

  const progressPercentage = (Number(campaign.totalRaised) / Number(campaign.fundingGoal)) * 100;
  const daysLeft = Math.max(0, Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6">
      {/* Campaign Image */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {campaign.metadata?.image ? (
          <img 
            src={campaign.metadata.image} 
            alt={campaign.metadata.title}
            className="w-full h-64 sm:h-80 object-cover"
          />
        ) : (
          <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">
                  {campaign.metadata?.businessName?.[0] || 'B'}
                </span>
              </div>
              <p className="text-green-800 font-medium">{campaign.metadata?.businessName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {campaign.metadata?.title || 'Untitled Campaign'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>By {campaign.metadata?.businessName}</span>
              {campaign.metadata?.website && (
                <a 
                  href={campaign.metadata.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700"
                >
                  Visit Website →
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {campaign.isActive ? 'Active' : 'Completed'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              ${Number(campaign.totalRaised).toLocaleString()} raised
            </span>
            <span className="text-sm text-gray-500">
              {progressPercentage.toFixed(1)}% of goal
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ${Number(campaign.fundingGoal).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Goal</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {campaign.backerCount || 0}
            </p>
            <p className="text-sm text-gray-600">Backers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {daysLeft}
            </p>
            <p className="text-sm text-gray-600">Days Left</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About this campaign</h3>
                <p className="text-gray-700 leading-relaxed">
                  {campaign.metadata?.description || 'No description available.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name:</span>
                      <span className="font-medium">{campaign.metadata?.businessName}</span>
                    </div>
                    {campaign.metadata?.website && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Website:</span>
                        <a 
                          href={campaign.metadata.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700"
                        >
                          Visit
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Campaign Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {campaign.metadata?.createdAt 
                          ? formatDistanceToNow(new Date(campaign.metadata.createdAt), { addSuffix: true })
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">
                        {campaign.isActive ? 'Fundraising' : 'Completed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Revenue Share</h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {campaign.metadata?.revenueShare || 5}%
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Monthly revenue percentage shared with investors
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Repayment Cap</h4>
                    <p className="text-2xl font-bold text-purple-900">
                      {campaign.metadata?.repaymentCap || 1.5}x
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      Maximum return as multiple of investment
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">How it works</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
                  <li>Investors fund your campaign with USDC</li>
                  <li>You receive the funding to grow your business</li>
                  <li>Share {campaign.metadata?.revenueShare || 5}% of monthly revenue until cap is reached</li>
                  <li>Maximum repayment is {campaign.metadata?.repaymentCap || 1.5}x the original investment</li>
                </ol>
              </div>

              {/* Risk Assessment */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Risk Assessment</h4>
                <RiskAssessment 
                  businessName={campaign.metadata?.businessName}
                  website={campaign.metadata?.website}
                  showFullReport={true}
                />
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="text-center py-12">
              <p className="text-gray-500">No updates available yet.</p>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="text-center py-12">
              <p className="text-gray-500">Comments coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}