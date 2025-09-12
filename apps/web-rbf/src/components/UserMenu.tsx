'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useDisconnect } from 'wagmi';

type UserMenuProps = {
  inline?: boolean;
  onItemClick?: () => void;
};

export const UserMenu = ({ inline = false, onItemClick }: UserMenuProps) => {
  const { user, logout } = usePrivy();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get display name from user
  const getDisplayName = () => {
    if (user?.email?.address) {
      return user.email.address.split('@')[0];
    }
    if (user?.wallet?.address) {
      const address = user.wallet.address;
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return 'User';
  };

  const displayName = getDisplayName();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    
    // Only add click outside listener for dropdown version
    if (!inline) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [menuRef, inline]);

  const handleItemClick = () => {
    setMenuOpen(false);
    onItemClick?.();
  };

  // Inline version for mobile
  if (inline) {
    return (
      <div className="space-y-0">
        {/* User info section */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {displayName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            {user?.email?.address && (
              <p className="text-xs text-gray-500 truncate">
                {user.email.address}
              </p>
            )}
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          <Link
            href="/create-campaign"
            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-bold no-underline transition-colors"
            onClick={handleItemClick}
          >
            Start Campaign
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium no-underline transition-colors"
            onClick={handleItemClick}
          >
            Dashboard
          </Link>
          <Link
            href="/portfolio"
            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium no-underline transition-colors"
            onClick={handleItemClick}
          >
            Portfolio
          </Link>
          <Link
            href="/business/dashboard"
            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium no-underline transition-colors"
            onClick={handleItemClick}
          >
            Business Profile
          </Link>
          <button
            onClick={() => {
              logout();
              disconnect();
              handleItemClick();
            }}
            className="w-full text-left block px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center space-x-2 p-1.5 pr-3 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-600"
        aria-label="Open user menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-500 flex items-center justify-center">
          <span className="text-white font-semibold text-xs">
            {displayName.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:flex items-center">
          <span className="text-sm font-medium text-gray-700">
            {displayName}
          </span>
        </div>
      </button>
      {menuOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {displayName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName}
                </p>
                {user?.email?.address && (
                  <p className="text-xs text-gray-500 truncate">
                    {user.email.address}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/portfolio"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            Portfolio
          </Link>
          <Link
            href="/business/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            Business Profile
          </Link>
          <button
            onClick={() => {
              logout();
              disconnect();
              setMenuOpen(false);
            }}
            className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            role="menuitem"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};