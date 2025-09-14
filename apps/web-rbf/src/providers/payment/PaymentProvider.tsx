"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { PaymentProviderFactory } from './factory';
import { IPaymentProvider, PaymentParams, PaymentResult } from './types';

interface PaymentContextValue {
  provider: IPaymentProvider;
  initiatePayment: (params: PaymentParams) => Promise<PaymentResult>;
  providerName: string;
  availableProviders: IPaymentProvider[];
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const contextValue = useMemo(() => {
    const provider = PaymentProviderFactory.getProvider();
    const availableProviders = PaymentProviderFactory.getAvailableProviders();
    
    return {
      provider,
      initiatePayment: (params: PaymentParams) => provider.initiatePayment(params),
      providerName: provider.displayName,
      availableProviders,
    };
  }, []);
  
  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePaymentProvider() {
  const context = useContext(PaymentContext);
  
  if (!context) {
    throw new Error('usePaymentProvider must be used within PaymentProvider');
  }
  
  return context;
}