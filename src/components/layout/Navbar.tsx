'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchModal } from '@/components/layout/SearchModal';
import {
  Menu,
  X,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Layers,
  ShoppingBag,
  MessageSquare,
  Building,
} from 'lucide-react';

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, activeRole, signOut, authInitialized } = useMarketplace();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRole = (currentUser?.role || activeRole || '').toLowerCase();
  const isCreator = userRole === 'creator' || userRole === 'influencer';
  const isBusiness = userRole === 'business' || userRole === 'advertiser';

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Single primary navigation system
  const navLinks = currentUser && (isCreator || isBusiness)
    ? isCreator
      ? [
          { label: 'Home', href: '/dashboard/creator?tab=home', tab: 'home' },
          { label: 'Discover', href: '/discover' },
          { label: 'Orders', href: '/dashboard/creator?tab=orders', tab: 'orders' },
          { label: 'Messages', href: '/dashboard/creator?tab=messages', tab: 'messages' },
          { label: 'Profile', href: '/dashboard/creator?tab=profile', tab: 'profile' },
        ]
      : [
          { label: 'Home', href: '/dashboard/business?tab=home', tab: 'home' },
          { label: 'Discover', href: '/discover' },
          { label: 'Orders', href: '/dashboard/business?tab=orders', tab: 'orders' },
          { label: 'Messages', href: '/dashboard/business?tab=messages', tab: 'messages' },
          { label: 'Business', href: '/dashboard/business?tab=profile', tab: 'profile' },
        ]
    : [
        { label: 'Discover', href: '/discover' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'For Businesses', href: '/for-businesses' },
        { label: 'For Creators', href: '/for-creators' },
        { label: 'Pricing', href: '/pricing' },
      ];

  const dashboardHref = isCreator
    ? '/dashboard/creator?tab=home'
    : isBusiness
    ? '/dashboard/business?tab=home'
    : currentUser
    ? '/auth/role-select'
    : '/';

  const handleSignOut = async () => {
    setAccountDropdownOpen(false);
    try {
      await signOut();
    } finally {
      router.replace('/');
    }
  };

  const isLinkActive = (link: { href: string; tab?: string }) => {
    const currentTab = searchParams ? searchParams.get('tab') || 'home' : 'home';
    const linkBase = link.href.split('?')[0];

    if (linkBase === '/discover' && pathname === '/discover') return true;
    if (link.tab && pathname.startsWith('/dashboard/')) {
      return currentTab === link.tab;
    }
    return pathname === linkBase && !(searchParams && searchParams.get('tab'));
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 dark:bg-[#09090B]/95 backdrop-blur border-b border-[#E5E5DE] dark:border-[#27272A] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Primary Nav */}
          <div className="flex items-center gap-8">
            <Link href={currentUser ? dashboardHref : '/'} className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-[#FF5416] flex items-center justify-center text-white font-mono font-black text-xs shadow-xs">
                M
              </div>
              <span className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#121214] dark:text-white">
                Market My App
              </span>
            </Link>

            {/* Single Primary Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#71717A] dark:text-[#A1A1AA]">
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors py-1 ${
                      active
                        ? 'text-[#121214] dark:text-white font-bold border-b-2 border-[#FF5416]'
                        : 'hover:text-[#121214] dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Theme Toggle, Auth / Account Menu */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg border border-[#E5E5DE] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#71717A] hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] transition-colors flex items-center gap-2 text-xs font-mono"
              aria-label="Search audience categories"
              title="Search audiences and niches (Press /)"
            >
              <Search className="w-4 h-4 text-[#FF5416]" />
              <span className="hidden sm:inline text-[#71717A] dark:text-[#A1A1AA]">
                Search audiences...
              </span>
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Desktop Auth / Account Menu */}
            <div className="hidden sm:flex items-center gap-2 pl-1 relative" ref={dropdownRef}>
              {authInitialized ? (
                currentUser ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E5E5DE] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-[#121214] dark:hover:border-white transition-colors cursor-pointer text-xs font-mono"
                    >
                      {currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.display_name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#121214] text-white dark:bg-white dark:text-[#121214] flex items-center justify-center text-[10px] font-bold">
                          {(currentUser.display_name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-[#121214] dark:text-white max-w-[110px] truncate">
                        {currentUser.display_name || 'Account'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
                    </button>

                    {/* Account Menu Dropdown */}
                    {accountDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl shadow-xl py-2 z-50 animate-in fade-in-50 duration-100 font-mono text-xs">
                        <div className="px-3 py-2 border-b border-[#ECECE6] dark:border-[#27272A] space-y-0.5">
                          <p className="font-bold text-[#121214] dark:text-white truncate">
                            {currentUser.display_name}
                          </p>
                          <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase">
                            {isBusiness ? 'Business / Founder' : isCreator ? 'Creator / Community' : 'User'}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            href={dashboardHref}
                            onClick={() => setAccountDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] hover:text-[#121214] dark:hover:text-white"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#FF5416]" />
                            <span>Workspace Overview</span>
                          </Link>

                          {isBusiness && (
                            <>
                              <Link
                                href="/dashboard/business?tab=profile"
                                onClick={() => setAccountDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] hover:text-[#121214] dark:hover:text-white"
                              >
                                <Building className="w-3.5 h-3.5 text-[#71717A]" />
                                <span>Business Profile</span>
                              </Link>
                              <Link
                                href="/dashboard/business?tab=settings"
                                onClick={() => setAccountDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] hover:text-[#121214] dark:hover:text-white"
                              >
                                <Settings className="w-3.5 h-3.5 text-[#71717A]" />
                                <span>Campaigns & Settings</span>
                              </Link>
                            </>
                          )}

                          {isCreator && (
                            <>
                              <Link
                                href="/dashboard/creator?tab=profile"
                                onClick={() => setAccountDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] hover:text-[#121214] dark:hover:text-white"
                              >
                                <User className="w-3.5 h-3.5 text-[#71717A]" />
                                <span>Creator Profile</span>
                              </Link>
                              <Link
                                href="/dashboard/creator?tab=settings"
                                onClick={() => setAccountDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] hover:text-[#121214] dark:hover:text-white"
                              >
                                <Settings className="w-3.5 h-3.5 text-[#71717A]" />
                                <span>Settings & Payouts</span>
                              </Link>
                            </>
                          )}
                        </div>

                        <div className="pt-1 border-t border-[#ECECE6] dark:border-[#27272A]">
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#52525B] dark:text-[#A1A1AA] hover:text-[#121214] dark:hover:text-white"
                      >
                        <span>Login</span>
                      </Button>
                    </Link>

                    <Link href="/auth/signup">
                      <Button variant="primary" size="sm" className="text-xs px-3.5">
                        <span>Sign Up</span>
                      </Button>
                    </Link>
                  </>
                )
              ) : (
                <div className="w-24 h-8" />
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
              {authInitialized ? (
                currentUser ? (
                  <>
                    <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full">
                        Workspace ({currentUser.display_name || currentUser.role})
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
                )
              ) : (
                <div className="py-2 text-center text-xs text-[#71717A] font-mono">
                  Loading...
                </div>
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

export function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 dark:bg-[#09090B]/95 border-b border-[#E5E5DE] dark:border-[#27272A] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5416] flex items-center justify-center text-white font-mono font-black text-xs">
              M
            </div>
            <span className="font-mono text-lg font-bold">Market My App</span>
          </div>
        </header>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
