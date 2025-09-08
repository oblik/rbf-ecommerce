'use client';

import { useState, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { factoryAbi } from '@/abi/factory';

interface CampaignFormData {
  title: string;
  description: string;
  businessName: string;
  website: string;
  fundingGoal: string;
  fundingPeriodDays: string;
  revenueSharePercent: string;
  repaymentCap: string;
  image?: File;
}

export default function CreateCampaignForm() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    businessName: '',
    website: '',
    fundingGoal: '',
    fundingPeriodDays: '30',
    revenueSharePercent: '5',
    repaymentCap: '1.5',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const uploadMetadata = async (): Promise<string> => {
    // Mock IPFS upload - replace with actual implementation
    const metadata = {
      title: formData.title,
      description: formData.description,
      businessName: formData.businessName,
      website: formData.website,
      image: imagePreview, // In production, upload to IPFS first
      revenueShare: Number(formData.revenueSharePercent),
      repaymentCap: Number(formData.repaymentCap),
      createdAt: new Date().toISOString(),
    };

    // Mock upload to IPFS - returns a hash
    return `ipfs://QmMock${Date.now()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload metadata to IPFS
      const metadataUri = await uploadMetadata();

      // Create campaign on blockchain
      const fundingGoal = parseUnits(formData.fundingGoal, 6); // USDC has 6 decimals
      const revenueShareBP = Math.floor(Number(formData.revenueSharePercent) * 100); // Convert to basis points
      const repaymentCapBP = Math.floor(Number(formData.repaymentCap) * 10000); // Convert to basis points

      writeContract({
        address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
        abi: factoryAbi,
        functionName: 'createCampaign',
        args: [
          metadataUri,
          fundingGoal,
          BigInt(formData.fundingPeriodDays),
          BigInt(revenueShareBP),
          BigInt(repaymentCapBP),
        ],
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Created!</h2>
        <p className="text-gray-600 mb-4">Your RBF campaign has been successfully created and is now live.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          View All Campaigns
        </button>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Business Info', fields: ['title', 'businessName', 'website', 'description'] },
    { id: 2, title: 'Funding Details', fields: ['fundingGoal', 'fundingPeriodDays'] },
    { id: 3, title: 'Terms & Image', fields: ['revenueSharePercent', 'repaymentCap', 'image'] },
  ];

  const currentStepData = steps.find(s => s.id === currentStep);
  const isStepValid = currentStepData?.fields.every(field => 
    field === 'image' ? true : formData[field as keyof CampaignFormData]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
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
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Business Information */}
        {currentStep === 1 && (
          <>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="e.g., GreenTech Solutions Inc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your business, how you'll use the funding, and your growth plans..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              disabled={!isStepValid}
              className={`px-6 py-2 rounded-lg font-medium ${
                isStepValid 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isConnected || isSubmitting || isPending || isConfirming}
              className="px-8 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting || isPending || isConfirming ? 'Creating...' : 'Create Campaign'}
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error.message}</p>
        </div>
      )}
    </div>
  );
}