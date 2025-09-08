'use client';

import { useState } from 'react';

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

interface CampaignAnalyticsProps {
  campaign: Campaign;
}

export default function CampaignAnalytics({ campaign }: CampaignAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30d');

  // Mock analytics data - in production this would come from the subgraph/backend
  const mockAnalytics = {
    totalRaised: Number(campaign.totalRaised),
    totalInvestors: campaign.backerCount || 0,
    averageInvestment: campaign.backerCount ? Number(campaign.totalRaised) / campaign.backerCount : 0,
    conversionRate: 12.5,
    dailyViews: [
      { date: '2024-01-01', views: 150, investments: 2, amount: 1000 },
      { date: '2024-01-02', views: 200, investments: 3, amount: 2500 },
      { date: '2024-01-03', views: 180, investments: 1, amount: 500 },
      { date: '2024-01-04', views: 220, investments: 4, amount: 3000 },
      { date: '2024-01-05', views: 300, investments: 5, amount: 4500 },
      { date: '2024-01-06', views: 250, investments: 2, amount: 1500 },
      { date: '2024-01-07', views: 280, investments: 3, amount: 2000 },
    ],
    investorGeography: [
      { country: 'United States', investors: 45, percentage: 65 },
      { country: 'Canada', investors: 12, percentage: 17 },
      { country: 'United Kingdom', investors: 8, percentage: 11 },
      { country: 'Other', investors: 5, percentage: 7 },
    ],
    revenueSharing: {
      monthlyRevenue: 25000,
      sharePercentage: campaign.metadata?.revenueShare || 5,
      monthlyPayment: 1250,
      totalPaid: 7500,
      remainingCap: 15000,
    }
  };

  const progressPercentage = (Number(campaign.totalRaised) / Number(campaign.fundingGoal)) * 100;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Raised</span>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${mockAnalytics.totalRaised.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-1">
            {progressPercentage.toFixed(1)}% of goal
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Investors</span>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {mockAnalytics.totalInvestors}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Unique backers
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Investment</span>
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${mockAnalytics.averageInvestment.toLocaleString()}
          </p>
          <p className="text-sm text-purple-600 mt-1">
            Per investor
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Conversion Rate</span>
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {mockAnalytics.conversionRate}%
          </p>
          <p className="text-sm text-orange-600 mt-1">
            Views to investment
          </p>
        </div>
      </div>

      {/* Funding Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Funding Performance</h3>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Mock Chart Area */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">Funding performance chart would appear here</p>
            <p className="text-sm text-gray-400">Integration with Chart.js or similar visualization library</p>
          </div>
        </div>

        {/* Daily Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-medium">Date</th>
                <th className="text-right py-2 text-gray-600 font-medium">Views</th>
                <th className="text-right py-2 text-gray-600 font-medium">Investments</th>
                <th className="text-right py-2 text-gray-600 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockAnalytics.dailyViews.map((day, index) => (
                <tr key={day.date} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="text-right py-2">{day.views}</td>
                  <td className="text-right py-2">{day.investments}</td>
                  <td className="text-right py-2">${day.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Sharing */}
      {campaign.isActive && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Sharing Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Monthly Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Monthly Revenue</span>
                  <span className="font-semibold">${mockAnalytics.revenueSharing.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Revenue Share ({mockAnalytics.revenueSharing.sharePercentage}%)</span>
                  <span className="font-semibold text-green-600">${mockAnalytics.revenueSharing.monthlyPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Paid to Investors</span>
                  <span className="font-semibold">${mockAnalytics.revenueSharing.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Remaining Cap</span>
                  <span className="font-semibold text-blue-600">${mockAnalytics.revenueSharing.remainingCap.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Repayment Progress</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progress to Cap</span>
                  <span className="text-sm font-medium">{((mockAnalytics.revenueSharing.totalPaid / (Number(campaign.totalRaised) * (campaign.metadata?.repaymentCap || 1.5))) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((mockAnalytics.revenueSharing.totalPaid / (Number(campaign.totalRaised) * (campaign.metadata?.repaymentCap || 1.5))) * 100, 100)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ${mockAnalytics.revenueSharing.totalPaid.toLocaleString()} of ${(Number(campaign.totalRaised) * (campaign.metadata?.repaymentCap || 1.5)).toLocaleString()} total cap
                </p>
              </div>

              <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Submit Monthly Revenue Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investor Geography */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Investor Demographics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Geographic Distribution</h4>
            <div className="space-y-3">
              {mockAnalytics.investorGeography.map((location) => (
                <div key={location.country} className="flex items-center justify-between">
                  <span className="text-gray-700">{location.country}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${location.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {location.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Investment Ranges</h4>
            <div className="space-y-2">
              <div className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">$100 - $1,000</span>
                  <span className="font-medium">45% (31 investors)</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">$1,001 - $5,000</span>
                  <span className="font-medium">35% (24 investors)</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">$5,001 - $10,000</span>
                  <span className="font-medium">15% (10 investors)</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">$10,000+</span>
                  <span className="font-medium">5% (5 investors)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}