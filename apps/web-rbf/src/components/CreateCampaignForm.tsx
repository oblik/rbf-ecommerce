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
      const requiredFields = ['title', 'businessName', 'vertical'];
      const requiredMetadata = ['businessDescription'];
      
      const formFieldsValid = requiredFields.every(field => 
        formData[field as keyof CampaignFormData]?.toString().trim()
      );
      
      const metadataFieldsValid = requiredMetadata.every(field =>
        businessMetadata[field as keyof typeof businessMetadata]?.toString().trim()
      );
      
      return formFieldsValid && metadataFieldsValid;
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
                About Your Business
              </label>
              <textarea
                name="businessDescription"
                value={businessMetadata.businessDescription}
                onChange={handleBusinessMetadataChange}
                rows={4}
                placeholder="Tell your story: What does your business do? How long have you been operating? What makes you unique? Why should the community support your growth?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Help funders understand your business, your journey, and your vision for the future
              </p>
            </div>

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

            {/* Business Vertical Selector */}
            <VerticalSelector
              value={formData.vertical}
              onChange={(verticalId) => setFormData(prev => ({ ...prev, vertical: verticalId }))}
              showDescription={true}
            />
          </>
        )}

        {/* Step 2: Social Capital */}
        {currentStep === 2 && (
          <>
            {/* Shopify OAuth Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.8 6.504c-.603-.66-1.347-1.074-2.231-1.244V4.97c0-.055-.044-.1-.1-.1h-.68c-.055 0-.1.044-.1.1v.29c-1.316.013-2.6.604-2.6 2.08 0 1.76 1.694 2.186 2.6 2.39v2.606c-.55-.13-1.08-.38-1.494-.65-.064-.042-.15-.026-.192.035l-.337.487c-.042.06-.026.143.035.185.605.424 1.347.714 2.146.782v.416c0 .055.045.1.1.1h.68c.055 0 .1-.045.1-.1v-.387c1.395-.043 2.688-.688 2.688-2.234 0-1.77-1.743-2.226-2.688-2.452V6.787c.462.103.875.282 1.194.486.062.04.144.02.185-.04l.298-.44c.04-.06.022-.142-.038-.18zm-3.15 1.95c-.606-.183-.99-.39-.99-.84 0-.463.395-.714.99-.714v1.554zm1.34 2.876c0 .496-.43.795-1.04.795V9.743c.64.196 1.04.416 1.04.887z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Connect Your Shopify Store</h3>
                  <p className="text-sm text-green-700">Verify your business performance and revenue data to build credibility</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-sky-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 fill-[#95BF47]" viewBox="0 0 24 24">
                      <path d="M14.8 6.504c-.603-.66-1.347-1.074-2.231-1.244V4.97c0-.055-.044-.1-.1-.1h-.68c-.055 0-.1.044-.1.1v.29c-1.316.013-2.6.604-2.6 2.08 0 1.76 1.694 2.186 2.6 2.39v2.606c-.55-.13-1.08-.38-1.494-.65-.064-.042-.15-.026-.192.035l-.337.487c-.042.06-.026.143.035.185.605.424 1.347.714 2.146.782v.416c0 .055.045.1.1.1h.68c.055 0 .1-.045.1-.1v-.387c1.395-.043 2.688-.688 2.688-2.234 0-1.77-1.743-2.226-2.688-2.452V6.787c.462.103.875.282 1.194.486.062.04.144.02.185-.04l.298-.44c.04-.06.022-.142-.038-.18zm-3.15 1.95c-.606-.183-.99-.39-.99-.84 0-.463.395-.714.99-.714v1.554zm1.34 2.876c0 .496-.43.795-1.04.795V9.743c.64.196 1.04.416 1.04.887z"/>
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Shopify Store Integration</h4>
                      <p className="text-xs text-gray-500">Securely connect to verify sales data and business metrics</p>
                    </div>
                  </div>
                  <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                    Connect
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-green-700">
                    <strong>Boost credibility:</strong> Verified revenue data helps funders understand your business performance and growth potential.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sky-900">Connect Your Socials</h3>
                  <p className="text-sm text-sky-700">Link your social media accounts to showcase your network and community trust</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 1000 1000" fill="currentColor">
                        <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" fill="#855DCD"/>
                        <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" fill="#855DCD"/>
                        <path d="M675.555 746.667C663.282 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.444H875.555V817.778C875.555 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.555Z" fill="#855DCD"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Farcaster</h4>
                        <p className="text-xs text-gray-500">Connect with crypto and web3 community</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Facebook</h4>
                        <p className="text-xs text-gray-500">Connect your Facebook profile</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">X (Twitter)</h4>
                        <p className="text-xs text-gray-500">Connect your X/Twitter account</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-[#00A8E8]" viewBox="0 0 24 24">
                        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.06-.138.017-.277.036-.415.056-2.67-.297-5.568.628-6.383 3.364C.378 17.85 0 22.81 0 23.5c0 .688.139 1.86.902 2.203.659.299 1.664.621 4.3-1.24 2.752-1.942 5.711-5.881 6.798-7.995C13.087 18.582 16.046 22.521 18.798 24.463c2.636 1.861 3.641 1.539 4.3 1.24.763-.343.902-1.515.902-2.203 0-.69-.378-5.65-.624-6.479-.815-2.736-3.713-3.661-6.383-3.364-.138-.02-.277-.039-.415-.056.138.017.277.036.415.056 2.67.297 5.568-.628 6.383-3.364C23.622 9.42 24 4.46 24 3.772c0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.751 13.087 8.69 12 10.804z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Bluesky</h4>
                        <p className="text-xs text-gray-500">Connect to the decentralized social network</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-[#0A66C2]" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">LinkedIn</h4>
                        <p className="text-xs text-gray-500">Connect your professional network</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-[#E4405F]" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Instagram</h4>
                        <p className="text-xs text-gray-500">Showcase your brand visually</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-[#000000]" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">TikTok</h4>
                        <p className="text-xs text-gray-500">Connect with younger audiences</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-[#5865F2]" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Discord</h4>
                        <p className="text-xs text-gray-500">Build and engage your community</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 fill-[#FF0000]" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">YouTube</h4>
                        <p className="text-xs text-gray-500">Share video content and tutorials</p>
                      </div>
                    </div>
                    <button className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors">
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