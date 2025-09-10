'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import ConnectWallet from './ConnectWallet';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { authenticated } = usePrivy();
  const { address } = useAccount();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RevFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
              Explore
            </Link>
            <Link href="/create-campaign" className="text-gray-700 hover:text-gray-900 font-medium">
              Start Campaign
            </Link>
            {authenticated && (
              <>
                <Link href="/portfolio" className="text-gray-700 hover:text-gray-900 font-medium">
                  Portfolio
                </Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                  Dashboard
                </Link>
                <Link href="/business/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                  Business Profile
                </Link>
              </>
            )}
            <ConnectWallet />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                Explore
              </Link>
              <Link href="/create-campaign" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                Start Campaign
              </Link>
              {authenticated && (
                <>
                  <Link href="/portfolio" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                    Portfolio
                  </Link>
                  <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                    Dashboard
                  </Link>
                  <Link href="/business/dashboard" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                    Business Profile
                  </Link>
                </>
              )}
              <div className="py-2">
                <ConnectWallet />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}