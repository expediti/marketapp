import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <span className="editorial-label text-[#FF5416]">Error 404</span>
      <h1 className="font-mono text-4xl font-extrabold text-[#121214] tracking-tight">
        Workspace Not Found
      </h1>
      <p className="text-sm text-[#71717A] max-w-sm mx-auto">
        The creator, order workspace, or page you are attempting to reach does not exist or has moved.
      </p>
      <div className="pt-2">
        <Link href="/">
          <Button variant="primary" size="md">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Marketplace</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
