import Stripe from 'stripe';
import axios from 'axios';
import { ethers } from 'ethers';
import { CronJob } from 'cron';

interface BusinessRevenueData {
  businessAddress: string;
  monthlyRevenue: bigint;
  lastUpdated: number;
  source: 'stripe' | 'manual' | 'bank';
  verified: boolean;
}

export class RevenueOracle {
  private stripe: Stripe;
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private cronJob: CronJob | null = null;
  private revenueData: Map<string, BusinessRevenueData> = new Map();

  constructor() {
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    
    // Initialize blockchain connection
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    
    console.log('🔧 RevenueOracle initialized');
  }

  async start(): Promise<void> {
    console.log('▶️ Starting revenue oracle...');
    
    // Set up cron job to fetch revenue data daily at midnight
    this.cronJob = new CronJob('0 0 * * *', async () => {
      await this.fetchAllRevenueData();
    });
    
    this.cronJob.start();
    
    // Initial fetch
    await this.fetchAllRevenueData();
    
    console.log('✅ Revenue oracle started');
  }

  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    console.log('⏹️ Revenue oracle stopped');
  }

  private async fetchAllRevenueData(): Promise<void> {
    try {
      console.log('📊 Fetching revenue data for all businesses...');
      
      // Get all registered businesses from the blockchain
      const businessAddresses = await this.getRegisteredBusinesses();
      
      for (const businessAddress of businessAddresses) {
        await this.fetchBusinessRevenue(businessAddress);
      }
      
      console.log(`✅ Revenue data fetched for ${businessAddresses.length} businesses`);
      
    } catch (error) {
      console.error('❌ Error fetching revenue data:', error);
    }
  }

  private async getRegisteredBusinesses(): Promise<string[]> {
    // Get businesses from BusinessRegistry contract
    const businessRegistryAddress = process.env.BUSINESS_REGISTRY_ADDRESS!;
    const businessRegistry = new ethers.Contract(
      businessRegistryAddress,
      [], // Add BusinessRegistry ABI
      this.provider
    );
    
    // This would return all registered business addresses
    // For now, return mock data
    return [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
    ];
  }

  private async fetchBusinessRevenue(businessAddress: string): Promise<void> {
    try {
      console.log(`📈 Fetching revenue for business: ${businessAddress}`);
      
      // Try multiple revenue sources
      const stripeRevenue = await this.fetchStripeRevenue(businessAddress);
      const manualRevenue = await this.fetchManualRevenue(businessAddress);
      
      // Use the most recent and verified source
      let finalRevenue = stripeRevenue || manualRevenue;
      
      if (finalRevenue) {
        this.revenueData.set(businessAddress, {
          businessAddress,
          monthlyRevenue: finalRevenue.amount,
          lastUpdated: Date.now(),
          source: finalRevenue.source,
          verified: finalRevenue.verified,
        });
        
        console.log(`✅ Revenue updated for ${businessAddress}: $${ethers.formatUnits(finalRevenue.amount, 6)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error fetching revenue for ${businessAddress}:`, error);
    }
  }

  private async fetchStripeRevenue(businessAddress: string): Promise<{
    amount: bigint;
    source: 'stripe';
    verified: boolean;
  } | null> {
    try {
      // Get business Stripe account ID from mapping
      const stripeAccountId = await this.getStripeAccountId(businessAddress);
      if (!stripeAccountId) return null;
      
      // Calculate date range for last month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Fetch revenue from Stripe
      const charges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(lastMonth.getTime() / 1000),
          lt: Math.floor(thisMonth.getTime() / 1000),
        },
        limit: 100,
      }, {
        stripeAccount: stripeAccountId,
      });
      
      // Calculate total revenue in cents, then convert to USDC (6 decimals)
      const totalCents = charges.data.reduce((sum, charge) => {
        return sum + (charge.paid ? charge.amount : 0);
      }, 0);
      
      // Convert cents to USDC (6 decimals)
      const totalUsdc = BigInt(Math.floor(totalCents / 100)) * BigInt(10 ** 6);
      
      return {
        amount: totalUsdc,
        source: 'stripe',
        verified: true,
      };
      
    } catch (error) {
      console.error('❌ Error fetching Stripe revenue:', error);
      return null;
    }
  }

  private async fetchManualRevenue(businessAddress: string): Promise<{
    amount: bigint;
    source: 'manual';
    verified: boolean;
  } | null> {
    try {
      // Fetch manually reported revenue from database or API
      // This would typically come from a web interface where businesses
      // can manually report their revenue
      
      // For now, return null (no manual data)
      return null;
      
    } catch (error) {
      console.error('❌ Error fetching manual revenue:', error);
      return null;
    }
  }

  private async getStripeAccountId(businessAddress: string): Promise<string | null> {
    // This would typically come from a database mapping
    // business wallet addresses to their Stripe account IDs
    
    // Mock implementation
    const stripeMapping: Record<string, string> = {
      '0x1234567890123456789012345678901234567890': 'acct_1234567890',
      '0x2345678901234567890123456789012345678901': 'acct_2345678901',
    };
    
    return stripeMapping[businessAddress] || null;
  }

  // Public methods for accessing revenue data
  getRevenueData(businessAddress: string): BusinessRevenueData | null {
    return this.revenueData.get(businessAddress) || null;
  }

  getAllRevenueData(): BusinessRevenueData[] {
    return Array.from(this.revenueData.values());
  }

  async updateRevenueManually(
    businessAddress: string, 
    revenue: bigint, 
    source: 'manual' = 'manual'
  ): Promise<void> {
    this.revenueData.set(businessAddress, {
      businessAddress,
      monthlyRevenue: revenue,
      lastUpdated: Date.now(),
      source,
      verified: false, // Manual entries need verification
    });
    
    console.log(`📝 Manual revenue update for ${businessAddress}: $${ethers.formatUnits(revenue, 6)}`);
  }

  isRevenueDataStale(businessAddress: string, maxAgeHours: number = 24): boolean {
    const data = this.revenueData.get(businessAddress);
    if (!data) return true;
    
    const ageHours = (Date.now() - data.lastUpdated) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  }
}