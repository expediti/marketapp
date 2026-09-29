'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Users, ShieldCheck, Film, TrendingUp } from 'lucide-react';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { CreatorReel } from '@/types/marketplace';

interface HeroWorkflowVisualProps {
  heroReel?: CreatorReel & {
    creator_name?: string;
    creator_city?: string;
    category?: string;
  };
}

const WORKFLOW_STAGES = [
  {
    id: 'app',
    number: '01',
    label: 'APP / WEBSITE',
    shortLabel: 'App',
    message: 'Your app is ready to promote',
    icon: Smartphone,
  },
  {
    id: 'influencer',
    number: '02',
    label: 'INFLUENCER',
    shortLabel: 'Influencer',
    message: 'Choose the right influencer',
    icon: Users,
  },
  {
    id: 'payment',
    number: '03',
    label: 'PAYMENT',
    shortLabel: 'Payment',
    message: 'Payment secured',
    icon: ShieldCheck,
  },
  {
    id: 'promotion',
    number: '04',
    label: 'PROMOTION',
    shortLabel: 'Promotion',
    message: 'Influencer publishes the content',
    icon: Film,
  },
  {
    id: 'reach',
    number: '05',
    label: 'AUDIENCE / REACH',
    shortLabel: 'Reach',
    message: 'Your app reaches the audience',
    icon: TrendingUp,
  },
];

export function HeroWorkflowVisual({ heroReel }: HeroWorkflowVisualProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Loop continuously through the 5 workflow stages
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % WORKFLOW_STAGES.length);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  const currentStage = WORKFLOW_STAGES[activeStageIndex];
  const ActiveIcon = currentStage.icon;

  const videoSource = heroReel?.video_url || '/reels/demo-reel-01.mp4';
  const videoPoster =
    heroReel?.thumbnail_url ||
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="relative w-full max-w-sm sm:max-w-md">
      {/* Clean Interactive Visual Container */}
      <div className="bg-white dark:bg-[#121214] border-2 border-[#121214] dark:border-[#27272A] rounded-2xl p-5 shadow-xl space-y-4">
        {/* 5-Step Horizontal Workflow Stepper */}
        <div className="grid grid-cols-5 gap-1.5 py-1.5 px-1 bg-[#FBFBFA] dark:bg-[#18181B] rounded-xl border border-[#E5E5DE] dark:border-[#27272A]">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === activeStageIndex;
            const isCompleted = idx < activeStageIndex;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStageIndex(idx)}
                className={`py-1.5 px-1 rounded-lg text-center transition-all duration-200 flex flex-col items-center gap-1 ${
                  isActive
                    ? 'bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] font-bold shadow-xs'
                    : isCompleted
                    ? 'text-[#121214] dark:text-zinc-300 opacity-80'
                    : 'text-[#71717A] dark:text-zinc-500 opacity-60 hover:opacity-100'
                }`}
                title={stage.message}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#FF5416] text-white'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono leading-none truncate max-w-full">
                  {stage.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Active Stage Description Banner */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] flex items-center justify-center shrink-0 border border-[#FFD2C1]/60 dark:border-[#4D1F0E]">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF5416] font-bold block leading-none">
                {currentStage.label}
              </span>
              <span className="text-xs font-mono text-[#121214] dark:text-white font-semibold block mt-1 truncate">
                "{currentStage.message}"
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-400 font-bold shrink-0 ml-2">
            {currentStage.number} / 05
          </span>
        </div>

        {/* Center Looping Reel Showcase */}
        <div className="w-full flex justify-center">
          <div className="relative aspect-[9/16] w-full max-w-[270px] rounded-xl overflow-hidden bg-black border border-[#27272A] shadow-md">
            <ReelVideo
              src={videoSource}
              poster={videoPoster}
              title={heroReel?.title || 'Influencer Showcase Reel'}
              autoPlay={true}
              loop={true}
              muted={true}
              playsInline={true}
              interactive={true}
              showMuteToggle={true}
              className="w-full h-full"
            />

            {/* Bottom creator watermark & category overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white pointer-events-none">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#D4D4D8]">
                <span className="font-semibold text-white truncate">
                  {heroReel?.creator_name || 'Rahul Sharma'}
                </span>
                <span className="text-[#A1A1AA] text-[10px]">
                  {heroReel?.creator_city || 'Delhi NCR'}
                </span>
              </div>
              <h4 className="font-mono text-xs font-bold text-white line-clamp-1 mt-0.5">
                {heroReel?.title || 'Fintech App UI Walkthrough'}
              </h4>
            </div>
          </div>
        </div>

        {/* Clean Bottom Explanation */}
        <div className="text-center pt-0.5">
          <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
            Direct influencer promotion for Indian apps & websites.
          </p>
        </div>
      </div>
    </div>
  );
}
