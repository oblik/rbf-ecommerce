'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { factoryAbi } from '@/abi/factory';
import { useBusinessRegistry } from '@/hooks/useBusinessRegistry';
import VerticalSelector from './VerticalSelector';
import VerticalInsights from './VerticalInsights';

interface CampaignFormData {
  title: string;
  description: string;
  businessName: string;
  website: string;
  vertical: string;
  fundingGoal: string;
  fundingPeriodDays: string;
  revenueSharePercent: string;
  repaymentCap: string;
  image?: File;
}


export default function CreateCampaignForm() {
  const { address, isConnected } = useAccount();
  
  // Business Registry Integration
  const { useIsRegistered, useBusinessProfile } = useBusinessRegistry();
  const { data: isRegistered, isLoading: checkingRegistration } = useIsRegistered(address);
  const { data: businessProfile } = useBusinessProfile(address);
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    businessName: '',
    website: '',
    vertical: '',
    fundingGoal: '',
    fundingPeriodDays: '30',
    revenueSharePercent: '5',
    repaymentCap: '1.5',
  });
  const [businessMetadata, setBusinessMetadata] = useState({
    businessDescription: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Auto-fill business data if already registered
  useEffect(() => {
    if (businessProfile && isRegistered) {
      setFormData(prev => ({
        ...prev,
        businessName: businessProfile.name || prev.businessName,
      }));
    }
  }, [businessProfile, isRegistered]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadToPinata = async (data: any): Promise<string> => {
    try {
      const response = await fetch('/api/upload-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to upload to IPFS');
      }

      const result = await response.json();
      return `ipfs://${result.hash}`;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };

  const uploadImageToPinata = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image to IPFS');
      }

      const result = await response.json();
      return `ipfs://${result.hash}`;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const uploadMetadata = async (): Promise<{ campaignURI: string; businessURI?: string }> => {
    // Upload image to IPFS first if provided
    let imageURI: string | undefined;
    if (formData.image) {
      setUploadProgress('Uploading image to IPFS...');
      imageURI = await uploadImageToPinata(formData.image);
    }

    // Create campaign metadata
    setUploadProgress('Creating campaign metadata...');
    const campaignMetadata = {
      title: formData.title,
      description: formData.description,
      businessName: formData.businessName,
      website: formData.website,
      vertical: formData.vertical,
      image: imageURI, // IPFS URI of the uploaded image
      revenueShare: Number(formData.revenueSharePercent),
      repaymentCap: Number(formData.repaymentCap),
      createdAt: new Date().toISOString(),
    };

    let businessURI: string | undefined;

    // Only create business metadata if not registered
    if (!isRegistered) {
      setUploadProgress('Registering business profile...');
      const businessMetadataObj = {
        name: formData.businessName,
        description: businessMetadata.businessDescription,
        website: formData.website,
        registeredAt: new Date().toISOString(),
      };
      
      businessURI = await uploadToPinata(businessMetadataObj);
    }

    setUploadProgress('Finalizing campaign data...');
    const campaignURI = await uploadToPinata(campaignMetadata);
    
    return { campaignURI, businessURI };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('Preparing upload...');
    try {
      // Upload metadata to IPFS
      const { campaignURI, businessURI } = await uploadMetadata();
      
      setUploadProgress('Creating blockchain transaction...');

      // Prepare campaign parameters
      const fundingGoal = parseUnits(formData.fundingGoal, 6); // USDC has 6 decimals
      const revenueShareBP = Math.floor(Number(formData.revenueSharePercent) * 100); // Convert to basis points
      const repaymentCapBP = Math.floor(Number(formData.repaymentCap) * 10000); // Convert to basis points

      if (isRegistered) {
        // Use legacy function for existing businesses
        writeContract({
          address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
          abi: factoryAbi,
          functionName: 'createCampaign',
          args: [
            campaignURI,
            fundingGoal,
            BigInt(formData.fundingPeriodDays),
            BigInt(revenueShareBP),
            BigInt(repaymentCapBP),
          ],
        });
      } else {
        // Use new auto-registration function for new businesses
        writeContract({
          address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
          abi: factoryAbi,
          functionName: 'createCampaign',
          args: [
            // CampaignParams struct
            {
              metadataURI: campaignURI,
              fundingGoal: fundingGoal,
              fundingPeriodDays: BigInt(formData.fundingPeriodDays),
              revenueSharePercent: BigInt(revenueShareBP),
              repaymentCap: BigInt(repaymentCapBP),
            },
            // BusinessParams struct (only used if not registered)
            {
              name: formData.businessName,
              metadataURI: businessURI || '',
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Created!</h2>
        <p className="text-gray-600 mb-4">Your Jama campaign has been successfully created and is now live.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700"
        >
          View All Campaigns
        </button>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Business Info', fields: ['title', 'businessName', 'description'] },
    { id: 2, title: 'Social Capital', fields: [] },
    { id: 3, title: 'Funding Details', fields: ['fundingGoal', 'fundingPeriodDays'] },
    { id: 4, title: 'Terms & Image', fields: ['revenueSharePercent', 'repaymentCap', 'image'] },
  ];

  const currentStepData = steps.find(s => s.id === currentStep);
  const isStepValid = () => {
    if (!currentStepData) return false;
    
    // Step 1: Business Info validation
    if (currentStep === 1) {
      const requiredFields = ['title', 'description', 'businessName', 'vertical'];
      
      return requiredFields.every(field => 
        formData[field as keyof CampaignFormData]?.toString().trim()
      );
    }
    
    // Step 2: Social Capital (optional - can always proceed)
    if (currentStep === 2) {
      return true; // Social connections are optional
    }
    
    // Step 3: Funding Details validation
    if (currentStep === 3) {
      return currentStepData.fields.every(field => 
        formData[field as keyof CampaignFormData]?.toString().trim()
      );
    }
    
    // Step 4: Terms & Image - Require image to be uploaded for form to be valid
    if (currentStep === 4) {
      const fieldsValid = currentStepData.fields.every(field => 
        field === 'image' ? formData.image : formData[field as keyof CampaignFormData]?.toString().trim()
      );
      return fieldsValid;
    }
    
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id ? 'bg-sky-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-sky-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={(e) => {
        // Prevent Enter key from submitting form when typing in any input field
        // Only allow Enter on submit button itself
        if (e.key === 'Enter' && (
          e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )) {
          e.preventDefault();
        }
      }} className="space-y-6">
        {/* Step 1: Business Information */}
        {currentStep === 1 && (
          <>
            {/* Business Registration Status */}
            {checkingRegistration ? (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
                <p className="text-sky-700">Checking business registration status...</p>
              </div>
            ) : isRegistered ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-700 font-medium">
                    Welcome back, {businessProfile?.name || 'Business'}!
                  </p>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Your business is registered. You can use your existing business name or create campaigns under a new business name.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700 font-medium">New Campaign</p>
                <p className="text-gray-600 text-sm mt-1">
                  Create your first campaign and establish your business profile on the platform.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Purpose (2 lines recommended)
              </label>
              <textarea
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Expand Our Eco-Friendly Product Line&#10;Launch new sustainable packaging and grow inventory"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                rows={2}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep it concise - this appears as the description on your campaign card
              </p>
              
              {/* Live Preview */}
              {formData.title && formData.businessName && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-3">Preview how it appears on your campaign card:</p>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 max-w-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {formData.businessName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {formData.title}
                    </p>
                    <div className="text-xs text-gray-400">
                      [Funding progress and terms would appear here]
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder={isRegistered ? `Current: ${businessProfile?.name || 'GreenTech Solutions'} (or enter new name)` : "e.g., GreenTech Solutions Inc."}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
              {isRegistered && (
                <p className="text-sm text-sky-600 mt-1">
                  You can use your registered business name "{businessProfile?.name || 'GreenTech Solutions'}" or enter a new business name for this campaign.
                </p>
              )}
            </div>

            {/* Business Vertical Selector */}
            <VerticalSelector
              value={formData.vertical}
              onChange={(verticalId) => setFormData(prev => ({ ...prev, vertical: verticalId }))}
              showDescription={true}
            />

            {/* Show insights if vertical is selected */}
            {formData.vertical && (
              <VerticalInsights 
                verticalId={formData.vertical}
                onRecommendationApply={(revenueShare, repaymentCap) => {
                  setFormData(prev => ({
                    ...prev,
                    revenueSharePercent: revenueShare.toString(),
                    repaymentCap: repaymentCap.toString()
                  }));
                }}
                showApplyButton={true}
              />
            )}

            {!isRegistered && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  name="businessDescription"
                  value={businessMetadata.businessDescription}
                  onChange={handleBusinessMetadataChange}
                  rows={3}
                  placeholder="Share your story, network connections, and what makes your community believe in you..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Help the community understand your social proof and business credibility
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website (Optional)
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe how you'll use the funding and your growth plans..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
            </div>
          </>
        )}

        {/* Step 2: Social Capital */}
        {currentStep === 2 && (
          <>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sky-900">Connect Your Social Capital</h3>
                  <p className="text-sm text-sky-700">Link your social media accounts to showcase your network and community trust</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-sky-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900">Twitter / X</h4>
                        <p className="text-xs text-gray-500">Connect your Twitter/X account</p>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-sky-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900">LinkedIn</h4>
                        <p className="text-xs text-gray-500">Connect your professional network</p>
                      </div>
                    </div>
                    <button className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-sky-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.739.097.118.11.221.082.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900">Pinterest</h4>
                        <p className="text-xs text-gray-500">Showcase your brand aesthetic</p>
                      </div>
                    </div>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Why connect social accounts?</p>
                    <p className="text-blue-700">
                      Your social connections demonstrate community trust and business credibility. 
                      Supporters can see your network strength and engagement, which helps validate your campaign.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              Social connections are optional but recommended for building supporter confidence
            </div>
          </>
        )}

        {/* Step 3: Funding Details */}
        {currentStep === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Goal (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="fundingGoal"
                  value={formData.fundingGoal}
                  onChange={handleInputChange}
                  placeholder="50000"
                  min="1000"
                  max="10000000"
                  className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
                <span className="absolute left-3 top-3 text-gray-500">$</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Minimum: $1,000 | Maximum: $10,000,000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Period (Days)
              </label>
              <select
                name="fundingPeriodDays"
                value={formData.fundingPeriodDays}
                onChange={(e) => setFormData(prev => ({ ...prev, fundingPeriodDays: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </>
        )}

        {/* Step 4: Terms & Image */}
        {currentStep === 4 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revenue Share (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="revenueSharePercent"
                    value={formData.revenueSharePercent}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    step="0.1"
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                  <span className="absolute right-3 top-3 text-gray-500">%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">1% - 20% of monthly revenue</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repayment Cap (x)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="repaymentCap"
                    value={formData.repaymentCap}
                    onChange={handleInputChange}
                    min="1.1"
                    max="3.0"
                    step="0.1"
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                  <span className="absolute right-3 top-3 text-gray-500">x</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">1.1x - 3.0x of funding amount</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <div>
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-gray-600">Click to upload an image</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentStep === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!isStepValid()}
              className={`px-6 py-2 rounded-lg font-medium ${
                isStepValid() 
                  ? 'bg-sky-600 text-white hover:bg-sky-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isConnected || !isStepValid() || isSubmitting || isPending || isConfirming}
              className={`px-8 py-2 rounded-lg font-medium ${
                (isConnected && isStepValid() && !isSubmitting && !isPending && !isConfirming)
                  ? 'bg-sky-600 text-white hover:bg-sky-700' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              {isSubmitting || isPending || isConfirming ? 'Creating...' : 'Create Campaign'}
            </button>
          )}
        </div>
      </form>

      {uploadProgress && (
        <div className="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-600 border-t-transparent"></div>
            <p className="text-sky-800">{uploadProgress}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error.message}</p>
        </div>
      )}
    </div>
  );
}