'use client';

import { getRiskLevel, formatHealthScore } from '@/hooks/useBusinessRegistry';

interface RiskBadgeProps {
  riskLevel: 'Low' | 'Medium' | 'High';
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ riskLevel, size = 'md' }: RiskBadgeProps) {
  const colors = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-red-100 text-red-800 border-red-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`font-medium rounded-full border ${colors[riskLevel]} ${sizes[size]}`}>
      {riskLevel} Risk
    </span>
  );
}

interface HealthScoreProps {
  score: bigint;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showRiskBadge?: boolean;
}

export function HealthScore({ 
  score, 
  size = 'md', 
  showPercentage = true, 
  showRiskBadge = true 
}: HealthScoreProps) {
  const percentage = Number(score) / 100;
  const riskLevel = getRiskLevel(score);
  
  const barColor = {
    Low: 'bg-green-500',
    Medium: 'bg-yellow-500',
    High: 'bg-red-500',
  }[riskLevel];

  const containerSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const barHeights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${containerSizes[size]}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-700">Health Score</span>
        <div className="flex items-center gap-2">
          {showPercentage && (
            <span className="font-bold text-gray-900">{formatHealthScore(score)}</span>
          )}
          {showRiskBadge && <RiskBadge riskLevel={riskLevel} size={size} />}
        </div>
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${barHeights[size]}`}>
        <div 
          className={`${barHeights[size]} rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface CompactHealthScoreProps {
  score: bigint;
  showLabel?: boolean;
}

export function CompactHealthScore({ score, showLabel = false }: CompactHealthScoreProps) {
  const riskLevel = getRiskLevel(score);
  const percentage = Number(score) / 100;
  
  const colors = {
    Low: 'text-green-600 bg-green-100',
    Medium: 'text-yellow-600 bg-yellow-100',
    High: 'text-red-600 bg-red-100',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors[riskLevel]}`}>
        <span className="text-xs font-bold">{Math.round(percentage)}</span>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-900">
            {formatHealthScore(score)}
          </span>
          <span className="text-xs text-gray-500">{riskLevel} Risk</span>
        </div>
      )}
    </div>
  );
}

interface HealthScoreProgressProps {
  currentScore: bigint;
  targetScore?: bigint;
  improvements?: string[];
}

export function HealthScoreProgress({ 
  currentScore, 
  targetScore = BigInt(8000), 
  improvements = [] 
}: HealthScoreProgressProps) {
  const currentPercentage = Number(currentScore) / 100;
  const targetPercentage = Number(targetScore) / 100;
  const currentRisk = getRiskLevel(currentScore);
  const targetRisk = getRiskLevel(targetScore);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-900">Health Score Progress</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Current:</span>
          <RiskBadge riskLevel={currentRisk} size="sm" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current Score</span>
          <span className="font-medium">{formatHealthScore(currentScore)}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 relative">
          <div 
            className="h-2 rounded-full bg-sky-500 transition-all duration-300"
            style={{ width: `${Math.min(currentPercentage, 100)}%` }}
          />
          {targetScore > currentScore && (
            <div 
              className="absolute top-0 h-2 bg-gray-400 opacity-30 rounded-full"
              style={{ width: `${Math.min(targetPercentage, 100)}%` }}
            />
          )}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>Target: {formatHealthScore(targetScore)}</span>
          <span>100%</span>
        </div>
      </div>

      {improvements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Ways to improve:</h4>
          <ul className="space-y-1">
            {improvements.map((improvement, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-center">
                <div className="w-1.5 h-1.5 bg-sky-400 rounded-full mr-2 flex-shrink-0" />
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}