'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchModal } from '@/components/layout/SearchModal';
import { Menu, X, Search, User, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, activeRole, signOut } = useMarketplace();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { label: 'Discover', href: '/discover' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'For Advertisers', href: '/for-businesses' },
    { label: 'For Influencers', href: '/for-creators' },
  ];

  const dashboardHref =
    activeRole === 'creator' || activeRole === 'influencer'
      ? '/dashboard/creator'
      : activeRole === 'admin'
      ? '/admin'
      : '/dashboard/business';

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 dark:bg-[#09090B]/95 backdrop-blur border-b border-[#E5E5DE] dark:border-[#27272A] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-[#FF5416] flex items-center justify-center text-white font-mono font-black text-xs shadow-sm">
                M
              </div>
              <span className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#121214] dark:text-white">
                Market My App
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#71717A] dark:text-[#A1A1AA]">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors hover:text-[#121214] dark:hover:text-white py-1 ${
                      isActive
                        ? 'text-[#121214] dark:text-white font-semibold border-b-2 border-[#FF5416]'
                        : ''
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Theme Toggle, Auth Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg border border-[#E5E5DE] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#71717A] hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] transition-colors flex items-center gap-2 text-xs font-mono"
              aria-label="Search niches and categories"
              title="Search influencers (Press /)"
            >
              <Search className="w-4 h-4 text-[#FF5416]" />
              <span className="hidden sm:inline text-[#71717A] dark:text-[#A1A1AA]">Search niches...</span>
            </button>

            {/* Theme Toggle Button (Light / Dark) */}
            <ThemeToggle />

            {/* Desktop Auth CTAs */}
            <div className="hidden sm:flex items-center gap-2 pl-1">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link href={dashboardHref}>
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 border-[#FF5416]/40 hover:border-[#FF5416]">
                      {currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.display_name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-[#FF5416]" />
                      )}
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-xs text-[#71717A] hover:text-red-600 px-2"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-xs text-[#52525B] dark:text-[#A1A1AA] hover:text-[#121214] dark:hover:text-white">
                      <span>Login</span>
                    </Button>
                  </Link>

                  <Link href="/auth/signup">
                    <Button variant="primary" size="sm" className="text-xs px-3.5">
                      <span>Sign Up</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#71717A] hover:text-[#121214] dark:hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#E5E5DE] dark:border-[#27272A] bg-white dark:bg-[#121214] px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#121214] dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E5E5DE] dark:border-[#27272A] flex flex-col gap-2">
              {currentUser ? (
                <>
                  <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Go to Dashboard ({activeRole})
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-red-600"
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
