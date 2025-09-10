'use client';

import { BusinessHealth, getRiskColorClasses } from '@/hooks/useEnhancedCampaigns';
import { CompactHealthScore } from './HealthScoreIndicator';
import { BusinessMetricsSummary } from './BusinessMetrics';

interface InvestmentRiskAnalysisProps {
  campaign: {
    address: string;
    owner: string;
    fundingGoal: string;
    totalFunded: string;
    revenueSharePercent: number;
    repaymentCap: number;
  };
  businessHealth?: BusinessHealth;
  riskAnalysis?: {
    overallRisk: 'Low' | 'Medium' | 'High';
    riskFactors: string[];
    investmentRecommendation: string;
  };
  compact?: boolean;
}

export function InvestmentRiskAnalysis({ 
  campaign, 
  businessHealth, 
  riskAnalysis,
  compact = false 
}: InvestmentRiskAnalysisProps) {
  if (!businessHealth || !riskAnalysis) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm">Risk analysis not available</span>
        </div>
      </div>
    );
  }

  const riskColors = getRiskColorClasses(riskAnalysis.overallRisk);
  const fundingProgress = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;

  if (compact) {
    return (
      <div className={`rounded-lg border p-3 ${riskColors.bg} ${riskColors.border}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Risk Assessment</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${riskColors.badge}`}>
            {riskAnalysis.overallRisk} Risk
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <CompactHealthScore score={businessHealth.healthScore} />
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Business Health</span>
              <span className="font-medium">{Number(businessHealth.healthScore) / 100}%</span>
            </div>
          </div>
        </div>

        {riskAnalysis.riskFactors.length > 0 && (
          <div className="space-y-1">
            {riskAnalysis.riskFactors.slice(0, 2).map((factor, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                {factor}
              </div>
            ))}
            {riskAnalysis.riskFactors.length > 2 && (
              <div className="text-xs text-gray-500">
                +{riskAnalysis.riskFactors.length - 2} more factors
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Risk Overview */}
      <div className={`rounded-lg border p-4 ${riskColors.bg} ${riskColors.border}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Investment Risk Analysis</h3>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${riskColors.badge}`}>
            {riskAnalysis.overallRisk} Risk
          </span>
        </div>
        
        <p className={`text-sm ${riskColors.text} mb-4`}>
          {riskAnalysis.investmentRecommendation}
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Health Score</div>
            <div className="text-lg font-bold text-gray-900">
              {Number(businessHealth.healthScore) / 100}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Funding Progress</div>
            <div className="text-lg font-bold text-gray-900">
              {fundingProgress.toFixed(0)}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Revenue Share</div>
            <div className="text-lg font-bold text-gray-900">
              {campaign.revenueSharePercent / 100}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Repayment Cap</div>
            <div className="text-lg font-bold text-gray-900">
              {campaign.repaymentCap / 100}x
            </div>
          </div>
        </div>
      </div>

      {/* Business Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Business Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            {businessHealth.isRegistered ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className="text-sm text-gray-600">
              {businessHealth.isRegistered ? 'Registered' : 'Not Registered'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {businessHealth.isVerified ? (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            )}
            <span className="text-sm text-gray-600">
              {businessHealth.isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-sm text-gray-600">
              {Number(businessHealth.repaymentRate) / 100}% Repayment Rate
            </span>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {riskAnalysis.riskFactors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Risk Factors</h4>
          <div className="space-y-2">
            {riskAnalysis.riskFactors.map((factor, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {factor}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Strengths */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Business Strengths</h4>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Stable revenue growth
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Low customer concentration risk
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Improving profit margins
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Strong customer retention rates
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Diversified revenue streams
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Healthy cash flow management
          </div>
        </div>
      </div>

      {/* Business Metrics Preview */}
      {businessHealth.isRegistered && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Business Performance</h4>
          <BusinessMetricsSummary address={campaign.owner} compact />
        </div>
      )}
    </div>
  );
}

interface RiskBadgeProps {
  riskLevel: 'Low' | 'Medium' | 'High';
  size?: 'sm' | 'md';
}

export function RiskBadge({ riskLevel, size = 'sm' }: RiskBadgeProps) {
  const colors = getRiskColorClasses(riskLevel);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-sm';
  
  return (
    <span className={`font-medium rounded-full ${colors.badge} ${sizeClasses}`}>
      {riskLevel} Risk
    </span>
  );
}

interface InvestmentWarningProps {
  riskLevel: 'Low' | 'Medium' | 'High';
  riskFactors: string[];
}

export function InvestmentWarning({ riskLevel, riskFactors }: InvestmentWarningProps) {
  if (riskLevel === 'Low' && riskFactors.length === 0) {
    return null;
  }

  const colors = getRiskColorClasses(riskLevel);
  
  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <div className="font-medium text-gray-900 mb-1">
            Investment carries {riskLevel.toLowerCase()} risk
          </div>
          {riskFactors.length > 0 && (
            <div className="text-sm text-gray-600">
              Consider these factors: {riskFactors.join(', ').toLowerCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}