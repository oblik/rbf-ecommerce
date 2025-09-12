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
    { id: 2, title: 'Funding Details', fields: ['fundingGoal', 'fundingPeriodDays'] },
    { id: 3, title: 'Terms & Image', fields: ['revenueSharePercent', 'repaymentCap', 'image'] },
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
    
    // Step 2: Standard validation (no image requirement)
    if (currentStep === 2) {
      return currentStepData.fields.every(field => 
        formData[field as keyof CampaignFormData]?.toString().trim()
      );
    }
    
    // Step 3: Require image to be uploaded for form to be valid
    if (currentStep === 3) {
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-yellow-700 font-medium">New Business</p>
                </div>
                <p className="text-yellow-600 text-sm mt-1">
                  We'll register your business profile when you create your first campaign.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Expand Our Eco-Friendly Product Line"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
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
                  placeholder="Tell us about your business, industry, and what makes you unique..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be used for your business profile
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

        {/* Step 2: Funding Details */}
        {currentStep === 2 && (
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

        {/* Step 3: Terms & Image */}
        {currentStep === 3 && (
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