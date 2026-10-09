import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  variant?: 'auto' | 'light' | 'dark' | 'monogram';
  size?: 'sm' | 'md' | 'lg' | 'custom';
  priority?: boolean;
}

export function BrandLogo({
  className = '',
  variant = 'auto',
  size = 'md',
  priority = true,
}: BrandLogoProps) {
  // Height presets maintaining aspect ratio (980x212 ≈ 4.62:1)
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 sm:h-9 w-auto',
    lg: 'h-10 sm:h-12 w-auto',
    custom: '',
  };

  const selectedSizeClass = sizeClasses[size];

  if (variant === 'monogram') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <Image
          src="/icon.svg"
          alt="Market My Idea Monogram"
          width={48}
          height={48}
          className={`object-contain ${selectedSizeClass}`}
          priority={priority}
        />
      </div>
    );
  }

  if (variant === 'light') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <Image
          src="/brand-logo-light.svg"
          alt="Market My Idea"
          width={185}
          height={40}
          className={`object-contain ${selectedSizeClass}`}
          priority={priority}
        />
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <Image
          src="/brand-logo-dark.svg"
          alt="Market My Idea"
          width={185}
          height={40}
          className={`object-contain ${selectedSizeClass}`}
          priority={priority}
        />
      </div>
    );
  }

  // Auto theme support: renders light logo on light theme and dark logo on dark theme without flash
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Image
        src="/brand-logo-light.svg"
        alt="Market My Idea"
        width={185}
        height={40}
        className={`object-contain dark:hidden block ${selectedSizeClass}`}
        priority={priority}
      />
      <Image
        src="/brand-logo-dark.svg"
        alt="Market My Idea"
        width={185}
        height={40}
        className={`object-contain hidden dark:block ${selectedSizeClass}`}
        priority={priority}
      />
    </div>
  );
}
