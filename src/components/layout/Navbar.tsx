'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Creators', href: '/discover' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'For Businesses', href: '/for-businesses' },
    { label: 'For Creators', href: '/for-creators' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 backdrop-blur border-b border-[#E5E5DE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="font-mono text-xl font-bold tracking-tight text-[#121214]">
              MARKETUR
            </span>
            <span className="w-2 h-2 rounded-full bg-[#FF5416] group-hover:scale-125 transition-transform" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#71717A]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-[#121214] py-1 ${
                    isActive ? 'text-[#121214] font-semibold border-b-2 border-[#FF5416]' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-[#52525B] hover:text-[#121214]">
              <span>Log in</span>
            </Button>
          </Link>

          <Link href="/auth/signup">
            <Button variant="primary" size="sm">
              <span>Get started</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <Link href="/auth/signup">
            <Button variant="primary" size="sm">
              Get started
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#71717A] hover:text-[#121214] focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E5DE] bg-white px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[#71717A] hover:text-[#121214]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E5E5DE] flex flex-col gap-2">
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                Log in
              </Button>
            </Link>
            <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="sm" className="w-full">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
