'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ArrowRight, Smartphone, Film, AlertCircle, Loader2 } from 'lucide-react';

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

function SignupContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorParam);

  const handleGoogleAuth = async (preselectedRole?: 'creator' | 'business') => {
    setLoadingRole(preselectedRole || 'any');
    setErrorMessage(null);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase credentials are not configured in environment variables. Please check NEXT_PUBLIC_SUPABASE_URL.'
        );
      }

      const redirectUrl = preselectedRole
        ? `${window.location.origin}/auth/callback?role=${preselectedRole}`
        : `${window.location.origin}/auth/callback`;

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
      const message = err instanceof Error ? err.message : 'Failed to connect with Google. Please try again.';
      setErrorMessage(message);
      setLoadingRole(null);
    }
  };

  const roles = [
    {
      id: 'business' as const,
      title: 'Founder / Business',
      subtitle: 'Market your mobile app, website, SaaS or product through vetted Indian influencers.',
      badge: 'Apps & Businesses',
      icon: Smartphone,
      cta: 'Continue with Google as Business',
    },
    {
      id: 'creator' as const,
      title: 'Influencer / Creator',
      subtitle: 'Showcase your reels, define your audience, create packages, and earn from paid app promotions.',
      badge: 'Creators & Streamers',
      icon: Film,
      cta: 'Continue with Google as Influencer',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
      <div className="text-center space-y-3">
        <span className="editorial-label text-[#FF5416]">Join Market My App</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Create Your Account
        </h1>
        <p className="text-sm text-[#71717A] dark:text-zinc-400 max-w-md mx-auto">
          Market My App connects Indian app and tech creators with companies looking for high-converting promotion.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Global Continue with Google option */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 text-center space-y-3 shadow-sm">
        <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
          Quick Single Sign-On
        </h3>
        <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-md mx-auto">
          Sign up with your Google account. You will select your role right after.
        </p>
        <button
          type="button"
          onClick={() => handleGoogleAuth()}
          disabled={Boolean(loadingRole)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 bg-[#121214] dark:bg-white text-white dark:text-[#121214] hover:bg-black dark:hover:bg-zinc-200 rounded-lg text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingRole === 'any' ? (
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
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#E5E5DE] dark:border-zinc-800"></div>
        <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-[#71717A] dark:text-zinc-500">
          or choose your account type first
        </span>
        <div className="flex-grow border-t border-[#E5E5DE] dark:border-zinc-800"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {roles.map((r) => {
          const Icon = r.icon;
          const isLoadingThis = loadingRole === r.id;

          return (
            <div
              key={r.id}
              onClick={() => !loadingRole && handleGoogleAuth(r.id)}
              className="group cursor-pointer bg-white dark:bg-[#18181B] border-2 border-[#E5E5DE] dark:border-zinc-800 hover:border-[#FF5416] dark:hover:border-[#FF5416] rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-lg bg-[#F4F4F0] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 flex items-center justify-center text-[#FF5416] group-hover:bg-[#FF5416] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 px-2.5 py-1 rounded border border-[#E5E5DE] dark:border-zinc-700">
                    {r.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white group-hover:text-[#FF5416] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-[#52525B] dark:text-zinc-400 mt-2 leading-relaxed">
                    {r.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between text-xs font-mono font-semibold text-[#121214] dark:text-white group-hover:text-[#FF5416]">
                <span>{isLoadingThis ? 'Connecting...' : r.cta}</span>
                {isLoadingThis ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF5416]" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs font-mono text-[#71717A] dark:text-zinc-400">
        Already registered?{' '}
        <Link href="/auth/login" className="text-[#FF5416] font-bold hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
}

export default function RoleSelectionPage() {
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
