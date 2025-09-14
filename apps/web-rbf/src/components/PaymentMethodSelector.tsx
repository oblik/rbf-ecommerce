"use client";

import React from 'react';
import { PaymentMethod } from '@/providers/payment/types';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const paymentMethods = [
  {
    id: 'wallet' as PaymentMethod,
    name: 'Crypto Wallet',
    description: 'Use USDC from your connected wallet',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    recommended: true,
    fees: 'Network fees only'
  },
  {
    id: 'card' as PaymentMethod,
    name: 'Credit/Debit Card',
    description: 'Buy USDC instantly with your card',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    popular: true,
    fees: 'Small processing fee'
  },
  {
    id: 'exchange' as PaymentMethod,
    name: 'Coinbase Account',
    description: 'Use USDC from your Coinbase balance',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19.5c-4.136 0-7.5-3.364-7.5-7.5S7.864 4.5 12 4.5 19.5 7.864 19.5 12s-3.364 7.5-7.5 7.5z"/>
        <path d="M12 6.75c-2.9 0-5.25 2.35-5.25 5.25S9.1 17.25 12 17.25 17.25 14.9 17.25 12 14.9 6.75 12 6.75zm0 7.5c-1.24 0-2.25-1.01-2.25-2.25S10.76 9.75 12 9.75 14.25 10.76 14.25 12 13.24 14.25 12 14.25z"/>
      </svg>
    ),
    fees: 'Low fees'
  }
];

export default function PaymentMethodSelector({ selected, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3 mb-6">
      <h4 className="font-medium text-gray-900">Choose Payment Method</h4>
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          onClick={() => onChange(method.id)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selected === method.id
              ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selected === method.id ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'}`}>
                {method.icon}
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">{method.name}</div>
                <div className="text-xs text-gray-500">{method.description}</div>
                <div className="text-xs text-gray-400 mt-1">{method.fees}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {method.recommended && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Recommended
                </span>
              )}
              {method.popular && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  Popular
                </span>
              )}
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selected === method.id ? 'border-sky-500 bg-sky-500' : 'border-gray-300'
              }`}>
                {selected === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}