'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { UserMenu } from './UserMenu';

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { ready, authenticated, login } = usePrivy();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Navbar */}
        <div className="md:hidden flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <span className="text-4xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent font-uni-sans" style={{ fontWeight: 900 }}>Jama</span>
          </Link>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* Mobile Menu Slide-out Panel */}
        <>
          {/* Backdrop */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-10 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          
          {/* Sliding Panel */}
          <div 
            ref={mobileMenuRef}
            className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full bg-white">
              {/* Header with close button */}
              <div className="flex justify-end p-4 bg-white">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
              </div>
              
              {/* Menu Content */}
              <div className="flex-1 px-6 py-4 bg-white">
                <div className="space-y-4">
                  {/* User authentication section */}
                  <div className="w-full">
                    {!ready ? (
                      <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
                    ) : authenticated ? (
                      <UserMenu inline={true} onItemClick={() => setMobileMenuOpen(false)} />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          login();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-5 border border-gray-200 rounded-xl shadow-sm transition-colors"
                      >
                        Sign in
                      </button>
                    )}
                  </div>
                  
                  {/* Start Campaign button - only show when not authenticated */}
                  {!authenticated && (
                    <div className="w-full">
                      <Link
                        href="/create-campaign"
                        className="block px-4 py-3 text-center bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl no-underline transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>

        {/* Desktop Navbar */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-4xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent font-uni-sans" style={{ fontWeight: 900 }}>Jama</span>
            </Link>
          </div>

          {/* Right: Start Campaign, Auth Buttons and User Menu */}
          <div className="flex-shrink-0 flex items-center space-x-3">
            <Link href="/create-campaign" className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors duration-200">
              Get Started
            </Link>
            {!ready ? (
              <div className="w-20 h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : authenticated ? (
              <UserMenu />
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  login();
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 border border-gray-200 rounded-xl shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-opacity-20"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}