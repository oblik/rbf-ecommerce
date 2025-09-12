'use client';

import { useAccount } from 'wagmi';
import { BusinessProfile } from '@/components/BusinessProfile';
import { useBusinessRegistry } from '@/hooks/useBusinessRegistry';
import { useState } from 'react';
import Link from 'next/link';

interface BusinessParams {
  name: string;
  metadataURI: string;
}

interface BusinessRegistrationFormProps {
  onRegister: (params: BusinessParams) => void;
  isPending: boolean;
}

function BusinessRegistrationForm({ onRegister, isPending }: BusinessRegistrationFormProps) {
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    website: '',
    industry: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const metadata = {
      name: formData.businessName,
      description: formData.description,
      website: formData.website,
      industry: formData.industry,
      image: '',
      external_url: formData.website,
    };

    onRegister({
      name: formData.businessName,
      metadataURI: `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Register Your Business</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              id="businessName"
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your business name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of your business"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://your-business.com"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an industry</option>
              <option value="ecommerce">E-commerce</option>
              <option value="retail">Retail</option>
              <option value="saas">SaaS</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending || !formData.businessName.trim()}
            className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Registering...' : 'Register Business'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DashboardActions() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/campaigns/create"
          className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create New Campaign
        </Link>
        <Link
          href="/campaigns"
          className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View My Campaigns
        </Link>
      </div>
    </div>
  );
}

function BusinessInsights() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Business Insights</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
          <div>
            <p className="text-sm font-medium text-blue-900">Improve Your Health Score</p>
            <p className="text-xs text-blue-700">Make on-time payments to increase your rating</p>
          </div>
          <div className="text-cyan-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
          <div>
            <p className="text-sm font-medium text-green-900">Get Verified</p>
            <p className="text-xs text-green-700">Verified businesses get better investment terms</p>
          </div>
          <div className="text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessDashboard() {
  const { address, isConnected } = useAccount();
  const { 
    useIsRegistered, 
    registerBusiness, 
    isPending, 
    isSuccess, 
    error 
  } = useBusinessRegistry();

  const { data: isRegistered, isLoading: registrationLoading } = useIsRegistered(address);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Dashboard</h1>
          <p className="text-gray-600 mb-4">Please connect your wallet to access your business dashboard.</p>
        </div>
      </div>
    );
  }

  if (registrationLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Business Registered Successfully!</h2>
          <p className="text-gray-600 mb-4">Your business is now registered on the platform.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
        <p className="text-gray-600">Manage your business profile and campaigns</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            Error: {error.message || 'Failed to register business'}
          </p>
        </div>
      )}

      {!isRegistered ? (
        <div className="space-y-6">
          <BusinessRegistrationForm 
            onRegister={registerBusiness} 
            isPending={isPending}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardActions />
          <BusinessProfile address={address as string} />
        </div>
      )}
    </div>
  );
}