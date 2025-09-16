# Gelato Network Automation Guide
## Complete Reference for RBF Revenue Collection

---

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Gelato Network Overview](#gelato-network-overview)
3. [Technical Architecture](#technical-architecture)
4. [RBF Implementation](#rbf-implementation)
5. [Web3 Functions](#web3-functions)
6. [Smart Contract Integration](#smart-contract-integration)
7. [Testing & Debugging](#testing--debugging)
8. [Production Deployment](#production-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)
11. [API Reference](#api-reference)
12. [Best Practices](#best-practices)

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Wallet with testnet funds (Base Sepolia)
- Gelato account and API key

### 5-Minute Setup
```bash
# 1. Clone and setup
cd apps/automation
npm install

# 2. Configure environment
cp .env.example .env
# Fill in:
# - GELATO_API_KEY=your_api_key
# - PRIVATE_KEY=your_wallet_key
# - BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# 3. Deploy contracts
forge build
npm run deploy

# 4. Start automation service
npm run dev
```

### First Automation Test
```typescript
// Create a simple automation job
const revenueCollectionService = new RevenueCollectionService();
await revenueCollectionService.triggerRevenueCollection(
  campaignAddress,
  "1000000000" // 1000 USDC (6 decimals)
);
```

---

## Gelato Network Overview

### What is Gelato?
Gelato Network is a decentralized automation protocol that enables developers to:
- **Automate smart contract executions** without running servers
- **Execute transactions** based on time, events, or custom logic
- **Scale applications** with reliable off-chain computation
- **Reduce gas costs** through batching and optimization

### Key Features
| Feature | Description | Benefit |
|---------|-------------|---------|
| **Web3 Functions** | Serverless automation scripts | No infrastructure needed |
| **Relay Network** | Gasless transaction execution | Improved UX |
| **Multi-chain** | 100+ supported networks | Universal deployment |
| **Decentralized** | No single point of failure | High reliability |

### Execution Speed & Costs
- ⚡ **Execution Time**: 12-15 seconds average
- 💰 **Cost**: $0.10-0.50 per execution
- 🔄 **Frequency**: Every block to monthly intervals
- 📊 **Success Rate**: 99.5% uptime

---

## Technical Architecture

### Gelato Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web3 Function │    │  Relay Network  │    │ Smart Contract  │
│                 │────▶│                 │────▶│                 │
│ - Custom Logic  │    │ - Gas Execution │    │ - Target Method │
│ - Conditions    │    │ - Transaction   │    │ - State Changes │
│ - Off-chain API │    │   Broadcasting  │    │ - Event Emission│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### RBF Integration Architecture

```
┌─────────────────┐
│ Revenue Oracle  │ ──┐
│ - Stripe API    │   │
│ - Manual Input  │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │    ┌─────────────────┐
│ Web3 Function   │◄──┴────│ Gelato Network  │
│ - Check Overdue │        │ - Scheduling    │
│ - Calculate     │        │ - Execution     │
│   Penalties     │        │ - Gas Management│
└─────────────────┘        └─────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐        ┌─────────────────┐
│AutomationRegistry│        │  RBF Campaign   │
│ - Job Creation  │────────▶│ - Revenue Share │
│ - Execution     │        │ - Penalty Apply │
│ - Tracking      │        │ - State Update  │
└─────────────────┘        └─────────────────┘
```

---

## RBF Implementation

### Core Use Case: Automated Revenue Collection

Our RBF platform automates monthly revenue collection from businesses that received funding. Here's how it works:

#### 1. Revenue Detection
```typescript
// Revenue Oracle monitors multiple sources
class RevenueOracle {
  async fetchStripeRevenue(businessAddress: string) {
    // Connect to business Stripe account
    const revenue = await stripe.charges.list({
      created: { gte: lastMonth, lt: thisMonth }
    });
    return this.calculateMonthlyTotal(revenue);
  }
}
```

#### 2. Overdue Payment Detection
```typescript
// Web3 Function checks payment status
Web3Function.onRun(async (context) => {
  const campaigns = await campaignFactory.getRepaymentCampaigns();
  
  for (const campaign of campaigns) {
    const nextPaymentDue = await campaign.getNextPaymentDue();
    const gracePeriod = 7 * 24 * 60 * 60; // 7 days
    
    if (now > nextPaymentDue + gracePeriod) {
      // Trigger automated collection
      return { canExec: true, callData: [...] };
    }
  }
});
```

#### 3. Penalty Calculation
```solidity
// Smart contract applies late fees
function calculatePenalty(uint256 daysOverdue, uint256 amount) 
  public pure returns (uint256) {
    uint256 penaltyRate = daysOverdue * 100; // 1% per day
    if (penaltyRate > 500) penaltyRate = 500; // Max 5%
    return (amount * penaltyRate) / 10000;
}
```

#### 4. Automated Execution
```typescript
// Gelato executes the collection
const job = await automationRegistry.createRevenueCollectionJob(
  campaignAddress,
  revenueAmount
);
await automationRegistry.executeRevenueCollection(jobId);
```

---

## Web3 Functions

### Function Structure
```typescript
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider, secrets } = context;
  
  // 1. Setup
  const provider = multiChainProvider.default();
  
  // 2. Check conditions
  const shouldExecute = await checkConditions();
  
  // 3. Return execution data
  if (shouldExecute) {
    return {
      canExec: true,
      callData: [{
        to: targetContract,
        data: encodedFunctionCall
      }]
    };
  }
  
  return { canExec: false, message: "Conditions not met" };
});
```

### RBF Revenue Collector Function
```typescript
// Complete implementation
Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs } = context;
  const provider = multiChainProvider.default();
  
  // Get campaigns in repayment phase
  const campaignFactory = new Contract(
    userArgs.campaignFactory,
    campaignFactoryAbi,
    provider
  );
  
  const campaigns = await campaignFactory.getRepaymentCampaigns();
  const overduePayments = [];
  
  // Check each campaign for overdue payments
  for (const campaignAddress of campaigns) {
    const campaign = new Contract(campaignAddress, campaignAbi, provider);
    const nextPaymentDue = await campaign.getNextPaymentDue();
    
    // Grace period check
    const gracePeriod = 7 * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);
    
    if (nextPaymentDue > 0 && now > nextPaymentDue + gracePeriod) {
      // Fetch revenue data from oracle
      const revenueData = await fetchRevenueData(
        userArgs.revenueOracleUrl,
        await campaign.owner()
      );
      
      if (revenueData?.monthlyRevenue > 0) {
        overduePayments.push({
          campaign: campaignAddress,
          owner: await campaign.owner(),
          daysOverdue: Math.floor((now - nextPaymentDue - gracePeriod) / 86400),
          revenueAmount: revenueData.monthlyRevenue
        });
      }
    }
  }
  
  // Process highest priority payment
  if (overduePayments.length > 0) {
    const urgent = overduePayments.sort((a, b) => b.daysOverdue - a.daysOverdue)[0];
    
    return {
      canExec: true,
      callData: [{
        to: userArgs.automationRegistry,
        data: automationRegistry.interface.encodeFunctionData(
          "createRevenueCollectionJob",
          [urgent.campaign, urgent.revenueAmount]
        )
      }]
    };
  }
  
  return { canExec: false, message: "No overdue payments" };
});
```

### Deployment & Configuration
```bash
# 1. Deploy Web3 Function
gelato deploy-function ./web3-functions/revenueCollector.ts

# 2. Create automation task
gelato create-task \
  --function-id <function-id> \
  --interval 3600 \
  --args '{"campaignFactory":"0x...","automationRegistry":"0x..."}'

# 3. Monitor execution
gelato task-status <task-id>
```

---

## Smart Contract Integration

### AutomationRegistry Contract
```solidity
contract AutomationRegistry is Ownable, ReentrancyGuard {
    struct AutomationJob {
        address campaign;
        uint256 revenueAmount;
        uint256 executionTime;
        bool executed;
        address executor;
    }
    
    mapping(bytes32 => AutomationJob) public jobs;
    mapping(address => bool) public authorizedExecutors;
    
    // Gelato executors are authorized
    function authorizeExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = true;
    }
    
    // Create automation job
    function createRevenueCollectionJob(
        address campaign,
        uint256 revenueAmount
    ) external onlyAuthorizedExecutor returns (bytes32) {
        bytes32 jobId = keccak256(abi.encodePacked(
            campaign, revenueAmount, block.timestamp, msg.sender
        ));
        
        jobs[jobId] = AutomationJob({
            campaign: campaign,
            revenueAmount: revenueAmount,
            executionTime: block.timestamp,
            executed: false,
            executor: msg.sender
        });
        
        return jobId;
    }
    
    // Execute automation job
    function executeRevenueCollection(bytes32 jobId) 
        external onlyAuthorizedExecutor nonReentrant {
        AutomationJob storage job = jobs[jobId];
        require(!job.executed, "Job already executed");
        
        IRBFCampaign campaign = IRBFCampaign(job.campaign);
        uint256 revenueAmount = job.revenueAmount;
        
        // Apply penalties for late payment
        uint256 penalty = calculatePenalty(job.campaign, revenueAmount);
        campaign.submitRevenueShare(revenueAmount + penalty);
        
        job.executed = true;
    }
}
```

### Campaign Integration
```solidity
// RBF Campaign must implement automation interfaces
interface IRBFCampaign {
    function submitRevenueShare(uint256 revenueAmount) external;
    function getNextPaymentDue() external view returns (uint256);
    function owner() external view returns (address);
    function repaymentActive() external view returns (bool);
}
```

---

## Testing & Debugging

### Local Testing Setup
```bash
# 1. Start local blockchain
anvil --fork-url https://sepolia.base.org

# 2. Deploy contracts locally
npm run deploy:local

# 3. Test Web3 Function
npx hardhat gelato-deploy --network localhost
```

### Unit Tests with Foundry
```solidity
contract AutomationRegistryTest is Test {
    function testOverduePaymentPenalty() public {
        // Setup overdue campaign
        vm.warp(1000000);
        mockCampaign.setNextPaymentDue(block.timestamp - 8 days);
        
        // Execute automation
        bytes32 jobId = automationRegistry.createRevenueCollectionJob(
            address(mockCampaign), 1000e6
        );
        automationRegistry.executeRevenueCollection(jobId);
        
        // Verify penalty applied (1% for 1 day overdue)
        uint256 expectedPenalty = (1000e6 * 100) / 10000;
        assertEq(mockCampaign.lastRevenueShare(), 1000e6 + expectedPenalty);
    }
}
```

### Debugging Web3 Functions
```typescript
// Add comprehensive logging
Web3Function.onRun(async (context) => {
  console.log("🔍 Starting revenue collection check...");
  console.log("📊 Campaigns found:", campaigns.length);
  
  for (const campaign of campaigns) {
    console.log(`📋 Checking campaign: ${campaign}`);
    const nextDue = await campaign.getNextPaymentDue();
    console.log(`⏰ Next payment due: ${new Date(nextDue * 1000)}`);
  }
  
  console.log("✅ Check completed");
  return result;
});
```

### Common Issues & Solutions

**Issue**: Function fails with "Insufficient funds"
```bash
# Solution: Fund your Gelato account
gelato deposit --amount 0.1 --token ETH
```

**Issue**: Web3 Function timeout
```typescript
// Solution: Optimize function execution
const batchSize = 10; // Process campaigns in batches
for (let i = 0; i < campaigns.length; i += batchSize) {
  const batch = campaigns.slice(i, i + batchSize);
  await processBatch(batch);
}
```

**Issue**: Transaction reverts
```typescript
// Solution: Add proper error handling
try {
  await campaign.submitRevenueShare(amount);
} catch (error) {
  console.error(`Failed to submit revenue share: ${error.message}`);
  // Continue to next campaign
}
```

---

## Production Deployment

### Environment Setup
```bash
# Production environment variables
BASE_MAINNET_RPC_URL=https://mainnet.base.org
GELATO_API_KEY=your_production_api_key
PRIVATE_KEY=your_production_wallet_key

# Contract addresses (deploy to mainnet)
CAMPAIGN_FACTORY_ADDRESS=0x... # Deployed factory
AUTOMATION_REGISTRY_ADDRESS=0x... # Deployed automation
```

### Deployment Checklist

#### Smart Contracts
- [ ] Deploy AutomationRegistry to Base mainnet
- [ ] Verify contracts on Basescan
- [ ] Set up multisig ownership
- [ ] Authorize Gelato executors
- [ ] Test with small amounts first

#### Web3 Functions
- [ ] Deploy function to Gelato mainnet
- [ ] Configure production secrets
- [ ] Set appropriate execution intervals
- [ ] Monitor gas usage and optimize
- [ ] Set up monitoring alerts

#### Infrastructure
- [ ] Configure production RPC endpoints
- [ ] Set up monitoring dashboards
- [ ] Configure error alerting
- [ ] Backup private keys securely
- [ ] Document emergency procedures

### Security Considerations

#### Smart Contract Security
```solidity
// Use battle-tested patterns
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Implement circuit breakers
modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

// Add emergency pause
function emergencyPause() external onlyOwner {
    paused = true;
}
```

#### Key Management
```bash
# Use hardware wallets for production
# Store private keys in secure vaults
# Implement multisig for critical operations
# Regular key rotation schedule
```

### Monitoring Setup
```typescript
// Production monitoring
class ProductionMonitor {
  async checkSystemHealth() {
    const metrics = {
      gelatoBalance: await this.getGelatoBalance(),
      failedTasks: await this.getFailedTasks(),
      overduePayments: await this.getOverdueCount(),
      systemUptime: await this.getUptimeStatus()
    };
    
    // Send alerts if critical thresholds exceeded
    if (metrics.gelatoBalance < 0.01) {
      await this.sendAlert("Low Gelato balance");
    }
    
    if (metrics.failedTasks > 5) {
      await this.sendAlert("High task failure rate");
    }
  }
}
```

---

## Monitoring & Maintenance

### Dashboard Metrics
```typescript
interface SystemMetrics {
  // Execution metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  
  // Financial metrics
  totalRevenueCollected: bigint;
  penaltiesApplied: bigint;
  gasCostsIncurred: bigint;
  
  // System health
  gelatoBalance: number;
  overduePayments: number;
  systemUptime: number;
}
```

### Health Checks
```typescript
// Automated health monitoring
export class HealthMonitor {
  async performHealthCheck(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.checkContractStatus(),
      this.checkGelatoBalance(),
      this.checkRPCConnectivity(),
      this.checkRevenueOracleStatus()
    ]);
    
    return {
      status: checks.every(c => c.healthy) ? 'healthy' : 'unhealthy',
      checks,
      timestamp: Date.now()
    };
  }
  
  async checkContractStatus() {
    try {
      const owner = await automationRegistry.owner();
      return { name: 'Contract', healthy: owner !== '0x0', details: 'Contract accessible' };
    } catch (error) {
      return { name: 'Contract', healthy: false, details: error.message };
    }
  }
}
```

### Alert Configuration
```typescript
// Alert thresholds
const ALERT_THRESHOLDS = {
  LOW_GELATO_BALANCE: 0.01, // ETH
  HIGH_FAILURE_RATE: 0.05,  // 5%
  OVERDUE_PAYMENTS: 10,     // Count
  RPC_RESPONSE_TIME: 5000   // ms
};

// Alert channels
const alertChannels = {
  slack: process.env.SLACK_WEBHOOK_URL,
  email: process.env.ALERT_EMAIL,
  pagerduty: process.env.PAGERDUTY_KEY
};
```

### Performance Optimization
```typescript
// Batch processing for efficiency
async function processCampaignsBatch(campaigns: string[]) {
  const BATCH_SIZE = 20;
  const results = [];
  
  for (let i = 0; i < campaigns.length; i += BATCH_SIZE) {
    const batch = campaigns.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(campaign => processCampaign(campaign))
    );
    results.push(...batchResults);
    
    // Prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
```

---

## Troubleshooting

### Common Error Messages

#### "Execution reverted: Not authorized executor"
**Cause**: Gelato executor not authorized in AutomationRegistry
**Solution**:
```solidity
// Add Gelato executor address
automationRegistry.authorizeExecutor(GELATO_EXECUTOR_ADDRESS);
```

#### "Execution reverted: Job already executed"
**Cause**: Duplicate job execution attempt
**Solution**:
```typescript
// Check job status before execution
const (_, _, _, executed, _) = await automationRegistry.getJobDetails(jobId);
if (!executed) {
  await automationRegistry.executeRevenueCollection(jobId);
}
```

#### "Web3Function timeout"
**Cause**: Function execution exceeds time limit
**Solution**:
```typescript
// Optimize function with early returns
if (campaigns.length > 100) {
  // Process only first 50 campaigns
  campaigns = campaigns.slice(0, 50);
}
```

#### "Insufficient Gelato balance"
**Cause**: Account needs funding for gas fees
**Solution**:
```bash
# Fund Gelato account
gelato deposit --amount 0.1 --token ETH --network base
```

### Debugging Steps

#### 1. Check Function Logs
```bash
# View recent function executions
gelato logs --function-id <function-id> --limit 50

# Filter for errors
gelato logs --function-id <function-id> --level error
```

#### 2. Verify Contract State
```typescript
// Check contract configuration
const isAuthorized = await automationRegistry.authorizedExecutors(GELATO_EXECUTOR);
const campaignCount = await campaignFactory.getCampaignCount();
const overdueCount = (await automationRegistry.getOverdueCampaigns()).length;

console.log({
  isAuthorized,
  campaignCount,
  overdueCount
});
```

#### 3. Test Revenue Oracle
```typescript
// Verify revenue data availability
const revenueData = await revenueOracle.getRevenueData(businessAddress);
console.log("Revenue data:", revenueData);

// Check API connectivity
const stripeHealth = await fetch(process.env.STRIPE_API_URL);
console.log("Stripe API status:", stripeHealth.status);
```

#### 4. Network Connectivity
```bash
# Test RPC connectivity
curl -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test Gelato API
curl -X GET https://api.gelato.digital/tasks/<task-id> \
  -H "Authorization: Bearer <api-key>"
```

### Emergency Procedures

#### System Pause
```solidity
// Emergency pause automation
function emergencyPause() external onlyOwner {
  paused = true;
  emit EmergencyPause(block.timestamp);
}
```

#### Manual Revenue Collection
```typescript
// Bypass automation for critical payments
async function manualRevenueCollection(campaignAddress: string, amount: bigint) {
  const campaign = new Contract(campaignAddress, campaignAbi, wallet);
  await campaign.submitRevenueShare(amount);
  console.log(`Manual collection completed: ${amount}`);
}
```

#### Task Recovery
```bash
# Cancel stuck tasks
gelato cancel-task <task-id>

# Recreate task with updated parameters
gelato create-task --function-id <function-id> --interval 7200
```

---

## API Reference

### Gelato SDK Methods

#### Task Management
```typescript
import { GelatoOpsSDK } from "@gelatonetwork/ops-sdk";

const ops = new GelatoOpsSDK(chainId, signer);

// Create automation task
const { taskId } = await ops.createTask({
  execAddress: automationRegistryAddress,
  execSelector: "0x...", // executeRevenueCollection selector
  resolverAddress: web3FunctionAddress,
  resolverData: "0x",
  interval: 3600 // 1 hour
});

// Check task status
const taskStatus = await ops.getTaskStatus(taskId);

// Cancel task
await ops.cancelTask(taskId);
```

#### Gelato Relay
```typescript
import { GelatoRelay } from "@gelatonetwork/relay-sdk";

const relay = new GelatoRelay();

// Sponsor transaction
const request = {
  chainId: 84532,
  target: campaignAddress,
  data: encodedFunctionCall,
  user: walletAddress,
};

const response = await relay.sponsoredCall(request, gelatoApiKey);
console.log("Task ID:", response.taskId);
```

### AutomationRegistry Interface
```solidity
interface IAutomationRegistry {
    function createRevenueCollectionJob(address campaign, uint256 amount) 
        external returns (bytes32 jobId);
    
    function executeRevenueCollection(bytes32 jobId) external;
    
    function getJobDetails(bytes32 jobId) external view returns (
        address campaign,
        uint256 revenueAmount,
        uint256 executionTime,
        bool executed,
        address executor
    );
    
    function getOverdueCampaigns() external view returns (address[] memory);
    
    function calculatePenalty(address campaign, uint256 amount) 
        external view returns (uint256);
}
```

### Revenue Oracle Interface
```typescript
interface IRevenueOracle {
  getRevenueData(businessAddress: string): Promise<{
    monthlyRevenue: bigint;
    lastUpdated: number;
    source: 'stripe' | 'manual';
    verified: boolean;
  }>;
  
  updateRevenueManually(
    businessAddress: string,
    revenue: bigint
  ): Promise<void>;
  
  isRevenueDataStale(
    businessAddress: string,
    maxAgeHours: number
  ): boolean;
}
```

---

## Best Practices

### Security Best Practices

#### Smart Contract Security
```solidity
// ✅ Use established patterns
contract SecureAutomation is ReentrancyGuard, Ownable, Pausable {
    // ✅ Add circuit breakers
    modifier whenNotPaused() {
        require(!paused(), "Paused");
        _;
    }
    
    // ✅ Validate inputs
    modifier validCampaign(address campaign) {
        require(campaignFactory.isValidCampaign(campaign), "Invalid campaign");
        _;
    }
    
    // ✅ Limit batch sizes
    modifier reasonableBatchSize(uint256 size) {
        require(size <= 50, "Batch too large");
        _;
    }
}
```

#### Web3 Function Security
```typescript
// ✅ Validate external data
function validateRevenueData(data: any): boolean {
  return (
    data &&
    typeof data.monthlyRevenue === 'string' &&
    !isNaN(Number(data.monthlyRevenue)) &&
    data.lastUpdated > 0 &&
    ['stripe', 'manual'].includes(data.source)
  );
}

// ✅ Handle errors gracefully
try {
  const revenueData = await fetchExternalAPI(url);
  if (!validateRevenueData(revenueData)) {
    throw new Error('Invalid revenue data format');
  }
} catch (error) {
  console.error('Revenue fetch failed:', error.message);
  return { canExec: false, message: 'Revenue data unavailable' };
}
```

### Performance Best Practices

#### Gas Optimization
```solidity
// ✅ Use packed structs
struct PackedJob {
    address campaign;     // 20 bytes
    uint96 revenueAmount; // 12 bytes (total: 32 bytes)
    uint64 executionTime; // 8 bytes
    bool executed;        // 1 byte
    // Total: 41 bytes (2 storage slots)
}

// ✅ Batch operations
function executeBatch(bytes32[] calldata jobIds) external {
    for (uint256 i = 0; i < jobIds.length; i++) {
        _executeJob(jobIds[i]);
    }
}
```

#### Function Optimization
```typescript
// ✅ Early returns
Web3Function.onRun(async (context) => {
  // Quick checks first
  const campaigns = await getCampaigns();
  if (campaigns.length === 0) {
    return { canExec: false, message: 'No campaigns' };
  }
  
  // Expensive operations only if needed
  const overduePayments = await findOverduePayments(campaigns);
  // ... rest of logic
});

// ✅ Parallel processing
const campaignChecks = await Promise.all(
  campaigns.map(async (campaign) => {
    return {
      address: campaign,
      isOverdue: await checkIfOverdue(campaign),
      revenueAmount: await getRevenueAmount(campaign)
    };
  })
);
```

### Monitoring Best Practices

#### Comprehensive Logging
```typescript
// ✅ Structured logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      data
    }));
  },
  
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message,
      stack: error?.stack
    }));
  }
};

// Usage in Web3 Function
logger.info('Starting revenue collection check', {
  campaignCount: campaigns.length,
  executionId: context.executionId
});
```

#### Metrics Collection
```typescript
// ✅ Track key metrics
class MetricsCollector {
  private metrics = new Map<string, number>();
  
  increment(metric: string, value = 1) {
    this.metrics.set(metric, (this.metrics.get(metric) || 0) + value);
  }
  
  time<T>(metric: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    return fn().finally(() => {
      const duration = Date.now() - start;
      this.metrics.set(`${metric}_duration_ms`, duration);
    });
  }
  
  getSnapshot() {
    return Object.fromEntries(this.metrics);
  }
}

// Usage
const metrics = new MetricsCollector();
await metrics.time('revenue_collection_check', async () => {
  for (const campaign of campaigns) {
    const isOverdue = await checkOverdue(campaign);
    if (isOverdue) {
      metrics.increment('overdue_campaigns');
    }
  }
});
```

### Operational Best Practices

#### Gradual Deployment
```bash
# ✅ Staged rollout process
# 1. Deploy to testnet
npm run deploy --network base-sepolia

# 2. Test with small subset
gelato create-task --interval 86400 --test-mode

# 3. Monitor for 24 hours
gelato logs --function-id <id> --since "24 hours ago"

# 4. Gradually increase scope
# 5. Deploy to mainnet with same process
```

#### Backup & Recovery
```typescript
// ✅ State backup procedures
class StateBackup {
  async backupJobState() {
    const jobs = await this.getAllActiveJobs();
    const backup = {
      timestamp: Date.now(),
      jobs: jobs.map(job => ({
        id: job.id,
        campaign: job.campaign,
        amount: job.amount.toString(),
        status: job.status
      }))
    };
    
    await this.saveToIPFS(backup);
    await this.saveToS3(backup);
  }
  
  async restoreJobState(backupId: string) {
    const backup = await this.loadBackup(backupId);
    for (const job of backup.jobs) {
      if (!job.executed) {
        await this.recreateJob(job);
      }
    }
  }
}
```

---

## Conclusion

This guide provides comprehensive coverage of implementing Gelato Network automation for your RBF revenue collection system. Key takeaways:

### ✅ What You've Learned
- **Gelato Architecture**: Understanding Web3 Functions and relay networks
- **Smart Contract Integration**: AutomationRegistry pattern for job management
- **Production Deployment**: Security, monitoring, and maintenance procedures
- **Best Practices**: Performance optimization and error handling

### 🚀 Next Steps
1. **Deploy to testnet** and validate with small amounts
2. **Monitor execution** patterns and optimize gas usage
3. **Scale gradually** to full production deployment
4. **Implement monitoring** dashboards and alerting
5. **Plan upgrades** for enhanced features

### 📞 Support Resources
- **Gelato Documentation**: https://docs.gelato.network/
- **Discord Community**: https://discord.gg/gelato
- **GitHub Issues**: Your project's issue tracker
- **Emergency Contacts**: Maintain 24/7 on-call rotation

---

*This guide is specific to RBF automation implementation. Keep it updated as Gelato Network evolves and your requirements change.*

**Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: March 2025