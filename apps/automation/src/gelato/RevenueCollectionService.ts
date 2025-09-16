import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { Web3Function } from '@gelatonetwork/web3-functions-sdk';
import { ethers } from 'ethers';
import { CronJob } from 'cron';

export class RevenueCollectionService {
  private relay: GelatoRelay;
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private cronJob: CronJob | null = null;

  constructor() {
    // Initialize Gelato Relay
    this.relay = new GelatoRelay();
    
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    
    console.log('🔧 RevenueCollectionService initialized');
  }

  async start(): Promise<void> {
    console.log('▶️ Starting revenue collection automation...');
    
    // Create Web3 Function for revenue collection
    await this.createRevenueCollectionFunction();
    
    // Set up cron job to check for overdue payments every hour
    this.cronJob = new CronJob('0 * * * *', async () => {
      await this.checkOverduePayments();
    });
    
    this.cronJob.start();
    console.log('✅ Revenue collection service started');
  }

  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    console.log('⏹️ Revenue collection service stopped');
  }

  private async createRevenueCollectionFunction(): Promise<void> {
    // This will be deployed as a Web3 Function on Gelato
    const web3FunctionCode = `
      import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
      import { Contract } from "ethers";
      
      Web3Function.onRun(async (context: Web3FunctionContext) => {
        const { userArgs, multiChainProvider } = context;
        
        const provider = multiChainProvider.default();
        const campaignFactory = new Contract(
          userArgs.campaignFactory,
          userArgs.campaignFactoryAbi,
          provider
        );
        
        // Get all active campaigns in repayment phase
        const campaigns = await campaignFactory.getRepaymentCampaigns();
        const overduePayments = [];
        
        for (const campaignAddress of campaigns) {
          const campaign = new Contract(campaignAddress, userArgs.campaignAbi, provider);
          const nextPaymentDue = await campaign.getNextPaymentDue();
          
          // Check if payment is overdue (grace period of 7 days)
          const gracePeriod = 7 * 24 * 60 * 60; // 7 days in seconds
          const now = Math.floor(Date.now() / 1000);
          
          if (nextPaymentDue > 0 && now > nextPaymentDue + gracePeriod) {
            overduePayments.push({
              campaign: campaignAddress,
              daysOverdue: Math.floor((now - nextPaymentDue) / (24 * 60 * 60))
            });
          }
        }
        
        // Return execution data for overdue payments
        if (overduePayments.length > 0) {
          return {
            canExec: true,
            callData: overduePayments.map(payment => ({
              to: payment.campaign,
              data: "0x" // This would encode the collection function call
            }))
          };
        }
        
        return { canExec: false, message: "No overdue payments found" };
      });
    `;
    
    console.log('📝 Web3 Function for revenue collection created');
  }

  private async checkOverduePayments(): Promise<void> {
    try {
      console.log('🔍 Checking for overdue payments...');
      
      // This would typically trigger the Web3 Function
      // For now, we'll implement basic logic here
      const campaignFactoryAddress = process.env.CAMPAIGN_FACTORY_ADDRESS!;
      const campaignFactory = new ethers.Contract(
        campaignFactoryAddress,
        [], // Add ABI
        this.provider
      );
      
      // Implementation would go here to check campaigns
      console.log('✅ Overdue payment check completed');
      
    } catch (error) {
      console.error('❌ Error checking overdue payments:', error);
    }
  }

  async triggerRevenueCollection(campaignAddress: string, revenueAmount: string): Promise<string> {
    try {
      console.log(`💰 Triggering revenue collection for ${campaignAddress}`);
      
      // Use Gelato Relay to execute transaction
      const request = {
        chainId: 84532, // Base Sepolia
        target: campaignAddress,
        data: '0x', // Encoded function call
        user: this.wallet.address,
      };
      
      const response = await this.relay.sponsoredCall(request, process.env.GELATO_API_KEY!);
      
      console.log(`✅ Revenue collection triggered. Task ID: ${response.taskId}`);
      return response.taskId;
      
    } catch (error) {
      console.error('❌ Error triggering revenue collection:', error);
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<any> {
    try {
      const status = await this.relay.getTaskStatus(taskId);
      return status;
    } catch (error) {
      console.error('❌ Error getting task status:', error);
      throw error;
    }
  }
}