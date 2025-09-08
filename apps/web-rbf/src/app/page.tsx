"use client";

import FundingRequestList from "@/components/FundingRequestList";
import Hero from "@/components/Hero";
import ConnectWallet from "@/components/ConnectWallet";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">RBF Protocol</h1>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </nav>
      
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Funding Requests</h2>
        <FundingRequestList />
      </div>
    </main>
  );
}