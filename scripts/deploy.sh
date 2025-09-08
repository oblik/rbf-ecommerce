#!/bin/bash

set -e

echo "🚀 RBF Protocol Deployment Script"
echo "================================"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env file"
    exit 1
fi

if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
    echo "❌ Error: BASE_SEPOLIA_RPC_URL not set in .env file"
    exit 1
fi

echo "📦 Installing Foundry dependencies..."
cd contracts
forge install --no-commit openzeppelin/openzeppelin-contracts

echo "🔨 Building contracts..."
forge build

echo "🧪 Running tests..."
forge test

echo "🚀 Deploying to Base Sepolia..."
forge script script/DeployFactory.s.sol:DeployFactory \
    --rpc-url $BASE_SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    -vvvv

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the deployed contract addresses"
echo "2. Update apps/web-rbf/.env with NEXT_PUBLIC_FACTORY_ADDRESS and NEXT_PUBLIC_USDC_ADDRESS"
echo "3. Run 'npm run dev' to start the development servers"