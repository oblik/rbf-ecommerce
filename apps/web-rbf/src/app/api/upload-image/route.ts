import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create FormData for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);
    
    const metadata = JSON.stringify({
      name: `Campaign Image - ${file.name}`,
      keyvalues: {
        type: 'campaign-image',
        timestamp: new Date().toISOString(),
        filename: file.name,
      },
    });
    
    pinataFormData.append('pinataMetadata', metadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY!,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json({ hash: result.IpfsHash });
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    return NextResponse.json(
      { error: 'Failed to upload image to IPFS' },
      { status: 500 }
    );
  }
}