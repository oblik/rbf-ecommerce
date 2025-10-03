#!/bin/bash

# Test Attestation v1 Implementation
# This script tests the attestation endpoint

echo "🧪 Testing Attestation v1 Implementation"
echo ""

# Check if required env vars are set
if [ -z "$ATTESTOR_PRIVATE_KEY" ] || [ -z "$PINATA_API_KEY" ] || [ -z "$PINATA_SECRET_KEY" ]; then
  echo "❌ Missing environment variables!"
  echo "Please set:"
  echo "  - ATTESTOR_PRIVATE_KEY"
  echo "  - PINATA_API_KEY"
  echo "  - PINATA_SECRET_KEY"
  echo ""
  echo "You can generate an attestor key with: cast wallet new"
  exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Test data (replace with your actual Shopify store)
MERCHANT_ADDRESS="0x1234567890123456789012345678901234567890"
SHOP="your-store.myshopify.com"
ACCESS_TOKEN="shpat_xxxxx"
TIMEZONE="America/New_York"
MONTH="2025-01"

echo "📝 Test Configuration:"
echo "  Merchant: $MERCHANT_ADDRESS"
echo "  Shop: $SHOP"
echo "  Month: $MONTH"
echo ""

# Make request to attestation endpoint
echo "🚀 Creating attestation..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/attest \
  -H "Content-Type: application/json" \
  -d "{
    \"merchantAddress\": \"$MERCHANT_ADDRESS\",
    \"shop\": \"$SHOP\",
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"timezone\": \"$TIMEZONE\",
    \"month\": \"$MONTH\"
  }")

echo ""
echo "📦 Response:"
echo "$RESPONSE" | jq '.'

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo ""
  echo "✅ Attestation created successfully!"

  PAYLOAD_CID=$(echo "$RESPONSE" | jq -r '.attestation.payloadCid')
  SIGNER=$(echo "$RESPONSE" | jq -r '.attestation.signer')

  echo ""
  echo "📜 Attestation Details:"
  echo "  IPFS CID: $PAYLOAD_CID"
  echo "  Signer: $SIGNER"
  echo "  View: https://ipfs.io/ipfs/$PAYLOAD_CID"

else
  echo ""
  echo "❌ Attestation failed!"
  echo "Check the error message above"
  exit 1
fi

echo ""
echo "🎉 Test complete!"
