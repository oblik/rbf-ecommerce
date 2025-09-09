import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both old format (businessName, website) and new format (shop, revenueInCents, businessData)
    const { businessName, website, shop, revenueInCents, businessData } = body;

    if (!businessName && !shop) {
      return NextResponse.json(
        { error: 'Business name or shop parameter is required' },
        { status: 400 }
      );
    }

    // Call our Shopify Credit service
    const creditServiceUrl = process.env.SHOPIFY_CREDIT_API_URL || 'http://localhost:3002';
    
    let requestBody;
    if (shop && revenueInCents !== undefined) {
      // New format with real Shopify data
      requestBody = {
        shop,
        revenueInCents,
        businessData,
      };
    } else {
      // Old format with business name/website
      requestBody = {
        businessName,
        website: website || '',
      };
    }

    const response = await fetch(`${creditServiceUrl}/api/credit-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Credit service returned ${response.status}`);
    }

    const creditData = await response.json();
    
    return NextResponse.json(creditData);
  } catch (error) {
    console.error('Credit score API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch credit score',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}