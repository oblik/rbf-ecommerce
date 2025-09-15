'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEnhancedCampaigns } from '@/hooks/useEnhancedCampaigns';
import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import Link from 'next/link';
import ShareModal from '@/components/ShareModal';
import type { CampaignShareData } from '@/utils/shareUtils';
import { useToast } from '@/components/Toast';

export default function FundingSuccessPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const { campaigns } = useEnhancedCampaigns();
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(true);
    const { showToast, ToastContainer } = useToast();
    
    const campaignId = params.id;
    const campaign = campaigns.find(c => c.address === campaignId);
    const amount = searchParams.get('amount') || '0';
    const txHash = searchParams.get('tx');

    useEffect(() => {
        // Hide confetti after animation
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading campaign details...</p>
                </div>
            </div>
        );
    }

    const USDC_DECIMALS = 6;
    const formattedTotal = formatUnits(BigInt(campaign.totalFunded || '0'), USDC_DECIMALS);
    const formattedGoal = formatUnits(BigInt(campaign.fundingGoal || '0'), USDC_DECIMALS);
    const progressPercentage = (Number(campaign.totalFunded) / Number(campaign.fundingGoal)) * 100;
    const daysLeft = Math.max(0, Math.floor((Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));

    const shareData: CampaignShareData = {
        id: campaignId,
        title: campaign.metadata?.title || 'Funding Campaign',
        businessName: campaign.metadata?.businessName || 'Business',
        description: campaign.metadata?.description,
        image: campaign.metadata?.image,
        goal: Number(formattedGoal),
        raised: Number(formattedTotal),
        progressPercentage,
        daysLeft
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-ping"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        >
                            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-70"></div>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        🎉 Funding Successful!
                    </h1>
                    
                    <p className="text-xl text-gray-600 mb-2">
                        You've successfully backed <span className="font-semibold text-green-600">{campaign.metadata?.businessName}</span>
                    </p>
                    
                    <div className="inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold text-lg">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        ${amount} USDC Contribution
                    </div>
                </div>

                {/* Campaign Summary Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            {/* Campaign Image/Logo */}
                            <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-sky-500 to-purple-600 flex-shrink-0">
                                {campaign.metadata?.image ? (
                                    <img 
                                        src={campaign.metadata.image.startsWith('ipfs://') 
                                            ? `https://gateway.pinata.cloud/ipfs/${campaign.metadata.image.replace('ipfs://', '')}`
                                            : campaign.metadata.image
                                        }
                                        alt={campaign.metadata.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div 
                                    className={`w-full h-full flex items-center justify-center ${campaign.metadata?.image ? 'hidden' : 'flex'}`}
                                    style={{ display: campaign.metadata?.image ? 'none' : 'flex' }}
                                >
                                    <span className="text-white font-bold text-2xl">
                                        {campaign.metadata?.businessName?.[0] || 'B'}
                                    </span>
                                </div>
                            </div>

                            {/* Campaign Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {campaign.metadata?.title || 'Funding Campaign'}
                                </h2>
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                    {campaign.metadata?.description || 'Supporting this business growth initiative.'}
                                </p>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Campaign Progress</span>
                                        <span className="text-sm text-gray-500">{progressPercentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                                        <span>${parseFloat(formattedTotal).toLocaleString()} raised</span>
                                        <span>${parseFloat(formattedGoal).toLocaleString()} goal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sharing Section - Moved Up */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-center text-white mb-8">
                    <h3 className="text-2xl font-bold mb-4">🚀 Spread the Word!</h3>
                    <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                        Help {campaign.metadata?.businessName} reach their funding goal by sharing this campaign with your network. 
                        Every share helps build momentum and community support!
                    </p>
                    
                    {/* Priority Social Networks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <button
                            onClick={() => {
                                const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/campaign/${campaignId}`)}&quote=${encodeURIComponent(`Check out ${campaign.metadata?.businessName} on Jama! Help them reach their funding goal.`)}`;
                                window.open(shareUrl, '_blank', 'noopener,noreferrer');
                            }}
                            className="bg-[#1877F2] hover:bg-[#1565C0] text-white px-4 py-3 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                        </button>
                        
                        <button
                            onClick={() => {
                                const shareUrl = `https://www.instagram.com/`;
                                showToast('Instagram sharing works best through mobile app. Link copied to clipboard!');
                                navigator.clipboard.writeText(`${window.location.origin}/campaign/${campaignId}`);
                            }}
                            className="bg-gradient-to-r from-[#E4405F] to-[#F56040] hover:from-[#D73052] hover:to-[#E14A2E] text-white px-4 py-3 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                        </button>
                        
                        <button
                            onClick={() => {
                                const shareUrl = `https://www.tiktok.com/`;
                                showToast('TikTok sharing works best through mobile app. Link copied to clipboard!');
                                navigator.clipboard.writeText(`${window.location.origin}/campaign/${campaignId}`);
                            }}
                            className="bg-[#000000] hover:bg-gray-800 text-white px-4 py-3 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                            </svg>
                            TikTok
                        </button>
                        
                        <button
                            onClick={() => {
                                const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`Check out ${campaign.metadata?.businessName} on Jama! Help them reach their funding goal. ${window.location.origin}/campaign/${campaignId}`)}`;
                                window.open(shareUrl, '_blank', 'noopener,noreferrer');
                            }}
                            className="bg-[#855DCD] hover:bg-[#7A56C2] text-white px-4 py-3 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 1000 1000" fill="currentColor">
                                <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"/>
                                <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                                <path d="M675.555 746.667C663.282 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.444H875.555V817.778C875.555 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.555Z"/>
                            </svg>
                            Farcaster
                        </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => setShareModalOpen(true)}
                            className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            More Share Options
                        </button>
                        
                        <button
                            onClick={async () => {
                                const url = `${window.location.origin}/campaign/${campaignId}`;
                                try {
                                    await navigator.clipboard.writeText(url);
                                    showToast('Campaign link copied to clipboard!');
                                } catch (err) {
                                    showToast('Failed to copy link', 'error');
                                }
                            }}
                            className="bg-purple-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-500 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                        </button>
                    </div>
                </div>

                {/* Transaction Details */}
                {txHash && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">Transaction Details</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 mb-1">Transaction Hash:</p>
                                <p className="text-blue-900 font-mono text-sm">{txHash.slice(0, 20)}...{txHash.slice(-10)}</p>
                            </div>
                            <a
                                href={`https://sepolia.basescan.org/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                View on Explorer →
                            </a>
                        </div>
                    </div>
                )}


                {/* Next Steps */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">What's Next?</h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Track your investment progress and returns through your investor dashboard. 
                        You'll receive updates as the business shares revenue according to the agreed terms.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/investor/returns"
                            className="bg-sky-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-sky-700 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            View Investment Returns
                        </Link>
                        
                        <Link
                            href="/"
                            className="bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h0a2 2 0 012 2v0H8v0z" />
                            </svg>
                            Explore More Campaigns
                        </Link>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setShareModalOpen(false)}
                campaign={shareData}
            />

            {/* Toast Container */}
            <ToastContainer />
        </div>
    );
}