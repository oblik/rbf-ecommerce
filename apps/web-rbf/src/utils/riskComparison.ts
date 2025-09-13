export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ComparisonRating = 'Below Market' | 'Competitive' | 'Above Average';

interface RiskBenchmarks {
  revenueShare: {
    min: number;
    avg: number;
    max: number;
  };
  repaymentCap: {
    min: number;
    avg: number;
    max: number;
  };
}

// Platform benchmarks by risk level (in basis points for revenue share, and actual multiplier for repayment cap)
const RISK_BENCHMARKS: Record<RiskLevel, RiskBenchmarks> = {
  'Low': {
    revenueShare: { min: 300, avg: 420, max: 550 }, // 3% - 5.5%
    repaymentCap: { min: 12000, avg: 15000, max: 18000 } // 1.2x - 1.8x
  },
  'Medium': {
    revenueShare: { min: 450, avg: 580, max: 750 }, // 4.5% - 7.5%
    repaymentCap: { min: 15000, avg: 18000, max: 22000 } // 1.5x - 2.2x
  },
  'High': {
    revenueShare: { min: 600, avg: 800, max: 1200 }, // 6% - 12%
    repaymentCap: { min: 18000, avg: 25000, max: 35000 } // 1.8x - 3.5x
  }
};

export function getRevenueShareRating(
  revenueSharePercent: number, // in basis points (500 = 5%)
  riskLevel: RiskLevel
): number {
  const benchmarks = RISK_BENCHMARKS[riskLevel];
  
  // For revenue share, lower is better for investors (inverse scoring)
  if (revenueSharePercent <= benchmarks.revenueShare.min) return 5;
  if (revenueSharePercent <= benchmarks.revenueShare.avg * 0.9) return 4;
  if (revenueSharePercent <= benchmarks.revenueShare.avg * 1.1) return 3;
  if (revenueSharePercent <= benchmarks.revenueShare.max) return 2;
  return 1;
}

export function getRepaymentCapRating(
  repaymentCap: number, // in basis points (15000 = 1.5x)
  riskLevel: RiskLevel
): number {
  const benchmarks = RISK_BENCHMARKS[riskLevel];
  
  // For repayment cap, lower is better for investors (inverse scoring)
  if (repaymentCap <= benchmarks.repaymentCap.min) return 5;
  if (repaymentCap <= benchmarks.repaymentCap.avg * 0.9) return 4;
  if (repaymentCap <= benchmarks.repaymentCap.avg * 1.1) return 3;
  if (repaymentCap <= benchmarks.repaymentCap.max) return 2;
  return 1;
}

