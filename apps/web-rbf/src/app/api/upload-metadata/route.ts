import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json();
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `Campaign Metadata - ${metadata.title || 'Untitled'}`,
          keyvalues: {
            type: 'campaign-metadata',
            timestamp: new Date().toISOString(),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json({ hash: result.IpfsHash });
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    return NextResponse.json(
      { error: 'Failed to upload metadata to IPFS' },
      { status: 500 }
    );
  }
}