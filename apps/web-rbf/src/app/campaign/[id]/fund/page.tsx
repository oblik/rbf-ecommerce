"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCampaigns } from '@/hooks/useCampaigns';
import FundingForm from '@/components/FundingForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function FundPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const campaignId = params.id;
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { campaigns, loading } = useCampaigns();
    const campaign = campaigns.find(c => c.address === campaignId);

    const handleSuccess = (message: string) => {
        console.log("Investment successful:", message);
        setSuccessMessage(message);
        setErrorMessage(null);
        
        // Clear success message after 5 seconds and redirect back to campaign
        setTimeout(() => {
            setSuccessMessage(null);
            router.push(`/campaign/${campaignId}`);
        }, 5000);
    };

    const handleError = (error: string) => {
        console.error("Investment Error:", error);
        setErrorMessage(error);
        setSuccessMessage(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                    <p className="text-gray-600">Loading campaign details...</p>
                </div>
            </div>
        );
    }
    
    if (!campaign && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
                    <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700"
                    >
                        Back to Campaigns
                    </button>
                </div>
            </div>
        );
    }
    
    if (!campaign) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                    <p className="text-gray-600">Loading campaign details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push(`/campaign/${campaignId}`)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                                <span>Back to Campaign</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Fund "{campaign.metadata?.title || 'this campaign'}"
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Back this growing business and earn returns from their success.
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="max-w-lg mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-green-800">Investment Successful!</h3>
                                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                                <p className="text-xs text-green-600 mt-2">Redirecting back to campaign...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <div className="max-w-lg mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Investment Failed</h3>
                                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Campaign Summary */}
                <div className="max-w-lg mx-auto mb-8 bg-white rounded-lg shadow-sm p-6">
                    <div className="text-center">
                        <h3 className="font-semibold text-gray-900 mb-4">Campaign Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Business:</span>
                                <span className="font-medium">{campaign.metadata?.businessName || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Revenue Share:</span>
                                <span className="font-medium text-sky-600">{(campaign.revenueSharePercent / 100) || 5}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Max Repayment:</span>
                                <span className="font-medium text-green-600">{(campaign.repaymentCap / 10000) || 1.5}x</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">24 months</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Funding Form */}
                <FundingForm
                    campaignId={campaignId}
                    campaignNumericId={campaign.campaignId || campaignId}
                    onSuccess={handleSuccess}
                    onError={handleError}
                />
            </div>
        </div>
    );
}