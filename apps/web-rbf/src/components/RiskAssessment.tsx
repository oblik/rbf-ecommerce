'use client';

import { useState, useEffect } from 'react';

interface RiskData {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  monthlyRevenue: number;
  eligibleFunding: number;
  factors: {
    creditHistory: string;
    businessAge: string;
    revenueGrowth: string;
    industryRisk: string;
  };
}

interface RiskAssessmentProps {
  businessName?: string;
  website?: string;
  showFullReport?: boolean;
}

export default function RiskAssessment({ 
  businessName, 
  website, 
  showFullReport = false 
}: RiskAssessmentProps) {
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (businessName || website) {
      fetchRiskAssessment();
    }
  }, [businessName, website]);

  const fetchRiskAssessment = async () => {
    if (!businessName && !website) return;

    setLoading(true);
    setError(null);

    try {
      // Call our Shopify Credit API for risk assessment
      const response = await fetch('/api/credit-score', {
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
        throw new Error('Failed to fetch risk assessment');
      }

      const data = await response.json();
      setRiskData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-blue-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded flex-1"></div>
        </div>
        <div className="mt-2 h-3 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-red-800 text-sm">
            Risk assessment unavailable
          </span>
        </div>
        <button
          onClick={fetchRiskAssessment}
          className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
        >
          Retry assessment
        </button>
      </div>
    );
  }

  if (!riskData) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-600 text-sm">
            No risk assessment available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Risk Score Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getRiskIcon(riskData.riskLevel)}
            <div>
              <h4 className="font-medium text-gray-900">Risk Assessment</h4>
              <p className="text-sm text-gray-600">
                Powered by Shopify Credit Engine
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {riskData.score}/100
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(riskData.riskLevel)}`}>
                {riskData.riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Credit Score
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">Monthly Revenue</span>
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">
            ${riskData.monthlyRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Eligible Funding</span>
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">
            ${riskData.eligibleFunding.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Detailed Report */}
      {showFullReport && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h5 className="font-medium text-gray-900 mb-3">Risk Factors</h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Credit History</span>
              <span className="text-sm font-medium text-gray-900">{riskData.factors.creditHistory}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Business Age</span>
              <span className="text-sm font-medium text-gray-900">{riskData.factors.businessAge}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className="text-sm font-medium text-gray-900">{riskData.factors.revenueGrowth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Industry Risk</span>
              <span className="text-sm font-medium text-gray-900">{riskData.factors.industryRisk}</span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs text-yellow-800">
              <strong>Risk Assessment Notice:</strong> This assessment is based on available data and should not be considered as investment advice. 
              All investments carry risk and past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}