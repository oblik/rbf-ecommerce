import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { businessName, website } = await request.json();

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Call our Shopify Credit service
    const creditServiceUrl = process.env.SHOPIFY_CREDIT_API_URL || 'http://localhost:3002';
    const response = await fetch(`${creditServiceUrl}/api/credit-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName,
        website: website || '',
      }),
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