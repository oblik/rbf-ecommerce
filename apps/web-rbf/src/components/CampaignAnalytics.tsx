'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  monthlyRevenue: Array<{ month: string; revenue: number; }>;
  metrics: {
    avgOrderValue: number;
    customerLifetimeValue: number;
    monthlyActiveCustomers: number;
    revenueGrowthYoY: number;
    refundRate: number;
    chargebackRate: number;
  };
  riskScore: number;
  tier: 'A' | 'B' | 'C';
}

interface CampaignAnalyticsProps {
  campaignId: string;
  businessName?: string;
  website?: string;
}

export default function CampaignAnalytics({ campaignId, businessName, website }: CampaignAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'risk' | 'performance' | 'brand'>('revenue');

  useEffect(() => {
    // Always load mock data for demo purposes
    fetchAnalyticsData();
  }, [campaignId]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data for development
      setAnalyticsData({
        monthlyRevenue: [
          { month: 'Jul', revenue: 45000 },
          { month: 'Aug', revenue: 52000 },
          { month: 'Sep', revenue: 48000 },
          { month: 'Oct', revenue: 55000 },
          { month: 'Nov', revenue: 51000 },
          { month: 'Dec', revenue: 58000 }
        ],
        metrics: {
          avgOrderValue: 127,
          customerLifetimeValue: 324,
          monthlyActiveCustomers: 2847,
          revenueGrowthYoY: 18,
          refundRate: 2.8,
          chargebackRate: 0.2
        },
        riskScore: 72,
        tier: 'A'
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'A': return 'text-green-700 bg-green-50 border-green-200';
      case 'B': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'C': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...analyticsData.monthlyRevenue.map(m => m.revenue));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Business Analytics</h3>
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getTierColor(analyticsData.tier)}`}>
          Tier {analyticsData.tier}
        </div>
      </div>

      {/* Metric Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {[
          { id: 'revenue', label: 'Revenue' },
          { id: 'risk', label: 'Risk' },
          { id: 'performance', label: 'Performance' },
          { id: 'brand', label: 'Brand' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMetric(tab.id as any)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeMetric === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeMetric === 'revenue' && (
        <div className="space-y-4">
          {/* Revenue Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">6-Month Revenue Trend</h4>
            <div className="flex items-end justify-between h-20 bg-gray-50 rounded-lg p-3">
              {analyticsData.monthlyRevenue.map((month, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-sky-500 rounded-t w-4 min-h-[8px] mb-1"
                    style={{ height: `${(month.revenue / maxRevenue) * 48}px` }}
                    title={`${month.month}: $${month.revenue.toLocaleString()}`}
                  />
                  <span className="text-xs text-gray-600">{month.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Total Sales 90-day</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.min((150000 / 200000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Good</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">${(150000).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Revenue Stability</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${(0.55 / 1) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Strong</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">{(1 - 0.45).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Contribution Margin</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${(42 / 60) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Good</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">42%</span>
            </div>
          </div>
        </div>
      )}

      {activeMetric === 'risk' && (
        <div className="space-y-4">
          {/* Risk Factors */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Refund Rate</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.max(100 - (analyticsData.metrics.refundRate / 5) * 100, 20)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Good</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">{analyticsData.metrics.refundRate}%</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Chargeback Rate</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.max(100 - (analyticsData.metrics.chargebackRate / 1) * 100, 85)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Excellent</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">{analyticsData.metrics.chargebackRate}%</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Inventory Runway</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${(25 / 45) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Moderate</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">25 days</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 text-center">
              Risk assessment based on Shopify transaction data
            </div>
          </div>
        </div>
      )}

      {activeMetric === 'performance' && (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">YoY Growth</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.min((analyticsData.metrics.revenueGrowthYoY / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Strong</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">+{analyticsData.metrics.revenueGrowthYoY}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Avg Order Value</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.min((analyticsData.metrics.avgOrderValue / 180) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Healthy</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">${analyticsData.metrics.avgOrderValue}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Customer LTV</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${Math.min((analyticsData.metrics.customerLifetimeValue / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Good</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">${analyticsData.metrics.customerLifetimeValue}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Monthly Customers</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.min((analyticsData.metrics.monthlyActiveCustomers / 4000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Excellent</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">{analyticsData.metrics.monthlyActiveCustomers.toLocaleString()}</span>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Stable revenue growth</span>
              </div>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-sm text-sky-800">Low customer concentration</span>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-purple-800">Improving margins</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMetric === 'brand' && (
        <div className="space-y-4">
          {/* Brand Strength Metrics */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Repeat Customer Rate</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${(22 / 40) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Fair</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">22%</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">Channel Concentration</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${Math.max(100 - (3200 / 8000) * 100, 25)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Moderate</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">3200 HHI</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">MER Buffer vs Break-even</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${(15 / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Safe</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">15%</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700 mb-1">CAC Payback Period</div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.max(100 - (2.0 / 6) * 100, 40)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">Good</span>
                </div>
              </div>
              <span className="font-semibold text-gray-900">2.0 months</span>
            </div>
          </div>

          {/* Brand Health Indicators */}
          <div className="space-y-2">
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <span className="text-sm text-sky-800">Diversified revenue channels</span>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Healthy customer acquisition cost</span>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-purple-800">Strong operational buffer</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Source */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Live Shopify data • Updated 2 hours ago</span>
        </div>
      </div>
    </div>
  );
}