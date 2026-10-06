'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

export function AccountDeletedBanner() {
  const searchParams = useSearchParams();
  const isDeleted = searchParams?.get('account_deleted') === 'true';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDeleted) {
      setVisible(true);
    }
  }, [isDeleted]);

  if (!visible) return null;

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-3 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
          <span>Your account has been deleted and you have been signed out.</span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
