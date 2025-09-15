"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useWallets, ConnectedWallet } from '@privy-io/react-auth';
import { BanknotesIcon, CreditCardIcon as OutlineCreditCardIcon } from '@heroicons/react/24/outline';
import { usePaymentProvider } from '@/providers/payment/PaymentProvider';
import UnifiedPaymentButton from './UnifiedPaymentButton';
import { useUSDCPayment } from '@/hooks/useUSDCPayment';

const CoinbaseIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#0052FF"/>
        <path d="M9 9h6v6H9V9z" fill="white"/>
    </svg>
);

type PaymentOptionsProps = {
  campaignId: string;
  campaignNumericId: string;
  fiatAmount: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function PaymentOptionsRBF({ 
    campaignId, 
    campaignNumericId, 
    fiatAmount, 
    onSuccess, 
    onError 
}: PaymentOptionsProps) {
    const router = useRouter();
    const { user, authenticated, login, logout } = usePrivy();
    const { wallets } = useWallets();
    const { provider } = usePaymentProvider();

    const [selectedOption, setSelectedOption] = useState<string | null>('card');
    const [selectedEoaWallet, setSelectedEoaWallet] = useState<ConnectedWallet | null>(null);
    const [availableOptions, setAvailableOptions] = useState<any[]>([]);

    // USDC payment hook for wallet transactions
    const usdcPayment = useUSDCPayment({
        campaignAddress: campaignId as `0x${string}`,
        amount: fiatAmount,
    });

    const handleOnchainWalletSelect = () => {
        setSelectedOption('wallet');

        if (!authenticated) {
            setTimeout(() => login(), 0);
            return;
        }
        
        const eoaWallet = wallets.find(wallet => wallet.walletClientType !== 'privy');
        if (eoaWallet) {
            setSelectedEoaWallet(eoaWallet);
        } else {
            setSelectedEoaWallet(null);
        }
    };
    
    useEffect(() => {
        if (authenticated && wallets.length > 0 && !selectedEoaWallet) {
            const eoaWallet = wallets.find(wallet => wallet.walletClientType !== 'privy');
            if (eoaWallet) {
                setSelectedEoaWallet(eoaWallet);
                setSelectedOption('wallet');
            }
        }
    }, [authenticated, wallets, selectedEoaWallet]);

    useEffect(() => {
        const baseOptions: { id: string; name: string; Icon: any; description: string }[] = [];
        
        // Card option (Coinbase Pay)
        if (provider.isMethodSupported('card')) {
            baseOptions.push({ 
                id: 'card', 
                name: 'Credit/Debit Card', 
                Icon: OutlineCreditCardIcon,
                description: 'Buy USDC instantly with Coinbase Pay'
            });
        }
        
        // Exchange option (Coinbase account)
        if (provider.isMethodSupported('exchange')) {
            baseOptions.push({ 
                id: 'exchange', 
                name: 'Coinbase Account', 
                Icon: CoinbaseIcon,
                description: 'Use USDC from your Coinbase balance'
            });
        }
        
        // Wallet option (direct USDC transfer)
        baseOptions.push({ 
            id: 'wallet', 
            name: 'Crypto Wallet', 
            Icon: BanknotesIcon,
            description: 'Use USDC from your connected wallet'
        });

        setAvailableOptions(baseOptions);
    }, [provider]);

    // Handle USDC payment completion
    useEffect(() => {
        if (usdcPayment.isCompleted) {
            // Redirect to success page with transaction details
            const successUrl = `/campaign/${campaignId}/success?amount=${fiatAmount}${usdcPayment.contributionTxHash ? `&tx=${usdcPayment.contributionTxHash}` : ''}`;
            router.push(successUrl);
            usdcPayment.reset();
        }
    }, [usdcPayment.isCompleted, fiatAmount, campaignId, usdcPayment.contributionTxHash, router]);

    // Handle USDC payment errors
    useEffect(() => {
        if (usdcPayment.error) {
            onError(usdcPayment.error);
        }
    }, [usdcPayment.error, onError]);

    const renderSelectedPaymentComponent = () => {
        // Handle wallet option (direct USDC transfer)
        if (selectedOption === 'wallet') {
            if (!authenticated) {
                return (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            login();
                        }}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Connect Wallet to Invest
                    </button>
                );
            }
            
            return (
                <>
                    <button
                        onClick={async () => {
                            try {
                                await usdcPayment.executePayment();
                            } catch (error: any) {
                                onError(error.message || 'Wallet payment failed');
                            }
                        }}
                        disabled={
                            usdcPayment.isApproving || 
                            usdcPayment.isContributing || 
                            fiatAmount < 100
                        }
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {usdcPayment.isApproving && 'Approving USDC...'}
                        {usdcPayment.isContributing && 'Contributing to Campaign...'}
                        {!usdcPayment.isApproving && !usdcPayment.isContributing && `Invest ${fiatAmount} USDC`}
                    </button>
                    
                    {(usdcPayment.isApproving || usdcPayment.isContributing) && (
                        <div className="mt-3 text-center space-y-2">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                                {usdcPayment.isApproving && 'Step 1/2: Approving USDC spending...'}
                                {usdcPayment.isContributing && 'Step 2/2: Contributing to campaign...'}
                            </div>
                            
                            {/* Show transaction hash for tracking */}
                            {usdcPayment.approvalTxHash && (
                                <div className="text-xs text-gray-600">
                                    <a 
                                        href={`https://sepolia.basescan.org/tx/${usdcPayment.approvalTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-blue-600 underline"
                                    >
                                        Track Approval: {usdcPayment.approvalTxHash.slice(0, 8)}...{usdcPayment.approvalTxHash.slice(-6)}
                                    </a>
                                </div>
                            )}
                            
                            {usdcPayment.contributionTxHash && (
                                <div className="text-xs text-gray-600">
                                    <a 
                                        href={`https://sepolia.basescan.org/tx/${usdcPayment.contributionTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-blue-600 underline"
                                    >
                                        Track Contribution: {usdcPayment.contributionTxHash.slice(0, 8)}...{usdcPayment.contributionTxHash.slice(-6)}
                                    </a>
                                </div>
                            )}
                            
                            {/* Error display and retry option */}
                            {usdcPayment.error && (
                                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                                    <div className="font-medium mb-1">Transaction Error:</div>
                                    <div className="mb-2">{usdcPayment.error}</div>
                                    <button
                                        onClick={() => {
                                            usdcPayment.reset();
                                        }}
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <button
                        onClick={() => {
                          logout();
                          setSelectedEoaWallet(null);
                          setSelectedOption('card');
                        }}
                        className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Logout
                    </button>
                </>
            );
        }

        // Use unified payment button for card and exchange
        if (selectedOption === 'card' || selectedOption === 'exchange') {
            return (
                <UnifiedPaymentButton
                    campaignAddress={campaignId as `0x${string}`}
                    campaignNumericId={campaignNumericId}
                    fiatAmount={fiatAmount}
                    onSuccess={onSuccess}
                    onError={onError}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                />
            );
        }

        return null;
    };

    return (
        <div className="space-y-4">
            <fieldset>
                <legend className="text-sm font-medium text-gray-900 mb-3">Choose Payment Method</legend>
                <div className="space-y-3">
                    {availableOptions.map((option) => (
                        <div
                            key={option.id}
                            onClick={option.id === 'wallet' ? handleOnchainWalletSelect : () => setSelectedOption(option.id)}
                            className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                                selectedOption === option.id 
                                    ? 'bg-sky-50 border-2 border-sky-500 shadow-sm' 
                                    : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex-shrink-0">
                                <option.Icon className={`h-6 w-6 ${
                                    selectedOption === option.id ? 'text-sky-600' : 'text-gray-500'
                                }`} aria-hidden="true" />
                            </div>
                            <div className="ml-4 flex-1">
                                <div className={`font-semibold text-base cursor-pointer ${
                                    selectedOption === option.id ? 'text-sky-900' : 'text-gray-900'
                                }`}>
                                    {option.name}
                                </div>
                                <div className={`text-sm ${
                                    selectedOption === option.id ? 'text-sky-700' : 'text-gray-500'
                                }`}>
                                    {option.description}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedOption === option.id 
                                        ? 'border-sky-500 bg-sky-500' 
                                        : 'border-gray-300 bg-white'
                                }`}>
                                    {selectedOption === option.id && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </fieldset>

            <div className="pt-2">
                {renderSelectedPaymentComponent()}
            </div>
        </div>
    );
}