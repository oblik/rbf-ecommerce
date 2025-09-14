import { generateOnRampURL } from '@coinbase/cbpay-js';
import type { 
  IPaymentProvider, 
  PaymentParams, 
  PaymentResult, 
  PaymentMethod,
} from '../types';

export class CoinbaseProvider implements IPaymentProvider {
  name = 'coinbase' as const;
  displayName = 'Coinbase Pay';
  supportedMethods: PaymentMethod[] = ['card', 'exchange'];
  
  private appId: string | undefined;
  
  constructor() {
    this.appId = process.env.NEXT_PUBLIC_COINBASE_APP_ID;
  }
  
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    const { method, campaignAddress, fiatAmount, onSuccess, onError } = params;
    
    if (!this.isAvailable()) {
      const error = 'Coinbase Pay is not configured';
      onError?.(error);
      return {
        success: false,
        error,
        provider: this.name,
      };
    }
    
    try {
      // Generate OnRamp URL for Base Sepolia
      const onrampUrl = generateOnRampURL({
        appId: this.appId!,
        addresses: {
          [campaignAddress]: ['base-sepolia']
        },
        assets: ['USDC'],
        defaultAsset: 'USDC',
        defaultNetwork: 'base-sepolia',
        presetFiatAmount: fiatAmount,
        fiatCurrency: 'USD',
        defaultExperience: 'buy',
        defaultPaymentMethod: method === 'card' ? 'CARD' : 'CRYPTO_ACCOUNT',
        redirectUrl: `${window.location.origin}${window.location.pathname}?success=true&provider=coinbase`
      });
      
      // Redirect to Coinbase OnRamp
      window.location.href = onrampUrl;
      
      onSuccess?.('Redirecting to Coinbase Pay...');
      
      return {
        success: true,
        message: 'Redirecting to payment processor',
        provider: this.name,
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Payment initiation failed';
      onError?.(errorMsg);
      
      return {
        success: false,
        error: errorMsg,
        provider: this.name,
      };
    }
  }
  
  isAvailable(): boolean {
    return !!this.appId;
  }
  
  isMethodSupported(method: PaymentMethod): boolean {
    return this.supportedMethods.includes(method);
  }
}