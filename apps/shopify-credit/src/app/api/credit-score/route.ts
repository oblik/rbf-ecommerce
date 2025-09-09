import { NextRequest, NextResponse } from 'next/server';

interface ShopifyMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerCount: number;
  returnRate: number;
  monthlyGrowthRate: number;
}

function calculateCreditScore(metrics: ShopifyMetrics): {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  monthlyRevenue: number;
  eligibleFunding: number;
  recommendations: string[];
} {
  let score = 50; // Base score
  const recommendations: string[] = [];

  // Revenue factor (up to 20 points)
  const monthlyRevenue = metrics.totalRevenue / 12;
  if (monthlyRevenue > 100000) score += 20;
  else if (monthlyRevenue > 50000) score += 15;
  else if (monthlyRevenue > 10000) score += 10;
  else if (monthlyRevenue > 5000) score += 5;

  // Order volume factor (up to 15 points)
  if (metrics.totalOrders > 1000) score += 15;
  else if (metrics.totalOrders > 500) score += 10;
  else if (metrics.totalOrders > 100) score += 5;

  // Customer retention factor (up to 10 points)
  const repeatCustomerRate = Math.min(metrics.customerCount / metrics.totalOrders, 0.5);
  score += Math.floor(repeatCustomerRate * 20);

  // Growth factor (up to 5 points)
  if (metrics.monthlyGrowthRate > 0.1) score += 5;
  else if (metrics.monthlyGrowthRate > 0.05) score += 3;
  else if (metrics.monthlyGrowthRate > 0) score += 1;

  // Penalties
  if (metrics.returnRate > 0.2) {
    score -= 10;
    recommendations.push('High return rate detected - consider improving product quality');
  }
  if (metrics.averageOrderValue < 50) {
    score -= 5;
    recommendations.push('Low average order value - consider upselling strategies');
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (score >= 75) {
    riskLevel = 'low';
    recommendations.push('Excellent credit profile - eligible for premium rates');
  } else if (score >= 55) {
    riskLevel = 'medium';
    recommendations.push('Good credit profile - standard rates apply');
  } else {
    riskLevel = 'high';
    recommendations.push('Consider improving metrics before applying');
  }

  // Calculate eligible funding (3-6 months of revenue based on score)
  const fundingMultiplier = score >= 75 ? 6 : score >= 55 ? 4 : 3;
  const eligibleFunding = Math.floor(monthlyRevenue * fundingMultiplier);

  return {
    score: Math.min(Math.max(score, 0), 100),
    riskLevel,
    monthlyRevenue: Math.floor(monthlyRevenue * 100), // in cents
    eligibleFunding: eligibleFunding * 100, // in cents
    recommendations,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, revenueInCents, businessData, businessName, website } = body;
    
    if (!shop && !businessName) {
      return NextResponse.json(
        { error: 'Missing shop or businessName parameter' },
        { status: 400 }
      );
    }

    let metrics: ShopifyMetrics;

    if (shop && revenueInCents !== undefined) {
      // Real Shopify data from OAuth flow
      console.log(`Calculating credit score for shop: ${shop} with real data`);
      
      const totalRevenue = revenueInCents / 100; // Convert cents to dollars
      const orderCount = businessData?.orderCount || 0;
      
      metrics = {
        totalOrders: orderCount,
        totalRevenue: totalRevenue,
        averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
        customerCount: Math.floor(orderCount * 0.7), // Estimate unique customers
        returnRate: Math.random() * 0.15, // Still need to estimate, could be fetched from Shopify API
        monthlyGrowthRate: Math.random() * 0.2, // Still need to estimate, would require historical data
      };
    } else {
      // Mock data for testing or when real data unavailable
      console.log(`Calculating credit score for business: ${businessName || shop} with mock data`);
      
      metrics = {
        totalOrders: Math.floor(Math.random() * 2000) + 100,
        totalRevenue: Math.floor(Math.random() * 1000000) + 50000,
        averageOrderValue: Math.floor(Math.random() * 200) + 30,
        customerCount: Math.floor(Math.random() * 1000) + 50,
        returnRate: Math.random() * 0.3,
        monthlyGrowthRate: (Math.random() * 0.3) - 0.1,
      };
    }

    const creditAssessment = calculateCreditScore(metrics);

    // Store in database or cache for retrieval
    // For now, we'll return immediately
    
    return NextResponse.json({
      message: "Credit score calculated successfully",
      shopDomain: shop || businessName,
      assessment: creditAssessment,
      timestamp: new Date().toISOString(),
      dataSource: revenueInCents !== undefined ? 'shopify_oauth' : 'mock',
    });

  } catch (error) {
    console.error('Credit score calculation failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate credit score',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  
  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  try {
    // In production, retrieve from database
    // For now, generate mock data
    const mockMetrics: ShopifyMetrics = {
      totalOrders: 850,
      totalRevenue: 425000,
      averageOrderValue: 125,
      customerCount: 600,
      returnRate: 0.08,
      monthlyGrowthRate: 0.12,
    };

    const creditAssessment = calculateCreditScore(mockMetrics);

    return NextResponse.json({
      shop,
      ...creditAssessment,
      verifiable: true,
      verification: {
        network: 'base-sepolia',
        chainId: 84532,
      }
    });

  } catch (error) {
    console.error('Failed to retrieve credit score:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve credit score',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}