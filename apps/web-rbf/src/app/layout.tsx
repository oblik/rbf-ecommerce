import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';
import Navbar from '@/components/Navbar';

const figtree = Figtree({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jama - Crowdfund Your Growth',
  description: 'Crowdfund your growth, repay from existing revenue. No equity dilution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={figtree.className}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}