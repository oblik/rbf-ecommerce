export interface BusinessVertical {
  id: string;
  name: string;
  description: string;
  typicalMargins: {
    min: number;
    max: number;
    average: number;
  };
  riskFactors: string[];
  recommendedTerms: {
    maxRevenueShare: number;
    preferredRepaymentCap: number;
  };
  color: string; // For UI styling
  icon: string; // For visual representation
}

export const BUSINESS_VERTICALS: BusinessVertical[] = [
  {
    id: 'apparel',
    name: 'Apparel & Accessories',
    description: 'Clothing, shoes, bags, jewelry',
    typicalMargins: { min: 40, max: 60, average: 50 },
    riskFactors: ['High return rates', 'Seasonal demand', 'Inventory risk'],
    recommendedTerms: { maxRevenueShare: 12, preferredRepaymentCap: 1.8 },
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '👕'
  },
  {
    id: 'health-beauty',
    name: 'Health, Beauty & Wellness',
    description: 'Skincare, cosmetics, supplements, fitness',
    typicalMargins: { min: 60, max: 80, average: 70 },
    riskFactors: ['High CAC', 'Regulatory compliance', 'Brand loyalty'],
    recommendedTerms: { maxRevenueShare: 10, preferredRepaymentCap: 1.6 },
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🧴'
  },
  {
    id: 'food-beverage',
    name: 'Food & Beverage',
    description: 'Packaged foods, beverages, meal kits, specialty groceries',
    typicalMargins: { min: 20, max: 40, average: 30 },
    riskFactors: ['Perishable inventory', 'Complex logistics', 'Low margins'],
    recommendedTerms: { maxRevenueShare: 15, preferredRepaymentCap: 2.2 },
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🍕'
  },
  {
    id: 'home-lifestyle',
    name: 'Home & Lifestyle',
    description: 'Home goods, furniture, candles, decor',
    typicalMargins: { min: 30, max: 50, average: 40 },
    riskFactors: ['Bulky shipping', 'Damage risk', 'Economic sensitivity'],
    recommendedTerms: { maxRevenueShare: 13, preferredRepaymentCap: 1.9 },
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🏠'
  },
  {
    id: 'electronics',
    name: 'Electronics & Gadgets',
    description: 'Consumer tech, accessories, devices',
    typicalMargins: { min: 20, max: 35, average: 27 },
    riskFactors: ['Warranty costs', 'Tech obsolescence', 'High return rates'],
    recommendedTerms: { maxRevenueShare: 16, preferredRepaymentCap: 2.3 },
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📱'
  },
  {
    id: 'digital-products',
    name: 'Digital Products & Subscriptions',
    description: 'SaaS, courses, memberships, digital goods',
    typicalMargins: { min: 70, max: 95, average: 85 },
    riskFactors: ['Churn rates', 'Platform dependency', 'Competition'],
    recommendedTerms: { maxRevenueShare: 8, preferredRepaymentCap: 1.4 },
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '💻'
  },
  {
    id: 'services',
    name: 'Services & Hybrid Businesses',
    description: 'Coaching, consulting, service + product bundles',
    typicalMargins: { min: 40, max: 70, average: 55 },
    riskFactors: ['Labor costs', 'Scalability limits', 'Client dependency'],
    recommendedTerms: { maxRevenueShare: 11, preferredRepaymentCap: 1.7 },
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '🤝'
  },
  {
    id: 'other',
    name: 'Other / Miscellaneous',
    description: 'Businesses that don\'t fit neatly into other categories',
    typicalMargins: { min: 25, max: 60, average: 42 },
    riskFactors: ['Variable business model', 'Unknown risk profile'],
    recommendedTerms: { maxRevenueShare: 14, preferredRepaymentCap: 2.0 },
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '📦'
  }
];

// Utility functions
export const getVerticalById = (id: string): BusinessVertical | undefined => {
  return BUSINESS_VERTICALS.find(vertical => vertical.id === id);
};

export const getVerticalRecommendations = (verticalId: string) => {
  const vertical = getVerticalById(verticalId);
  if (!vertical) return null;
  
  return {
    suggestedRevenueShare: vertical.recommendedTerms.maxRevenueShare,
    suggestedRepaymentCap: vertical.recommendedTerms.preferredRepaymentCap,
    expectedMargins: vertical.typicalMargins,
    riskFactors: vertical.riskFactors
  };
};

export const getMarginRiskLevel = (averageMargin: number): 'low' | 'medium' | 'high' => {
  if (averageMargin >= 60) return 'low';
  if (averageMargin >= 35) return 'medium';
  return 'high';
};