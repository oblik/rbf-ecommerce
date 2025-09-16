import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
        nunito: ['var(--font-nunito)', 'sans-serif'],
        'uni-sans': ['Uni Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // RBF Brand Colors - Replace hardcoded blues
        primary: {
          50: '#f0f9ff',   // Very light blue for backgrounds
          100: '#e0f2fe',  // Light blue for subtle highlights  
          200: '#bae6fd',  // Light blue for borders
          300: '#7dd3fc',  // Medium light blue
          400: '#38bdf8',  // Medium blue
          500: '#0ea5e9',  // Main brand blue (sky-500)
          600: '#0284c7',  // Primary button blue (sky-600)
          700: '#0369a1',  // Hover state blue (sky-700)
          800: '#075985',  // Dark blue for text
          900: '#0c4a6e',  // Very dark blue
        },
        secondary: {
          50: '#f0fdf4',   // Very light green
          100: '#dcfce7',  // Light green backgrounds
          200: '#bbf7d0',  // Light green borders
          300: '#86efac',  // Medium light green
          400: '#4ade80',  // Medium green
          500: '#10b981',  // Success green (emerald-500)
          600: '#16a34a',  // Success button green
          700: '#15803d',  // Success hover green
          800: '#166534',  // Dark green text
          900: '#14532d',  // Very dark green
        },
        accent: {
          50: '#fffbeb',   // Very light amber
          100: '#fef3c7',  // Light amber backgrounds
          200: '#fde68a',  // Light amber borders
          300: '#fcd34d',  // Medium light amber
          400: '#fbbf24',  // Medium amber
          500: '#f59e0b',  // Warning amber (amber-500)
          600: '#d97706',  // Warning button amber
          700: '#b45309',  // Warning hover amber
          800: '#92400e',  // Dark amber text
          900: '#78350f',  // Very dark amber
        },
        danger: {
          50: '#fef2f2',   // Very light red
          100: '#fee2e2',  // Light red backgrounds
          200: '#fecaca',  // Light red borders
          300: '#fca5a5',  // Medium light red
          400: '#f87171',  // Medium red
          500: '#ef4444',  // Error red (red-500)
          600: '#dc2626',  // Error button red
          700: '#b91c1c',  // Error hover red
          800: '#991b1b',  // Dark red text
          900: '#7f1d1d',  // Very dark red
        },
        // Keep the green as an alias for secondary
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
};

export default config;