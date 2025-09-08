import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  
  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  // Forward to the main credit-score endpoint
  return fetch(`${request.nextUrl.origin}/api/credit-score?shop=${shop}`);
}