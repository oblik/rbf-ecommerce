import type { IPaymentProvider, ProviderName } from './types';
import { CoinbaseProvider } from './coinbase/CoinbaseProvider';
import { PrivyProvider } from './privy/PrivyProvider';

export class PaymentProviderFactory {
  private static providers: Record<ProviderName, IPaymentProvider> = {
    coinbase: new CoinbaseProvider(),
    privy: new PrivyProvider(),
  };

  static getProvider(preferredProvider?: ProviderName): IPaymentProvider {
    // Check if preferred provider is available
    if (preferredProvider && this.providers[preferredProvider]?.isAvailable()) {
      return this.providers[preferredProvider];
    }

    // Default to Coinbase if available, otherwise Privy
    if (this.providers.coinbase.isAvailable()) {
      return this.providers.coinbase;
    }

    return this.providers.privy;
  }

  static getAllProviders(): IPaymentProvider[] {
    return Object.values(this.providers);
  }

  static getAvailableProviders(): IPaymentProvider[] {
    return Object.values(this.providers).filter(provider => provider.isAvailable());
  }
}