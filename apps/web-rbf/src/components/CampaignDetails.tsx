'use client';

import { useState } from 'react';
import { useEnhancedCampaigns, type EnhancedCampaign } from '@/hooks/useEnhancedCampaigns';
import { useBusinessRegistry } from '@/hooks/useBusinessRegistry';
import { formatDistanceToNow } from 'date-fns';
import { InvestmentRiskAnalysis, RiskBadge } from './InvestmentRiskAnalysis';
import { CompactHealthScore, HealthScore } from './HealthScoreIndicator';
import { BusinessMetricsSummary } from './BusinessMetrics';
import { BusinessAnalytics } from './BusinessAnalytics';
import { MerchantKPICards } from './MerchantKPICards';
import { RepaymentTimeline } from './RepaymentTimeline';
import { OwnerSettlementPanel } from './OwnerSettlementPanel';
import Link from 'next/link';

interface CampaignDetailsProps {
  campaignId: string;
}

export default function CampaignDetails({ campaignId }: CampaignDetailsProps) {
  const { campaigns, loading, error } = useEnhancedCampaigns();
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
    { id: 'performance', label: 'Performance' },
    { id: 'business', label: 'Business Info' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'terms', label: 'Terms' },
    { id: 'updates', label: 'Updates' },
  ];

  const progressPercentage = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;
  const daysLeft = Math.max(0, Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6">
      {/* Campaign Image */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {campaign.metadata?.image ? (
          <img 
            src={campaign.metadata.image.startsWith('ipfs://') 
              ? `https://ipfs.io/ipfs/${campaign.metadata.image.replace('ipfs://', '')}`
              : campaign.metadata.image
            } 
            alt={campaign.metadata.title}
            className="w-full h-64 sm:h-80 object-cover"
            onError={(e) => {
              // Fallback to alternative IPFS gateways if the primary fails
              const target = e.target as HTMLImageElement;
              const originalSrc = target.src;
              
              if (originalSrc.includes('ipfs.io')) {
                target.src = originalSrc.replace('https://ipfs.io/ipfs/', 'https://dweb.link/ipfs/');
              } else if (originalSrc.includes('dweb.link')) {
                target.src = originalSrc.replace('https://dweb.link/ipfs/', 'https://cloudflare-ipfs.com/ipfs/');
              } else if (originalSrc.includes('cloudflare-ipfs.com')) {
                target.src = originalSrc.replace('https://cloudflare-ipfs.com/ipfs/', 'https://gateway.pinata.cloud/ipfs/');
              } else {
                // If all IPFS gateways fail, hide the image and show fallback
                target.style.display = 'none';
                const fallbackDiv = target.nextElementSibling;
                if (fallbackDiv) {
                  fallbackDiv.classList.remove('hidden');
                }
              }
            }}
          />
        ) : (
          <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">
                  {campaign.metadata?.businessName?.[0] || 'B'}
                </span>
              </div>
              <p className="text-green-800 font-medium">{campaign.metadata?.businessName || 'Business'}</p>
            </div>
          </div>
        )}
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
                    ? 'border-green-500 text-sky-600'
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
                <div className="text-gray-700 leading-relaxed">
                  {campaign.metadata?.description ? (
                    <p>{campaign.metadata.description}</p>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-yellow-800">Campaign details loading...</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Campaign metadata is temporarily unavailable. Please check back later or contact the business directly.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name:</span>
                      <span className="font-medium">
                        {campaign.metadata?.businessName || 'Loading...'}
                      </span>
                    </div>
                    {campaign.metadata?.website && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Website:</span>
                        <a 
                          href={campaign.metadata.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-green-700"
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
                        {campaign.createdAt 
                          ? new Date(Number(campaign.createdAt) * 1000).toLocaleDateString() 
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">
                        {campaign.fundingActive ? 'Fundraising' : 'Completed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Owner Settlement Panel (only visible to owner) */}
              <OwnerSettlementPanel
                campaignAddress={campaign.address as `0x${string}`}
                ownerAddress={campaign.owner as `0x${string}`}
                revenueSharePercent={campaign.revenueSharePercent}
                repaymentCap={campaign.repaymentCap}
                totalRepaid={BigInt(campaign.totalRepaid || 0)}
                fundingGoal={BigInt(campaign.fundingGoal)}
                lastRevenueReport={Number(campaign.lastRevenueReport || 0)}
                campaignAbi={[]} // TODO: Import campaign ABI
              />

              {/* Repayment Timeline */}
              <RepaymentTimeline
                events={[]} // TODO: Fetch events from subgraph
                totalRepaid={BigInt(campaign.totalRepaid || 0)}
                repaymentCap={BigInt(campaign.repaymentCap)}
                fundingGoal={BigInt(campaign.fundingGoal)}
              />

              {/* Merchant KPIs (if Shopify connected) */}
              {campaign.metadata?.shopifyDomain && campaign.metadata?.shopifyAccessToken && (
                <MerchantKPICards
                  shop={campaign.metadata.shopifyDomain}
                  accessToken={campaign.metadata.shopifyAccessToken}
                  timezone={campaign.metadata?.timezone || 'America/New_York'}
                  windowDays={30}
                />
              )}

              {!campaign.metadata?.shopifyDomain && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-gray-600 text-center">
                    📊 Connect Shopify to see real-time business performance metrics
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                
                {campaign.businessHealth ? (
                  <div className="space-y-6">
                    {/* Business Health Details */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Health & Performance</h4>
                      <HealthScore score={campaign.businessHealth.healthScore} size="lg" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-sky-600 mb-1">
                            {Number(campaign.businessHealth.repaymentRate) / 100}%
                          </div>
                          <div className="text-sm text-gray-600">Repayment Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {Number(campaign.businessHealth.successRate) / 100}%
                          </div>
                          <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {campaign.businessHealth.riskLevel}
                          </div>
                          <div className="text-sm text-gray-600">Risk Level</div>
                        </div>
                      </div>
                    </div>

                    {/* Business Status */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Verification Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            campaign.businessHealth.isRegistered ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-sm">
                            {campaign.businessHealth.isRegistered ? 'Registered on Platform' : 'Not Registered'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            campaign.businessHealth.isVerified ? 'bg-sky-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-sm">
                            {campaign.businessHealth.isVerified ? 'Verified Business' : 'Unverified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Business Metrics Preview */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Platform Metrics</h4>
                      <BusinessMetricsSummary address={campaign.owner} compact />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Business information not available
                  </div>
                )}
                
                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Contact & Links</h4>
                  <div className="space-y-3">
                    {campaign.metadata?.website && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Website:</span>
                        <a 
                          href={campaign.metadata.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-sky-800"
                        >
                          Visit Website →
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Profile:</span>
                      <Link
                        href={`/business/profile/${campaign.owner}`}
                        className="text-sky-600 hover:text-sky-800"
                      >
                        View Full Profile →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <BusinessAnalytics address={campaign.owner} />
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-sky-50 rounded-lg p-4">
                    <h4 className="font-medium text-sky-900 mb-2">Revenue Share</h4>
                    <p className="text-2xl font-bold text-sky-900">
                      {(campaign.revenueSharePercent / 100) || 5}%
                    </p>
                    <p className="text-sm text-sky-700 mt-1">
                      Monthly revenue percentage shared with investors
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Repayment Cap</h4>
                    <p className="text-2xl font-bold text-purple-900">
                      {(campaign.repaymentCap / 10000) || 1.5}x
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
                  <li>Share {(campaign.revenueSharePercent / 100) || 5}% of monthly revenue until cap is reached</li>
                  <li>Maximum repayment is {(campaign.repaymentCap / 10000) || 1.5}x the original investment</li>
                </ol>
              </div>

              {/* Risk Assessment Link */}
              {campaign.riskAnalysis && (
                <div className="mt-6 bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sky-900 mb-1">Investment Risk Assessment</h4>
                      <p className="text-sm text-sky-700">
                        View detailed risk analysis based on business health metrics
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="text-sm bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
                    >
                      View Analytics
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'updates' && (
            <div className="text-center py-12">
              <p className="text-gray-500">No updates available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}