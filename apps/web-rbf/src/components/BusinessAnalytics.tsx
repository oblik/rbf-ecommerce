'use client';

import { useState } from 'react';

interface BusinessAnalyticsProps {
  address?: string;
  compact?: boolean;
}

export function BusinessAnalytics({ address, compact = false }: BusinessAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('Revenue');
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Business Analytics</h3>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Tier A
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 pt-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['Revenue', 'Risk', 'Performance', 'Brand'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Repeat Customer Rate</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">22%</div>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-1/4 h-full bg-yellow-500 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-500">Fair</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Channel Concentration</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">3200 HHI</div>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-1/2 h-full bg-orange-500 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-500">Moderate</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">MER Buffer vs Break-even</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">15%</div>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-1/3 h-full bg-yellow-500 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-500">Safe</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">CAC Payback Period</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">2.0 months</div>
              <div className="flex items-center">
                <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-3/4 h-full bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-500">Good</span>
              </div>
            </div>
          </div>
        </div>


        {/* Data Source */}
        <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span>Live Shopify data • Updated 2 hours ago</span>
        </div>
      </div>
    </div>
  );
}