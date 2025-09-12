'use client';

import { useState } from 'react';
import { BUSINESS_VERTICALS, type BusinessVertical } from '@/lib/business-verticals';

interface VerticalSelectorProps {
  value: string;
  onChange: (verticalId: string) => void;
  disabled?: boolean;
  showDescription?: boolean;
}

export default function VerticalSelector({ 
  value, 
  onChange, 
  disabled = false, 
  showDescription = false 
}: VerticalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedVertical = BUSINESS_VERTICALS.find(v => v.id === value);

  const handleSelect = (vertical: BusinessVertical) => {
    onChange(vertical.id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Business Vertical
        <span className="text-red-500 ml-1">*</span>
      </label>
      
      {/* Custom Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50'
        } ${
          selectedVertical 
            ? 'border-gray-300' 
            : 'border-red-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedVertical ? (
              <>
                <span className="text-lg">{selectedVertical.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedVertical.name}
                  </div>
                  {showDescription && (
                    <div className="text-sm text-gray-500">
                      {selectedVertical.description}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-gray-500">Select your business vertical...</span>
            )}
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {BUSINESS_VERTICALS.map((vertical) => (
            <button
              key={vertical.id}
              type="button"
              onClick={() => handleSelect(vertical)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                value === vertical.id ? 'bg-sky-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{vertical.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    {vertical.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {vertical.description}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Margins:</span>
                      <span className="font-medium text-green-600">
                        {vertical.typicalMargins.min}%-{vertical.typicalMargins.max}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Avg:</span>
                      <span className="font-medium text-blue-600">
                        {vertical.typicalMargins.average}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function VerticalBadge({ verticalId, size = 'md' }: { verticalId: string; size?: 'sm' | 'md' | 'lg' }) {
  const vertical = BUSINESS_VERTICALS.find(v => v.id === verticalId);
  if (!vertical) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${vertical.color} ${sizeClasses[size]}`}>
      <span>{vertical.icon}</span>
      <span>{vertical.name}</span>
    </span>
  );
}