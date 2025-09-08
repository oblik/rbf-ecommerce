# RBF Ecommerce Protocol

A decentralized Revenue-Based Financing (RBF) protocol for ecommerce businesses, built on Base blockchain. This protocol enables businesses to raise capital without equity dilution and allows investors to earn returns based on business revenue performance.

## 🚀 Features

- **Smart Contract Infrastructure**: Secure, auditable smart contracts for managing RBF campaigns
- **Web3 Integration**: Full wallet connectivity with Privy and Wagmi
- **Shopify Integration**: Credit scoring and automated revenue reporting for Shopify stores
- **Flexible Terms**: 5-20% revenue share rates with 1.1x-3x repayment caps
- **USDC-Based**: All transactions in stablecoin for predictable value
- **IPFS Metadata**: Decentralized storage for campaign information

## 📁 Project Structure

```
rbf-ecommerce/
├── apps/
│   ├── web-rbf/          # Main web application for investors/businesses
│   └── shopify-credit/   # Shopify credit scoring application
├── contracts/            # Smart contracts (Solidity)
│   ├── src/
│   │   ├── RBFCampaign.sol
│   │   ├── RBFCampaignFactory.sol
│   │   └── TestUSDC.sol
│   └── script/          # Deployment scripts
├── packages/            # Shared libraries
└── scripts/            # Build and deployment scripts
```

## 🛠 Tech Stack

- **Smart Contracts**: Solidity, Foundry
- **Frontend**: Next.js 15, React 19, TypeScript
- **Web3**: Wagmi, Viem, Privy
- **Blockchain**: Base (Ethereum L2)
- **Styling**: Tailwind CSS
- **Monorepo**: Turborepo

## 📋 Prerequisites

- Node.js 18+ and npm
- [Foundry](https://book.getfoundry.sh/getting-started/installation) for smart contract development
- A wallet with Base Sepolia testnet ETH

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rbf-ecommerce.git
   cd rbf-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp apps/web-rbf/.env.example apps/web-rbf/.env.local
   ```
   Update the `.env` files with your configuration.

4. **Deploy smart contracts**
   ```bash
   npm run deploy:contracts
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Web RBF app: http://localhost:3001
   - Shopify Credit app: http://localhost:3002

## 📝 Smart Contract Deployment

1. Configure your `.env` file with:
   - `BASE_SEPOLIA_RPC_URL`: Your RPC endpoint
   - `PRIVATE_KEY`: Deployer wallet private key
   - `BASESCAN_API_KEY`: For contract verification

2. Run deployment:
   ```bash
   ./scripts/deploy.sh
   ```

3. Update frontend configuration with deployed addresses in `apps/web-rbf/.env.local`

## 🔧 Development

### Running Tests
```bash
# Smart contract tests
cd contracts && forge test

# Frontend tests
npm run test
```

### Building for Production
```bash
npm run build
```

## 📚 API Documentation

### RBFCampaign Contract

Key functions:
- `contribute(uint256 amount)`: Contribute USDC to a campaign
- `submitRevenueShare(uint256 revenueAmount)`: Submit monthly revenue share
- `withdrawReturns()`: Withdraw investor returns
- `refund()`: Get refund if campaign fails

### RBFCampaignFactory Contract

Key functions:
- `createCampaign(...)`: Create a new RBF campaign
- `getCampaigns()`: Get all campaigns
- `getActiveCampaigns()`: Get currently funding campaigns

## 🔐 Security Considerations

- All smart contracts use OpenZeppelin's battle-tested libraries
- Reentrancy protection on all state-changing functions
- Comprehensive input validation and error handling
- Recommended: Professional audit before mainnet deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions and support, please open an issue in the GitHub repository.

## 🗺 Roadmap

- [ ] Mainnet deployment
- [ ] Additional ecommerce platform integrations (WooCommerce, BigCommerce)
- [ ] Advanced credit scoring with Chainlink Functions
- [ ] Governance token for protocol decisions
- [ ] Mobile application
- [ ] Multi-chain support