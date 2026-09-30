'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import {
  Film,
  Building2,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

export default function RoleSelectPage() {
  const router = useRouter();
  const { switchUser } = useMarketplace();

  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'creator' | 'business' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkCurrentAuth() {
      try {
        if (!isSupabaseConfigured) {
          setLoadingUser(false);
          return;
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace('/auth/login?error=Please+log+in+to+select+your+role');
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email || null);
        const meta = user.user_metadata || {};
        setUserName(meta.full_name || meta.name || meta.display_name || user.email?.split('@')[0] || 'User');
        setUserAvatar(meta.avatar_url || meta.picture || null);

        // Check if role is already chosen in profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role) {
          const r = profile.role.toLowerCase();
          if (r === 'creator' || r === 'influencer') {
            router.replace('/dashboard/creator');
            return;
          } else if (r === 'business' || r === 'advertiser') {
            router.replace('/dashboard/business');
            return;
          } else if (r === 'admin') {
            router.replace('/admin');
            return;
          }
        }
      } catch (err: unknown) {
        console.error('Error checking user state:', err);
      } finally {
        setLoadingUser(false);
      }
    }

    checkCurrentAuth();
  }, [router]);

  const handleSelectRole = async (role: 'creator' | 'business') => {
    setSelectedRole(role);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!userId) {
        throw new Error('No authenticated user session found. Please log in.');
      }

      // 1. Update profiles table with chosen role
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: userEmail || '',
            display_name: userName || 'User',
            avatar_url: userAvatar || null,
            role: role,
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        throw new Error(`Failed to save role: ${profileError.message}`);
      }

      // 2. Create corresponding profile row using SAME auth.users.id
      if (role === 'creator') {
        const { error: creatorError } = await supabase
          .from('creator_profiles')
          .upsert(
            {
              user_id: userId,
              display_name: userName || 'Creator',
              bio: '',
              country: 'India',
              city: 'Varanasi',
              niche: 'Technology',
              categories: ['Technology'],
              languages: ['Hindi', 'English'],
              follower_count: 0,
              average_reach: 0,
              engagement_rate: 0.0,
              verification_status: 'unverified',
            },
            { onConflict: 'user_id' }
          );

        if (creatorError) {
          console.warn('creator_profiles upsert note:', creatorError.message);
        }

        switchUser('creator');
        router.push('/auth/onboarding/creator');
      } else {
        const { error: bizError } = await supabase
          .from('business_profiles')
          .upsert(
            {
              user_id: userId,
              business_name: userName ? `${userName}'s Brand` : 'My Application',
              business_type: 'app',
              industry: 'Technology & SaaS',
              city: 'India',
              verification_status: 'unverified',
            },
            { onConflict: 'user_id' }
          );

        if (bizError) {
          console.warn('business_profiles upsert note:', bizError.message);
        }

        switchUser('business');
        router.push('/auth/onboarding/business');
      }
    } catch (err: unknown) {
      console.error('Role selection submission failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to complete role selection. Please try again.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#FF5416] animate-spin" />
        <p className="font-mono text-xs text-[#71717A] dark:text-zinc-400">
          Loading your Google account details...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
      <div className="text-center space-y-3">
        <span className="editorial-label text-[#FF5416]">Step 1 of Onboarding</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Choose Your Account Type
        </h1>
        <p className="text-sm text-[#71717A] dark:text-zinc-400 max-w-lg mx-auto">
          Welcome{userName ? `, ${userName}` : ''}! Select how you plan to use Market My App.
          This customizes your onboarding experience and platform features.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* OPTION 1: Influencer / Creator */}
        <div
          onClick={() => !isSubmitting && handleSelectRole('creator')}
          className={`group cursor-pointer bg-white dark:bg-[#18181B] border-2 rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-sm ${
            selectedRole === 'creator'
              ? 'border-[#FF5416] ring-2 ring-[#FF5416]/20'
              : 'border-[#E5E5DE] dark:border-zinc-800 hover:border-[#FF5416]'
          } ${isSubmitting ? 'pointer-events-none opacity-70' : ''}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-[#FFF2EC] dark:bg-[#FF5416]/10 border border-[#FF5416]/20 flex items-center justify-center text-[#FF5416] group-hover:bg-[#FF5416] group-hover:text-white transition-colors">
                <Film className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 px-2.5 py-1 rounded border border-[#E5E5DE] dark:border-zinc-700">
                Creators & Streamers
              </span>
            </div>

            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white group-hover:text-[#FF5416] transition-colors">
                Influencer / Creator
              </h3>
              <p className="text-xs text-[#52525B] dark:text-zinc-400 mt-2 leading-relaxed">
                Showcase your short-form video reels, define your audience demographics, create promotional packages, and earn from paid app sponsorship deals.
              </p>
            </div>

            <ul className="text-xs text-[#71717A] dark:text-zinc-400 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#FF5416]" />
                <span>Showcase portfolio reels & packages</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#FF5416]" />
                <span>Receive inbound paid brand requests</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#FF5416]" />
                <span>Direct payout upon delivery verification</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 mt-6">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-between group-hover:bg-[#FF5416] group-hover:text-white group-hover:border-[#FF5416] transition-all"
              disabled={isSubmitting}
            >
              <span>{isSubmitting && selectedRole === 'creator' ? 'Setting Up...' : 'I am an Influencer'}</span>
              {isSubmitting && selectedRole === 'creator' ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-2" />
              )}
            </Button>
          </div>
        </div>

        {/* OPTION 2: Founder / Owner / Business */}
        <div
          onClick={() => !isSubmitting && handleSelectRole('business')}
          className={`group cursor-pointer bg-white dark:bg-[#18181B] border-2 rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-sm ${
            selectedRole === 'business'
              ? 'border-[#FF5416] ring-2 ring-[#FF5416]/20'
              : 'border-[#E5E5DE] dark:border-zinc-800 hover:border-[#FF5416]'
          } ${isSubmitting ? 'pointer-events-none opacity-70' : ''}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-[#FFF2EC] dark:bg-[#FF5416]/10 border border-[#FF5416]/20 flex items-center justify-center text-[#FF5416] group-hover:bg-[#FF5416] group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 px-2.5 py-1 rounded border border-[#E5E5DE] dark:border-zinc-700">
                Founders & Brands
              </span>
            </div>

            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white group-hover:text-[#FF5416] transition-colors">
                Founder / Owner / Business
              </h3>
              <p className="text-xs text-[#52525B] dark:text-zinc-400 mt-2 leading-relaxed">
                Market your mobile app, website, SaaS platform, or consumer product through verified Indian creators with high-converting audiences.
              </p>
            </div>

            <ul className="text-xs text-[#71717A] dark:text-zinc-400 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#FF5416]" />
                <span>Search creators by niche, city & reach</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#FF5416]" />
                <span>Escrow-protected milestone payments</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#FF5416]" />
                <span>Review submissions before approval</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 mt-6">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-between group-hover:bg-[#FF5416] group-hover:text-white group-hover:border-[#FF5416] transition-all"
              disabled={isSubmitting}
            >
              <span>{isSubmitting && selectedRole === 'business' ? 'Setting Up...' : 'I am a Founder / Business'}</span>
              {isSubmitting && selectedRole === 'business' ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-2" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
