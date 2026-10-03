'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  Film,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check,
} from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const roleParam = searchParams.get('role');

  const { switchUser, refreshData } = useMarketplace();

  // Normalize role from query parameter
  const getInitialRole = (): 'creator' | 'business' => {
    if (!roleParam) return 'creator';
    const lower = roleParam.toLowerCase();
    if (lower === 'business' || lower === 'owner' || lower === 'advertiser') {
      return 'business';
    }
    return 'creator';
  };

  const [selectedRole, setSelectedRole] = useState<'creator' | 'business'>(getInitialRole);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorParam);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync role if query parameter changes
  useEffect(() => {
    if (roleParam) {
      const lower = roleParam.toLowerCase();
      if (lower === 'business' || lower === 'owner' || lower === 'advertiser') {
        setSelectedRole('business');
      } else if (lower === 'creator' || lower === 'influencer') {
        setSelectedRole('creator');
      }
    }
  }, [roleParam]);

  const handleGoogleAuth = async (overrideRole?: 'creator' | 'business') => {
    const roleToUse = overrideRole || selectedRole;
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase credentials are not configured in environment variables. Please check NEXT_PUBLIC_SUPABASE_URL.'
        );
      }

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('marketur_role_intent', roleToUse);
          document.cookie = `marketur_role_intent=${encodeURIComponent(
            roleToUse
          )}; path=/; max-age=600; SameSite=Lax`;
        } catch {
          // Ignore storage errors
        }
      }

      const redirectUrl = `${window.location.origin}/auth/callback?role=${encodeURIComponent(
        roleToUse
      )}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      console.error('Google Sign-up failed:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to connect with Google. Please try again.';
      setErrorMessage(message);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsEmailLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase credentials are not configured. Please check environment variables.'
        );
      }

      const finalDisplayName = displayName.trim() || email.split('@')[0];

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: finalDisplayName,
            role: selectedRole,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Upsert user profile
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email || email,
            display_name: finalDisplayName,
            role: selectedRole,
          },
          { onConflict: 'id' }
        );

        if (data.session) {
          switchUser(selectedRole);
          await refreshData();

          if (selectedRole === 'creator') {
            const { data: creatorProfile } = await supabase
              .from('creator_profiles')
              .select('user_id')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (creatorProfile) {
              router.replace('/dashboard/creator');
            } else {
              router.replace('/auth/onboarding/creator');
            }
          } else {
            const { data: businessProfile } = await supabase
              .from('business_profiles')
              .select('user_id')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (businessProfile) {
              router.replace('/dashboard/business');
            } else {
              router.replace('/auth/onboarding/business');
            }
          }
          return;
        } else {
          // Email confirmation is required by Supabase auth configuration
          setSuccessNotice(
            'Account created successfully! Please check your email to confirm your account, then log in.'
          );
        }
      }
    } catch (err: unknown) {
      console.error('Email sign-up failed:', err);
      const message =
        err instanceof Error ? err.message : 'Sign-up failed. Please check your details.';
      setErrorMessage(message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="editorial-label text-[#FF5416]">Market My App</span>
        <h1 className="font-mono text-3xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Create Your Account
        </h1>
        <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto">
          Connect with Indian creators and businesses for high-converting app promotions.
        </p>
      </div>

      {/* Role Switcher Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A] dark:text-zinc-400 block text-center">
          Select Account Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Creator / Influencer Option */}
          <button
            type="button"
            onClick={() => setSelectedRole('creator')}
            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
              selectedRole === 'creator'
                ? 'border-[#FF5416] bg-[#FFF2EC]/40 dark:bg-[#27140B]/50 ring-1 ring-[#FF5416]'
                : 'border-[#E5E5DE] dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-[#FF5416]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedRole === 'creator'
                    ? 'bg-[#FF5416] text-white'
                    : 'bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300'
                }`}
              >
                <Film className="w-4 h-4" />
              </div>
              {selectedRole === 'creator' && (
                <span className="w-4 h-4 rounded-full bg-[#FF5416] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                Influencer / Creator
              </h3>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5 leading-snug">
                Earn from app sponsorships & show reels
              </p>
            </div>
          </button>

          {/* Business / Owner Option */}
          <button
            type="button"
            onClick={() => setSelectedRole('business')}
            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
              selectedRole === 'business'
                ? 'border-[#FF5416] bg-[#FFF2EC]/40 dark:bg-[#27140B]/50 ring-1 ring-[#FF5416]'
                : 'border-[#E5E5DE] dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-[#FF5416]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedRole === 'business'
                    ? 'bg-[#FF5416] text-white'
                    : 'bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              {selectedRole === 'business' && (
                <span className="w-4 h-4 rounded-full bg-[#FF5416] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                Owner / Business
              </h3>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5 leading-snug">
                Market your app, SaaS or product
              </p>
            </div>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{successNotice}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Primary SSO: Continue with Google */}
        <div>
          <button
            type="button"
            onClick={() => handleGoogleAuth()}
            disabled={isGoogleLoading || isEmailLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 hover:border-[#121214] dark:hover:border-zinc-500 rounded-lg text-xs font-mono font-bold text-[#121214] dark:text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FF5416]" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>
                  Continue with Google as{' '}
                  {selectedRole === 'creator' ? 'Influencer' : 'Owner'}
                </span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-[#71717A] dark:text-zinc-400 mt-2">
            One-click signup. You will proceed to{' '}
            {selectedRole === 'creator' ? 'influencer' : 'business'} onboarding.
          </p>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E5E5DE] dark:border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-[#71717A] dark:text-zinc-500">
            or sign up with email
          </span>
          <div className="flex-grow border-t border-[#E5E5DE] dark:border-zinc-800"></div>
        </div>

        {/* Email & Password Signup Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
              {selectedRole === 'creator' ? 'Creator / Channel Name' : 'Company / App Name'}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={selectedRole === 'creator' ? 'e.g. Rahul Tech' : 'e.g. Acme App Inc.'}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={isEmailLoading || isGoogleLoading}
          >
            {isEmailLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              <>
                <span>
                  Join as {selectedRole === 'creator' ? 'Influencer' : 'Owner'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="text-center text-xs font-mono text-[#71717A] dark:text-zinc-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#FF5416] hover:underline font-bold">
          Log In
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#FF5416] animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
