'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import CampaignStats from '@/components/CampaignStats';
import CampaignManagementCard from '@/components/CampaignManagementCard';
import { useCampaigns } from '@/hooks/useCampaigns';

type FilterType = 'all' | 'active' | 'ended' | 'draft';
type SortType = 'recent' | 'raised' | 'goal' | 'backers';

export default function DashboardPage() {
  const { authenticated, login } = usePrivy();
  const { address } = useAccount();
  const router = useRouter();
  const { campaigns, loading, error } = useCampaigns();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authenticated === false) {
      router.push('/');
    }
  }, [authenticated, router]);

  // Show loading while authentication is being determined
  if (authenticated === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Sign in to manage your campaigns and track performance
          </p>
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // Filter campaigns created by current user (mock implementation)
  const userCampaigns = campaigns.filter(campaign => {
    // In production, filter by campaign creator
    // For now, show all campaigns as mock user campaigns
    return true;
  });

  // Calculate aggregate stats
  const stats = {
    totalRaised: userCampaigns.reduce((sum, c) => {
      return sum + Number(c.totalRaised || 0);
    }, 0),
    activeCampaigns: userCampaigns.filter(c => c.isActive).length,
    totalBackers: userCampaigns.reduce((sum, c) => {
      return sum + (c.backerCount || 0);
    }, 0),
    totalCampaigns: userCampaigns.length,
  };

  // Filter campaigns
  const filteredCampaigns = userCampaigns.filter(campaign => {
    if (filter === 'all') return true;
    if (filter === 'active') return campaign.isActive;
    if (filter === 'ended') return !campaign.isActive;
    if (filter === 'draft') return Number(campaign.totalRaised) === 0;
    return true;
  });

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sort) {
      case 'recent':
        return Number(b.deadline) - Number(a.deadline);
      case 'raised':
        return Number(b.totalRaised) - Number(a.totalRaised);
      case 'goal':
        return Number(b.fundingGoal) - Number(a.fundingGoal);
      case 'backers':
        return (b.backerCount || 0) - (a.backerCount || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Business Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Manage and track your revenue-based financing campaigns
              </p>
            </div>
            
            <Link
              href="/create-campaign"
              className="flex items-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Campaign
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <CampaignStats stats={stats} />

        {/* Actions Bar */}
        <div className="my-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3">
            {selectedCampaigns.length > 0 && (
              <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export ({selectedCampaigns.length})
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Campaigns</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="draft">Drafts</option>
              </select>
              <svg className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="raised">Amount Raised</option>
                <option value="goal">Goal Amount</option>
                <option value="backers">Most Backers</option>
              </select>
              <svg className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700">Error loading campaigns</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : sortedCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first RevFlow campaign to start raising capital
            </p>
            <Link
              href="/create-campaign"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCampaigns.map((campaign) => (
              <CampaignManagementCard
                key={campaign.address}
                campaign={campaign}
                isSelected={selectedCampaigns.includes(campaign.address)}
                onSelect={(selected) => {
                  setSelectedCampaigns(prev => 
                    selected 
                      ? [...prev, campaign.address]
                      : prev.filter(id => id !== campaign.address)
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}