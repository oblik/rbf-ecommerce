import type { Metadata } from 'next';
import { Figtree, Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';
import Navbar from '@/components/Navbar';

const figtree = Figtree({ subsets: ['latin'] });
export const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

// Note: 'Uni Sans' is not available on Google Fonts, using system fonts fallback
const uniSans = {
  className: '',
  variable: '--font-uni-sans'
};

export const metadata: Metadata = {
  title: 'Jama - Revenue-Based Financing',
  description: 'Fund growing businesses and earn returns from their success through revenue-based financing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${figtree.className} ${nunito.variable} ${uniSans.variable}`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}