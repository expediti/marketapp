import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#121214] text-[#D4D4D8] border-t border-[#27272A] pt-14 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#27272A]">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="font-mono text-xl font-bold tracking-tight text-white">
                MARKET MY APP
              </span>
              <span className="w-2 h-2 rounded-full bg-[#FF5416]" />
            </Link>
            <p className="text-sm text-[#A1A1AA] max-w-sm leading-relaxed">
              Market your app or website to a wider audience through influencers. Discover Indian creators by niche, audience, reach and budget — and find the right creators to promote your app, website or product.
            </p>
            <div className="pt-2 text-xs font-mono text-[#71717A]">
              CURRENCY: INR (₹) • REGION: INDIAN INFLUENCER MARKETPLACE
            </div>
          </div>

          {/* Marketplace Column */}
          <div>
            <h4 className="editorial-label text-white mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  Discover Influencers
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing & Packages
                </Link>
              </li>
              <li>
                <Link href="/auth/signup?role=influencer" className="hover:text-white transition-colors">
                  Join as an Influencer
                </Link>
              </li>
            </ul>
          </div>

          {/* Stakeholders Column */}
          <div>
            <h4 className="editorial-label text-white mb-4">Solutions</h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link href="/for-businesses" className="hover:text-white transition-colors">
                  For Advertisers
                </Link>
              </li>
              <li>
                <Link href="/for-creators" className="hover:text-white transition-colors">
                  For Influencers
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  Featured App Promos
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="editorial-label text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#71717A]">
          <div>
            © {new Date().getFullYear()} Market My Idea. Dedicated Indian Influencer Marketing Marketplace.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-[#A1A1AA] transition-colors">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-[#A1A1AA] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#A1A1AA] transition-colors">
              Privacy
            </Link>
            <Link href="/refund-policy" className="hover:text-[#A1A1AA] transition-colors">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
