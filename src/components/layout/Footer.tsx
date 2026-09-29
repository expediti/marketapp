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
                MARKETUR
              </span>
              <span className="w-2 h-2 rounded-full bg-[#FF5416]" />
            </Link>
            <p className="text-sm text-[#A1A1AA] max-w-sm leading-relaxed">
              Marketur connects businesses that need promotion with creators who can create and promote content. Discover creators, see their work, choose a package, and manage campaigns in one place.
            </p>
            <div className="pt-2 text-xs font-mono text-[#71717A]">
              CURRENCY: INR (₹) • REGION: INDIA MARKET
            </div>
          </div>

          {/* Marketplace Column */}
          <div>
            <h4 className="editorial-label text-white mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  Discover Creators
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing & Fees
                </Link>
              </li>
              <li>
                <Link href="/auth/signup?role=creator" className="hover:text-white transition-colors">
                  Join as Creator
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
                  For Businesses
                </Link>
              </li>
              <li>
                <Link href="/for-creators" className="hover:text-white transition-colors">
                  For Creators
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  Featured Portfolios
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
                  About Marketur
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
                <span className="text-[#71717A] text-xs">Protected Collaboration Guarantee</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A] gap-4">
          <p>© {new Date().getFullYear()} Marketur Technologies India Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#D4D4D8] cursor-pointer">Instagram (Community)</span>
            <span>•</span>
            <span className="hover:text-[#D4D4D8] cursor-pointer">X / Twitter</span>
            <span>•</span>
            <span className="hover:text-[#D4D4D8] cursor-pointer">LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
