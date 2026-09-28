'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { Lock, ArrowRight } from 'lucide-react';
import { UserRole } from '@/types/marketplace';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useMarketplace();
  const [email, setEmail] = useState('collaborate@kashicraft.in');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('business');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    switchUser(selectedRole);
    if (selectedRole === 'creator') router.push('/dashboard/creator');
    else if (selectedRole === 'admin') router.push('/admin');
    else router.push('/dashboard/business');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      <div className="text-center space-y-2">
        <span className="editorial-label text-[#FF5416]">Account Access</span>
        <h1 className="font-mono text-3xl font-extrabold text-[#121214] tracking-tight">
          Log In to Marketur
        </h1>
        <p className="text-xs text-[#71717A]">
          Access your collaboration workspace, orders, and escrow statements.
        </p>
      </div>

      <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Quick Role Toggle */}
        <div>
          <label className="editorial-label block mb-1.5">Sign In As</label>
          <div className="grid grid-cols-3 gap-1.5 bg-[#F4F4F0] p-1 rounded-md text-xs font-mono">
            {(['business', 'creator', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRole(r);
                  if (r === 'creator') setEmail('creator042@marketur.local');
                  else if (r === 'admin') setEmail('ops@marketur.com');
                  else setEmail('collaborate@kashicraft.in');
                }}
                className={`py-1.5 rounded uppercase font-semibold transition-colors ${
                  selectedRole === r ? 'bg-white text-[#121214] shadow-sm' : 'text-[#71717A]'
                }`}
              >
                {r === 'business' ? 'Business' : r === 'creator' ? 'Creator' : 'Admin'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#121214] block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#121214]">Password</label>
              <span className="text-[11px] text-[#71717A] hover:underline cursor-pointer">
                Forgot?
              </span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            <span>Log In</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <div className="text-center text-xs font-mono text-[#71717A]">
        Don&apos;t have an account yet?{' '}
        <Link href="/auth/signup" className="text-[#FF5416] font-bold hover:underline">
          Select Role to Sign Up
        </Link>
      </div>
    </div>
  );
}
