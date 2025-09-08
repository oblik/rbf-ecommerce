import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const SHOPIFY_SCOPES = 'read_orders,read_customers,read_products';
const SHOPIFY_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  
  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  console.log(`Auth Start: Initiating auth for shop: ${shop}`);
  
  try {
    // Generate nonce for security
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Build Shopify OAuth URL
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_API_KEY}&` +
      `scope=${SHOPIFY_SCOPES}&` +
      `redirect_uri=${encodeURIComponent(SHOPIFY_REDIRECT_URI)}&` +
      `state=${nonce}`;
    
    // Store nonce in cookie for verification
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('shopify_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('Auth Start Error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}