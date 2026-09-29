'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg border border-[#E5E5DE] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#121214] dark:text-[#F4F4F5] hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] transition-colors focus:outline-none ${className}`}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#FF5416]" />
      ) : (
        <Moon className="w-4 h-4 text-[#71717A]" />
      )}
    </button>
  );
}
