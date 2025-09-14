"use client";

import FundingRequestList from "@/components/FundingRequestList";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Funding Requests</h2>
        <FundingRequestList />
      </div>
    </main>
  );
}