"use client";

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import PaymentOptionsRBF from './PaymentOptionsRBF';

const suggestedAmounts = [100, 250, 500, 1000, 2500];

type FundingFormProps = {
    campaignId: string;
    campaignNumericId: string;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
};

export default function FundingForm({
    campaignId,
    campaignNumericId,
    onSuccess,
    onError,
}: FundingFormProps) {
    const { login, user, ready } = usePrivy();
    const [amount, setAmount] = useState('100');
    const amountIsValid = (parseFloat(amount) || 0) >= 100;

    const handleAmountClick = (value: number) => {
        setAmount(value.toString());
    };

    if (!ready) {
        return (
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg max-w-lg mx-auto">
                <div className="text-center py-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
            {/* User status bar */}
            {user ? (
                <div className="px-6 py-4 bg-green-50 border-b border-green-100 rounded-t-2xl">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-medium text-green-800">
                                Logged in as <span className="font-mono">{user.wallet?.address.slice(0, 6)}...{user.wallet?.address.slice(-4)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Have an account?{' '}
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    login();
                                }} 
                                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                            >
                                Log In
                            </button>
                        </p>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-6">
                {/* Amount selection */}
                <div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                        {suggestedAmounts.map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => handleAmountClick(val)}
                                className={`py-2.5 px-3 rounded-xl font-semibold transition-all text-sm ${
                                    amount === val.toString() 
                                    ? 'bg-sky-600 text-white shadow-sm scale-105' 
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                            >
                                ${val}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex items-center p-4 border-2 border-gray-200 rounded-xl focus-within:border-sky-500 transition-all bg-gray-50">
                        <div className="flex flex-col mr-4">
                            <span className="font-bold text-xl text-gray-800">$</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase">USDC</span>
                        </div>
                        <div className="flex-1 flex justify-end items-baseline overflow-hidden">
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="100"
                                className="w-full min-w-0 text-right text-5xl font-bold tracking-tighter text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-gray-300"
                            />
                            <span className="text-5xl font-bold tracking-tight text-gray-300">.00</span>
                        </div>
                    </div>
                    {!amountIsValid && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Minimum investment is $100.00
                        </p>
                    )}
                </div>

                {/* Payment options */}
                <div>
                    <PaymentOptionsRBF
                        campaignId={campaignId}
                        campaignNumericId={campaignNumericId}
                        fiatAmount={parseFloat(amount) || 0}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                </div>
            </div>

            {/* Risk Disclaimer */}
            <div className="px-6 pb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-yellow-800 mb-1">Funding Risk</h4>
                            <p className="text-xs text-yellow-700">
                                Business funding involves risk. Only fund what you can afford to lose. 
                                Returns are based on business performance and are not guaranteed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 