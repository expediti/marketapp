'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { Lock, ArrowRight, Smartphone, Sparkles } from 'lucide-react';
import { UserRole } from '@/types/marketplace';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useMarketplace();
  const [email, setEmail] = useState('advertiser@marketmyapp.in');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'advertiser' | 'influencer' | 'admin'>('advertiser');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'influencer') {
      switchUser('creator');
      router.push('/dashboard/creator');
    } else if (selectedRole === 'admin') {
      switchUser('admin');
      router.push('/admin');
    } else {
      switchUser('business');
      router.push('/dashboard/business');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      <div className="text-center space-y-2">
        <span className="editorial-label text-[#FF5416]">Account Access</span>
        <h1 className="font-mono text-3xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Log In to Market My App
        </h1>
        <p className="text-xs text-[#71717A] dark:text-zinc-400">
          Access your campaign workspace, collaboration requests, and reels.
        </p>
      </div>

      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-5 shadow-sm">
        {/* Role Toggle */}
        <div>
          <label className="editorial-label block mb-1.5">Sign In As</label>
          <div className="grid grid-cols-3 gap-1.5 bg-[#F4F4F0] dark:bg-zinc-900 p-1 rounded-md text-xs font-mono">
            {(['advertiser', 'influencer', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRole(r);
                  if (r === 'influencer') setEmail('creator@marketmyapp.in');
                  else if (r === 'admin') setEmail('admin@marketmyapp.in');
                  else setEmail('advertiser@marketmyapp.in');
                }}
                className={`py-1.5 rounded uppercase font-semibold transition-colors ${
                  selectedRole === r
                    ? 'bg-white dark:bg-zinc-800 text-[#121214] dark:text-white shadow-sm'
                    : 'text-[#71717A] dark:text-zinc-400'
                }`}
              >
                {r === 'advertiser' ? 'Advertiser' : r === 'influencer' ? 'Influencer' : 'Admin'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#121214] dark:text-white">Password</label>
              <span className="text-[11px] text-[#71717A] dark:text-zinc-400 hover:underline cursor-pointer">
                Forgot?
              </span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            <span>Log In</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>
      </div>

      <div className="text-center text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <span>Don't have an account? </span>
        <Link href="/auth/signup" className="text-[#FF5416] hover:underline font-bold">
          Sign up
        </Link>
      </div>
    </div>
  );
}
