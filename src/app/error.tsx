'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log complete error safely to browser console for diagnostics
    console.error('App runtime error caught by GlobalError boundary:', {
      name: error?.name,
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="editorial-label text-[#FF5416]">System Notice</span>
          <h1 className="font-mono text-xl sm:text-2xl font-bold text-[#121214] dark:text-white">
            Something went wrong
          </h1>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            The page encountered an unexpected issue while loading data. Please try again or return to the main catalog.
          </p>
        </div>

        {error?.message && (
          <div className="text-left font-mono text-[11px] bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/60 rounded-lg p-3 text-red-700 dark:text-red-400">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full font-bold cursor-pointer"
            >
              <span>Diagnostic Details</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showDetails && (
              <div className="mt-2 space-y-1 pt-2 border-t border-red-200 dark:border-red-900">
                <p className="break-all"><strong>Message:</strong> {error.message}</p>
                {error.digest && <p className="break-all"><strong>Digest:</strong> {error.digest}</p>}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="w-full sm:w-auto text-xs"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Try Again</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto text-xs">
              <Home className="w-4 h-4 mr-2" />
              <span>Go to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
