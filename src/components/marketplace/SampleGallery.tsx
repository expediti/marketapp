import React from 'react';
import { CreatorSample } from '@/types/marketplace';
import { ShieldAlert } from 'lucide-react';

interface SampleGalleryProps {
  samples: CreatorSample[];
}

export function SampleGallery({ samples }: SampleGalleryProps) {
  if (!samples || samples.length === 0) {
    return (
      <div className="bg-[#FBFBFA] border border-dashed border-[#E5E5DE] rounded-lg p-8 text-center text-xs text-[#71717A] font-mono">
        Creator sample portfolio synchronized via internal review vault.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {samples.map((sample) => (
        <div
          key={sample.id}
          className="group relative bg-[#121214] rounded-lg overflow-hidden border border-[#E5E5DE] aspect-[4/5] flex flex-col justify-end"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105 opacity-90"
            style={{ backgroundImage: `url(${sample.image_url})` }}
          />

          {/* Watermark overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-25">
            <span className="font-mono text-lg font-bold text-white uppercase tracking-widest rotate-[-25deg] border border-white/50 px-4 py-1">
              Marketur Preview
            </span>
          </div>

          {/* Gradient backdrop for text */}
          <div className="relative z-10 p-4 bg-gradient-to-t from-[#121214] via-[#121214]/70 to-transparent">
            <h5 className="font-mono text-sm font-bold text-white leading-tight">
              {sample.title}
            </h5>
            <p className="text-[11px] text-[#A1A1AA] mt-1 line-clamp-2">
              {sample.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
