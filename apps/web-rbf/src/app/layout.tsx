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
      <body className={`${figtree.className} ${nunito.variable} ${uniSans.variable}`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}