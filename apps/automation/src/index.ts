import dotenv from 'dotenv';
import { RevenueCollectionService } from './gelato/RevenueCollectionService';
import { RevenueOracle } from './oracle/RevenueOracle';
import { MonitoringService } from './monitoring/MonitoringService';

dotenv.config();

async function main() {
  console.log('🚀 Starting RBF Automation Service...');
  
  // Initialize services
  const revenueOracle = new RevenueOracle();
  const revenueCollectionService = new RevenueCollectionService();
  const monitoringService = new MonitoringService();
  
  // Start monitoring and automation
  await revenueOracle.start();
  await revenueCollectionService.start();
  await monitoringService.start();
  
  console.log('✅ RBF Automation Service is running');
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('🛑 Shutting down RBF Automation Service...');
    await revenueOracle.stop();
    await revenueCollectionService.stop();
    await monitoringService.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Failed to start automation service:', error);
  process.exit(1);
});