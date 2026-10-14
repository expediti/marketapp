import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';
import { MapPin, Mail, User } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#121214] text-[#D4D4D8] border-t border-[#27272A] pt-14 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#27272A]">
          {/* Brand info & Verified Identity */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center group">
              <BrandLogo variant="dark" size="lg" priority />
            </Link>
            <p className="text-sm text-[#A1A1AA] max-w-sm leading-relaxed">
              Audience distribution and influencer marketing marketplace connecting developers, founders, and businesses with authentic creators and communities.
            </p>
            <div className="pt-2 space-y-1.5 text-xs font-mono text-[#71717A]">
              <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                <User className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
                <span>Legal Operator: <strong className="text-white">{BUSINESS_INFO.proprietorName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                <MapPin className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
                <span>{BUSINESS_INFO.address.fullDisplayAddress}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                <Mail className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
                <a
                  href={`mailto:${BUSINESS_INFO.contact.officialEmail}`}
                  className="hover:text-white transition-colors underline"
                >
                  {BUSINESS_INFO.contact.officialEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Directory Column */}
          <div>
            <h4 className="editorial-label text-white mb-4">Distribution</h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  Find Your Audience
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing & Economics
                </Link>
              </li>
              <li>
                <Link href="/auth/signup?role=creator" className="hover:text-white transition-colors">
                  Join as Distribution Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <h4 className="editorial-label text-white mb-4">Solutions</h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link href="/for-businesses" className="hover:text-white transition-colors">
                  For Founders & Businesses
                </Link>
              </li>
              <li>
                <Link href="/for-creators" className="hover:text-white transition-colors">
                  For Creators & Communities
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  Featured Product Promos
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal Column */}
          <div>
            <h4 className="editorial-label text-white mb-4">Legal & Compliance</h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
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
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/grievance" className="hover:text-white transition-colors">
                  Grievance Redressal
                </Link>
              </li>
              <li>
                <Link href="/delete-account" className="hover:text-white transition-colors">
                  Delete Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#71717A]">
          <div>
            © {new Date().getFullYear()} {BUSINESS_INFO.brandName}. Operated by {BUSINESS_INFO.proprietorName}. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
            <Link href="/shipping-policy" className="hover:text-[#A1A1AA] transition-colors">
              Shipping
            </Link>
            <Link href="/grievance" className="hover:text-[#A1A1AA] transition-colors">
              Grievance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
