'use client';

import React from 'react';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { UserRole } from '@/types/marketplace';

export function RoleBanner() {
  const { activeRole, switchUser, currentUser } = useMarketplace();

  return (
    <div className="bg-[#18181B] text-[#D4D4D8] border-b border-[#27272A] py-1.5 px-4 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF5416] animate-pulse" />
          <span className="text-[#A1A1AA] uppercase tracking-wider font-semibold text-[10px]">
            Dev / Review Persona:
          </span>
          <span className="text-white font-medium">
            {currentUser?.display_name || 'Guest'} ({activeRole})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#A1A1AA] hidden sm:inline mr-1">Switch:</span>
          {(['business', 'creator', 'admin'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => switchUser(role)}
              className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                activeRole === role
                  ? 'bg-[#FF5416] text-white font-bold'
                  : 'bg-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#3F3F46]'
              }`}
            >
              {role === 'business' ? 'Business' : role === 'creator' ? 'Creator 042' : 'Admin'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
