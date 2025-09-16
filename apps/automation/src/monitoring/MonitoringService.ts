import { ethers } from 'ethers';
import { CronJob } from 'cron';

interface CampaignMetrics {
  address: string;
  owner: string;
  totalFunded: bigint;
  totalRepaid: bigint;
  lastPayment: number;
  nextPaymentDue: number;
  daysOverdue: number;
  status: 'funding' | 'active' | 'completed' | 'defaulted';
  healthScore: number; // 0-100
}

interface SystemMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalValueLocked: bigint;
  totalRepaid: bigint;
  averageHealthScore: number;
  overduePayments: number;
  automationSuccessRate: number;
}

export class MonitoringService {
  private provider: ethers.Provider;
  private cronJob: CronJob | null = null;
  private campaignMetrics: Map<string, CampaignMetrics> = new Map();
  private systemMetrics: SystemMetrics = {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalValueLocked: 0n,
    totalRepaid: 0n,
    averageHealthScore: 0,
    overduePayments: 0,
    automationSuccessRate: 0,
  };

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
    console.log('🔧 MonitoringService initialized');
  }

  async start(): Promise<void> {
    console.log('▶️ Starting monitoring service...');
    
    // Set up cron job to update metrics every 10 minutes
    this.cronJob = new CronJob('*/10 * * * *', async () => {
      await this.updateMetrics();
    });
    
    this.cronJob.start();
    
    // Initial metrics update
    await this.updateMetrics();
    
    console.log('✅ Monitoring service started');
  }

  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    console.log('⏹️ Monitoring service stopped');
  }

  private async updateMetrics(): Promise<void> {
    try {
      console.log('📊 Updating system metrics...');
      
      await this.updateCampaignMetrics();
      await this.updateSystemMetrics();
      await this.checkHealthAlerts();
      
      console.log('✅ Metrics updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating metrics:', error);
    }
  }

  private async updateCampaignMetrics(): Promise<void> {
    // Get all campaigns from factory
    const campaigns = await this.getAllCampaigns();
    
    for (const campaignAddress of campaigns) {
      const metrics = await this.getCampaignMetrics(campaignAddress);
      this.campaignMetrics.set(campaignAddress, metrics);
    }
  }

  private async getAllCampaigns(): Promise<string[]> {
    const campaignFactoryAddress = process.env.CAMPAIGN_FACTORY_ADDRESS!;
    const campaignFactory = new ethers.Contract(
      campaignFactoryAddress,
      [], // Add factory ABI
      this.provider
    );
    
    // Mock implementation
    return [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
    ];
  }

  private async getCampaignMetrics(campaignAddress: string): Promise<CampaignMetrics> {
    const campaign = new ethers.Contract(
      campaignAddress,
      [], // Add campaign ABI
      this.provider
    );
    
    // Mock implementation - replace with actual contract calls
    const now = Math.floor(Date.now() / 1000);
    const mockMetrics: CampaignMetrics = {
      address: campaignAddress,
      owner: '0x3333333333333333333333333333333333333333',
      totalFunded: BigInt(100000) * BigInt(10 ** 6), // 100k USDC
      totalRepaid: BigInt(10000) * BigInt(10 ** 6),   // 10k USDC
      lastPayment: now - (30 * 24 * 60 * 60), // 30 days ago
      nextPaymentDue: now - (7 * 24 * 60 * 60), // 7 days overdue
      daysOverdue: 7,
      status: 'active',
      healthScore: 75,
    };
    
    return mockMetrics;
  }

  private async updateSystemMetrics(): Promise<void> {
    const campaigns = Array.from(this.campaignMetrics.values());
    
    this.systemMetrics = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalValueLocked: campaigns.reduce((sum, c) => sum + c.totalFunded, 0n),
      totalRepaid: campaigns.reduce((sum, c) => sum + c.totalRepaid, 0n),
      averageHealthScore: campaigns.length > 0 
        ? campaigns.reduce((sum, c) => sum + c.healthScore, 0) / campaigns.length 
        : 0,
      overduePayments: campaigns.filter(c => c.daysOverdue > 0).length,
      automationSuccessRate: 95.5, // Mock value
    };
  }

  private async checkHealthAlerts(): Promise<void> {
    const alerts: string[] = [];
    
    // Check for critical health scores
    for (const [address, metrics] of this.campaignMetrics) {
      if (metrics.healthScore < 30) {
        alerts.push(`🚨 CRITICAL: Campaign ${address} health score: ${metrics.healthScore}`);
      } else if (metrics.healthScore < 50) {
        alerts.push(`⚠️ WARNING: Campaign ${address} health score: ${metrics.healthScore}`);
      }
      
      if (metrics.daysOverdue > 14) {
        alerts.push(`🚨 CRITICAL: Campaign ${address} is ${metrics.daysOverdue} days overdue`);
      } else if (metrics.daysOverdue > 7) {
        alerts.push(`⚠️ WARNING: Campaign ${address} is ${metrics.daysOverdue} days overdue`);
      }
    }
    
    // Check system-wide alerts
    if (this.systemMetrics.averageHealthScore < 60) {
      alerts.push(`🚨 SYSTEM: Low average health score: ${this.systemMetrics.averageHealthScore.toFixed(1)}`);
    }
    
    if (this.systemMetrics.automationSuccessRate < 90) {
      alerts.push(`🚨 SYSTEM: Low automation success rate: ${this.systemMetrics.automationSuccessRate}%`);
    }
    
    // Log alerts (in production, would send to monitoring service)
    for (const alert of alerts) {
      console.log(alert);
    }
    
    if (alerts.length === 0) {
      console.log('✅ All systems healthy');
    }
  }

  // Public API methods
  getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  getCampaignMetrics(address: string): CampaignMetrics | null {
    return this.campaignMetrics.get(address) || null;
  }

  getAllCampaignMetrics(): CampaignMetrics[] {
    return Array.from(this.campaignMetrics.values());
  }

  getOverdueCampaigns(): CampaignMetrics[] {
    return Array.from(this.campaignMetrics.values())
      .filter(metrics => metrics.daysOverdue > 0)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  getCriticalCampaigns(): CampaignMetrics[] {
    return Array.from(this.campaignMetrics.values())
      .filter(metrics => metrics.healthScore < 30)
      .sort((a, b) => a.healthScore - b.healthScore);
  }

  generateHealthReport(): string {
    const metrics = this.systemMetrics;
    const overdue = this.getOverdueCampaigns();
    const critical = this.getCriticalCampaigns();
    
    return `
📊 RBF HEALTH REPORT
====================
Total Campaigns: ${metrics.totalCampaigns}
Active Campaigns: ${metrics.activeCampaigns}
Total Value Locked: $${ethers.formatUnits(metrics.totalValueLocked, 6)}
Total Repaid: $${ethers.formatUnits(metrics.totalRepaid, 6)}
Average Health Score: ${metrics.averageHealthScore.toFixed(1)}
Automation Success Rate: ${metrics.automationSuccessRate}%

⚠️ OVERDUE PAYMENTS: ${overdue.length}
${overdue.map(c => `  - ${c.address}: ${c.daysOverdue} days`).join('\n')}

🚨 CRITICAL CAMPAIGNS: ${critical.length}
${critical.map(c => `  - ${c.address}: ${c.healthScore}% health`).join('\n')}
`;
  }
}