import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider, secrets } = context;

  const provider = multiChainProvider.default();

  // User arguments
  const campaignFactoryAddress = userArgs.campaignFactory as string;
  const automationRegistryAddress = userArgs.automationRegistry as string;
  const revenueOracleUrl = userArgs.revenueOracleUrl as string;

  // Contract ABIs (simplified for demo)
  const campaignFactoryAbi = [
    "function getRepaymentCampaigns() external view returns (address[] memory)",
    "function isValidCampaign(address campaign) external view returns (bool)"
  ];

  const campaignAbi = [
    "function getNextPaymentDue() external view returns (uint256)",
    "function owner() external view returns (address)",
    "function repaymentActive() external view returns (bool)",
    "function submitRevenueShare(uint256 revenueAmount) external"
  ];

  const automationRegistryAbi = [
    "function createRevenueCollectionJob(address campaign, uint256 revenueAmount) external returns (bytes32)",
    "function executeRevenueCollection(bytes32 jobId) external"
  ];

  try {
    // Initialize contracts
    const campaignFactory = new Contract(
      campaignFactoryAddress,
      campaignFactoryAbi,
      provider
    );

    const automationRegistry = new Contract(
      automationRegistryAddress,
      automationRegistryAbi,
      provider
    );

    // Get all campaigns in repayment phase
    const repaymentCampaigns = await campaignFactory.getRepaymentCampaigns();
    console.log(`Found ${repaymentCampaigns.length} campaigns in repayment phase`);

    const overduePayments = [];
    const gracePeriod = 7 * 24 * 60 * 60; // 7 days in seconds
    const now = Math.floor(Date.now() / 1000);

    // Check each campaign for overdue payments
    for (const campaignAddress of repaymentCampaigns) {
      try {
        const campaign = new Contract(campaignAddress, campaignAbi, provider);
        
        const [nextPaymentDue, owner, repaymentActive] = await Promise.all([
          campaign.getNextPaymentDue(),
          campaign.owner(),
          campaign.repaymentActive()
        ]);

        // Skip if not in repayment or no payment due
        if (!repaymentActive || nextPaymentDue === 0n) {
          continue;
        }

        // Check if payment is overdue (past grace period)
        const paymentDueTimestamp = Number(nextPaymentDue);
        if (now > paymentDueTimestamp + gracePeriod) {
          const daysOverdue = Math.floor((now - paymentDueTimestamp - gracePeriod) / (24 * 60 * 60));
          
          // Fetch revenue data from oracle
          const revenueData = await fetchRevenueData(revenueOracleUrl, owner);
          
          if (revenueData && revenueData.monthlyRevenue > 0) {
            overduePayments.push({
              campaign: campaignAddress,
              owner,
              daysOverdue,
              revenueAmount: revenueData.monthlyRevenue,
              priority: calculatePriority(daysOverdue, revenueData.monthlyRevenue)
            });
          }
        }
      } catch (error) {
        console.error(`Error checking campaign ${campaignAddress}:`, error);
      }
    }

    console.log(`Found ${overduePayments.length} overdue payments`);

    // Sort by priority (most urgent first)
    overduePayments.sort((a, b) => b.priority - a.priority);

    // Process the highest priority overdue payment
    if (overduePayments.length > 0) {
      const urgentPayment = overduePayments[0];
      
      console.log(`Processing overdue payment for campaign: ${urgentPayment.campaign}`);
      console.log(`Days overdue: ${urgentPayment.daysOverdue}`);
      console.log(`Revenue amount: ${urgentPayment.revenueAmount}`);

      // Create automation job
      const createJobCalldata = automationRegistry.interface.encodeFunctionData(
        "createRevenueCollectionJob",
        [urgentPayment.campaign, urgentPayment.revenueAmount]
      );

      return {
        canExec: true,
        callData: [
          {
            to: automationRegistryAddress,
            data: createJobCalldata,
          },
        ],
      };
    }

    return {
      canExec: false,
      message: "No overdue payments requiring automation",
    };

  } catch (error) {
    console.error("Error in revenue collector:", error);
    return {
      canExec: false,
      message: `Error: ${error.message}`,
    };
  }
});

// Helper function to fetch revenue data from oracle
async function fetchRevenueData(oracleUrl: string, businessAddress: string) {
  try {
    const response = await fetch(`${oracleUrl}/revenue/${businessAddress}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return {
      monthlyRevenue: data.monthlyRevenue,
      lastUpdated: data.lastUpdated,
      verified: data.verified
    };
  } catch (error) {
    console.error(`Failed to fetch revenue data for ${businessAddress}:`, error);
    return null;
  }
}

// Helper function to calculate payment priority
function calculatePriority(daysOverdue: number, revenueAmount: bigint): number {
  // Priority = days overdue * revenue amount (higher = more urgent)
  // Normalize revenue amount to avoid overflow
  const revenueScore = Number(revenueAmount) / 1e6; // Convert from wei to readable units
  return daysOverdue * revenueScore;
}