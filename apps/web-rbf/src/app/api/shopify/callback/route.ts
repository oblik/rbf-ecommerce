import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client/index';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');

    if (!code || !shop) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify state parameter for security
    if (state !== 'credit-scoring') {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    const shopifyClient = new ShopifyClient({
      apiKey: process.env.SHOPIFY_API_KEY || '',
      apiSecret: process.env.SHOPIFY_API_SECRET || '',
      scopes: ['read_orders', 'read_customers'],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/callback`
    });

    // Exchange code for access token
    const session = await shopifyClient.exchangeCodeForToken(shop, code);

    // Fetch revenue data
    const revenueData = await shopifyClient.getRevenueData(session, 30);

    // Calculate credit score
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/credit-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop,
        revenueInCents: Math.round(revenueData.totalRevenue * 100),
        businessData: {
          orderCount: revenueData.orderCount,
          currency: revenueData.currency,
          periodDays: revenueData.periodDays
        }
      })
    });

    const creditScore = await response.json();

    // Store session data (in production, use a database)
    // For now, we'll pass it in the redirect URL
    const redirectUrl = new URL('/request-funding', process.env.NEXT_PUBLIC_APP_URL!);
    redirectUrl.searchParams.set('creditScore', JSON.stringify(creditScore));
    redirectUrl.searchParams.set('shopifyConnected', 'true');

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Shopify callback error:', error);
    
    // Redirect to funding page with error
    const errorUrl = new URL('/request-funding', process.env.NEXT_PUBLIC_APP_URL!);
    errorUrl.searchParams.set('error', 'shopify_connection_failed');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}