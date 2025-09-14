import type { 
  IPaymentProvider, 
  PaymentParams, 
  PaymentResult, 
  PaymentMethod,
} from '../types';

export class PrivyProvider implements IPaymentProvider {
  name = 'privy' as const;
  displayName = 'Crypto Wallet';
  supportedMethods: PaymentMethod[] = ['wallet'];
  
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    const { campaignAddress, fiatAmount, onSuccess, onError } = params;
    
    try {
      // Import wagmi hooks dynamically to avoid SSR issues
      const { parseUnits } = await import('viem');
      
      // Convert fiat amount to USDC amount (6 decimals)
      const usdcAmount = parseUnits(fiatAmount.toString(), 6);
      
      console.log('🏦 Wallet Payment Flow:', {
        campaignAddress,
        fiatAmount,
        usdcAmount: usdcAmount.toString(),
      });
      
      // The actual transaction will be handled by the UnifiedPaymentButton
      // which will call the appropriate wagmi hooks for USDC approval + campaign contribution
      
      onSuccess?.(`Prepared to transfer ${fiatAmount} USDC to campaign`);
      
      return {
        success: true,
        message: 'Wallet payment prepared - transaction will be executed next',
        provider: this.name,
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Wallet payment failed';
      console.error('Wallet payment preparation error:', error);
      onError?.(errorMsg);
      
      return {
        success: false,
        error: errorMsg,
        provider: this.name,
      };
    }
  }
  
  isAvailable(): boolean {
    // Check if window and wallet connection is available
    return typeof window !== 'undefined';
  }
  
  isMethodSupported(method: PaymentMethod): boolean {
    return method === 'wallet';
  }
}