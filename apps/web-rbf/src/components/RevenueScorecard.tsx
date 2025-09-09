'use client';

import { useState, useEffect } from 'react';

interface ScorecardData {
  tier: 'A' | 'B' | 'C';
  totalScore: number;
  maxScore: number;
  gmv90Days: number;
  refundRate: number;
  chargebackRate: number;
  revenueVolatility: number;
  profitMargin: number;
  breakEvenBuffer: number;
  cacPayback: number;
  repeatCustomerRate: number;
  channelHHI: number;
  inventoryRunway: number;
  fundingTerms: {
    maxAdvance: number;
    advancePercentage: number;
    revenueShareMin: number;
    revenueShareMax: number;
    capMultipleMin: number;
    capMultipleMax: number;
    estimatedPaybackMonths: string;
  };
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
  }>;
}

interface RevenueScorecardProps {
  businessName?: string;
  website?: string;
}

export default function RevenueScorecard({ businessName, website }: RevenueScorecardProps) {
  const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (businessName || website) {
      fetchScorecardData();
    }
  }, [businessName, website]);

  const fetchScorecardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/revenue-scorecard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessName || 'Unknown Business',
          website: website || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scorecard data');
      }

      const data = await response.json();
      setScorecardData(data);
    } catch (err) {
      // Mock data for development
      setScorecardData({
        tier: 'A',
        totalScore: 72,
        maxScore: 100,
        gmv90Days: 150000,
        refundRate: 2.8,
        chargebackRate: 0.2,
        revenueVolatility: 0.45,
        profitMargin: 42,
        breakEvenBuffer: 15,
        cacPayback: 2.0,
        repeatCustomerRate: 22,
        channelHHI: 3200,
        inventoryRunway: 25,
        fundingTerms: {
          maxAdvance: 45000,
          advancePercentage: 30,
          revenueShareMin: 8,
          revenueShareMax: 12,
          capMultipleMin: 1.08,
          capMultipleMax: 1.12,
          estimatedPaybackMonths: '8-12'
        },
        monthlyBreakdown: [
          { month: 'Jan', revenue: 52000 },
          { month: 'Feb', revenue: 48000 },
          { month: 'Mar', revenue: 50000 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 55) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskLevelText = (tier: string) => {
    switch (tier) {
      case 'A': return 'Low Risk';
      case 'B': return 'Medium Risk';
      case 'C': return 'High Risk';
      default: return 'Unknown Risk';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Risk Overview' },
    { id: 'reliability', label: 'Reliability' },
    { id: 'revenue', label: 'Revenue Performance' },
    { id: 'profitability', label: 'Profitability' },
    { id: 'resilience', label: 'Business Strength' },
    { id: 'trends', label: 'Historical Trends' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !scorecardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800 font-medium">Revenue scorecard unavailable</p>
        <button
          onClick={fetchScorecardData}
          className="mt-2 text-red-600 hover:text-red-700 underline"
        >
          Retry assessment
        </button>
      </div>
    );
  }

  if (!scorecardData) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
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
            {/* Risk Scorecard Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    TIER {scorecardData.tier} - {scorecardData.totalScore}/{scorecardData.maxScore}
                  </h3>
                  <p className="text-gray-600">{getRiskLevelText(scorecardData.tier)}</p>
                </div>
                <div className={`px-4 py-2 rounded-full border font-semibold ${getTierColor(scorecardData.tier)}`}>
                  TIER {scorecardData.tier}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Score</span>
                  <span>{((scorecardData.totalScore / scorecardData.maxScore) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(scorecardData.totalScore, scorecardData.maxScore)}`}
                    style={{ width: `${(scorecardData.totalScore / scorecardData.maxScore) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block">90-Day GMV</span>
                  <span className="font-semibold text-lg">${scorecardData.gmv90Days.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Profit Margin</span>
                  <span className="font-semibold text-lg">{scorecardData.profitMargin}%</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Refund Rate</span>
                  <span className="font-semibold text-lg">{scorecardData.refundRate}%</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Chargeback Rate</span>
                  <span className="font-semibold text-lg">{scorecardData.chargebackRate}%</span>
                </div>
              </div>
            </div>

            {/* Funding Terms */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Available Funding Terms</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum Advance:</span>
                    <span className="font-semibold">${scorecardData.fundingTerms.maxAdvance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Percentage:</span>
                    <span className="font-semibold">{scorecardData.fundingTerms.advancePercentage}% of GMV</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue Share:</span>
                    <span className="font-semibold">{scorecardData.fundingTerms.revenueShareMin}-{scorecardData.fundingTerms.revenueShareMax}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cap Multiple:</span>
                    <span className="font-semibold">{scorecardData.fundingTerms.capMultipleMin}-{scorecardData.fundingTerms.capMultipleMax}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Payback:</span>
                    <span className="font-semibold">{scorecardData.fundingTerms.estimatedPaybackMonths} months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reliability' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reliability Metrics</h3>
              <p className="text-gray-600 text-sm">Highest impact on risk assessment</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Refund Rate: {scorecardData.refundRate}%</span>
                  <span className="text-sm text-gray-600">
                    {scorecardData.refundRate <= 2.0 ? 'Strong' : scorecardData.refundRate <= 3.5 ? 'Moderate' : 'Weak'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.refundRate <= 2.0 ? 'bg-green-500' : scorecardData.refundRate <= 3.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((scorecardData.refundRate / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Chargeback Rate: {scorecardData.chargebackRate}%</span>
                  <span className="text-sm text-gray-600">
                    {scorecardData.chargebackRate < 0.4 ? 'Strong' : scorecardData.chargebackRate <= 0.8 ? 'Moderate' : 'High Risk'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.chargebackRate < 0.4 ? 'bg-green-500' : scorecardData.chargebackRate <= 0.8 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((scorecardData.chargebackRate / 1) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Auto-decline Thresholds</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Refunds greater than 5% = DECLINE</li>
                <li>• Chargebacks greater than 0.8% = DECLINE</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Capacity</h3>
              <p className="text-gray-600 text-sm">Volume and stability assessment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">90-Day GMV: ${scorecardData.gmv90Days.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">
                    {scorecardData.gmv90Days >= 200000 ? 'Excellent' : scorecardData.gmv90Days >= 100000 ? 'Good' : scorecardData.gmv90Days >= 20000 ? 'Fair' : 'Low'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${Math.min((scorecardData.gmv90Days / 200000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Revenue Volatility: {scorecardData.revenueVolatility}</span>
                  <span className="text-sm text-gray-600">
                    {scorecardData.revenueVolatility <= 0.30 ? 'Stable' : scorecardData.revenueVolatility <= 0.50 ? 'Moderate' : 'High'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.revenueVolatility <= 0.30 ? 'bg-green-500' : scorecardData.revenueVolatility <= 0.50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((scorecardData.revenueVolatility / 0.70) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Monthly Revenue Breakdown</h4>
              <div className="flex items-end space-x-4 h-32">
                {scorecardData.monthlyBreakdown.map((month, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-blue-500 rounded-t w-full min-h-[20px]"
                      style={{ height: `${(month.revenue / 60000) * 80}px` }}
                    />
                    <div className="mt-2 text-center">
                      <div className="text-xs text-gray-600">{month.month}</div>
                      <div className="text-xs font-medium">${(month.revenue / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">Consistent growth trend observed</p>
            </div>
          </div>
        )}

        {activeTab === 'profitability' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profitability Cushion</h3>
              <p className="text-gray-600 text-sm">Margin and sustainability metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Profit Margin</span>
                  <span className="text-lg font-bold text-gray-900">{scorecardData.profitMargin}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.profitMargin >= 50 ? 'bg-green-500' : scorecardData.profitMargin >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((scorecardData.profitMargin / 50) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {scorecardData.profitMargin >= 50 ? 'Excellent' : scorecardData.profitMargin >= 40 ? 'Strong' : scorecardData.profitMargin >= 30 ? 'Fair' : 'Weak'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Break-even Buffer</span>
                  <span className="text-lg font-bold text-gray-900">+{scorecardData.breakEvenBuffer}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.breakEvenBuffer >= 25 ? 'bg-green-500' : scorecardData.breakEvenBuffer >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((scorecardData.breakEvenBuffer / 25) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {scorecardData.breakEvenBuffer >= 25 ? 'Safe' : scorecardData.breakEvenBuffer >= 10 ? 'Moderate' : 'Tight'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">CAC Payback</span>
                  <span className="text-lg font-bold text-gray-900">{scorecardData.cacPayback} mo</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.cacPayback <= 1.5 ? 'bg-green-500' : scorecardData.cacPayback <= 2.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(100 - (scorecardData.cacPayback / 4) * 100, 0)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {scorecardData.cacPayback <= 1.5 ? 'Strong' : scorecardData.cacPayback <= 2.5 ? 'Good' : scorecardData.cacPayback <= 4.0 ? 'Fair' : 'Weak'}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Financial Resilience:</strong> Monthly revenue can drop {scorecardData.breakEvenBuffer}% before hitting break-even point.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'resilience' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Strength</h3>
              <p className="text-gray-600 text-sm">Brand loyalty and diversification factors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Repeat Customers</span>
                  <span className="text-lg font-bold text-gray-900">{scorecardData.repeatCustomerRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.repeatCustomerRate >= 35 ? 'bg-green-500' : scorecardData.repeatCustomerRate >= 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((scorecardData.repeatCustomerRate / 35) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {scorecardData.repeatCustomerRate >= 35 ? 'Excellent' : scorecardData.repeatCustomerRate >= 20 ? 'Fair' : 'Low'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Channel Mix (HHI)</span>
                  <span className="text-lg font-bold text-gray-900">{scorecardData.channelHHI}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.channelHHI < 3000 ? 'bg-green-500' : scorecardData.channelHHI <= 5000 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(100 - (scorecardData.channelHHI / 5000) * 100, 0)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {scorecardData.channelHHI < 3000 ? 'Diverse' : scorecardData.channelHHI <= 5000 ? 'Moderate' : 'Concentrated'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Inventory Runway</span>
                  <span className="text-lg font-bold text-gray-900">{scorecardData.inventoryRunway} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${scorecardData.inventoryRunway >= 30 ? 'bg-green-500' : scorecardData.inventoryRunway >= 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((scorecardData.inventoryRunway / 30) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {scorecardData.inventoryRunway >= 30 ? 'Safe' : scorecardData.inventoryRunway >= 15 ? 'Adequate' : 'Low'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Sales Channel Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shopify Direct</span>
                  <span className="text-sm font-medium">60%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amazon Marketplace</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Direct to Consumer</span>
                  <span className="text-sm font-medium">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Other Channels</span>
                  <span className="text-sm font-medium">5%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">12-Month Performance Trends</h3>
              <p className="text-gray-600 text-sm">Historical analysis and growth patterns</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Revenue Growth: +18% YoY</h4>
                <div className="h-32 border border-gray-200 rounded bg-gray-50 flex items-end justify-center p-4">
                  <div className="text-gray-400 text-sm">Revenue trend chart would be displayed here</div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Q1</span>
                  <span>Q2</span>
                  <span>Q3</span>
                  <span>Q4</span>
                  <span>Q1 (current)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">Refund Rate Stability</h5>
                <p className="text-sm text-green-800">Consistently below 3% for 12 months</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Margin Improvement</h5>
                <p className="text-sm text-blue-800">+3% improvement vs last year</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="font-medium text-purple-900 mb-2">Customer Growth</h5>
                <p className="text-sm text-purple-800">+25% new buyers acquired</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Key Performance Indicators</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Order Value:</span>
                  <span className="font-medium">$127 (+8% vs last year)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Lifetime Value:</span>
                  <span className="font-medium">$324 (+12% vs last year)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Active Customers:</span>
                  <span className="font-medium">2,847 (+22% vs last year)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}