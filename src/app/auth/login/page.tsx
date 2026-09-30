'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const { switchUser, refreshData } = useMarketplace();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(errorParam);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase credentials are not configured in environment variables. Please check NEXT_PUBLIC_SUPABASE_URL.'
        );
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;

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
      console.error('Google Sign-in failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to initialize Google authentication.';
      setAuthError(message);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setAuthError(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase authentication is not configured. Please check environment variables.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch role from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile?.role) {
          router.push('/auth/role-select');
          return;
        }

        await refreshData();
        const role = profile.role.toLowerCase();
        if (role === 'creator' || role === 'influencer') {
          switchUser('creator');
          router.push('/dashboard/creator');
        } else if (role === 'business' || role === 'advertiser') {
          switchUser('business');
          router.push('/dashboard/business');
        } else if (role === 'admin') {
          switchUser('admin');
          router.push('/admin');
        } else {
          router.push('/auth/role-select');
        }
      }
    } catch (err: unknown) {
      console.error('Email login failed:', err);
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setAuthError(message);
    } finally {
      setIsEmailLoading(false);
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

      {authError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{authError}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Primary Action: Continue with Google */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
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
                <span>Continue with Google</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-[#71717A] dark:text-zinc-400 mt-2">
            Instant & secure. Role selection follows for new users.
          </p>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E5E5DE] dark:border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-[#71717A] dark:text-zinc-500">
            or continue with email
          </span>
          <div className="flex-grow border-t border-[#E5E5DE] dark:border-zinc-800"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
              Email Address
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
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#121214] dark:text-white">Password</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
                Logging in...
              </span>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="text-center text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <span>Don&apos;t have an account yet? </span>
        <Link href="/auth/signup" className="text-[#FF5416] hover:underline font-bold">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#FF5416] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
