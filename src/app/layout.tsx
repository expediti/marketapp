import type { Metadata } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { MarketplaceProvider } from '@/lib/store/marketplaceStore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const fontSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const fontDisplay = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Market My App — Influencer Marketing for Apps, Websites & Products',
  description:
    'Discover Indian influencers by niche, audience, reach and budget — and find the right creators to promote your app, website or product.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FBFBFA] dark:bg-[#09090B] text-[#121214] dark:text-[#F4F4F5] font-sans transition-colors duration-200">
        <ThemeProvider>
          <MarketplaceProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </MarketplaceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
