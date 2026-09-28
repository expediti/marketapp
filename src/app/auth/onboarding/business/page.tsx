'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { Building2, ArrowRight } from 'lucide-react';

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { onboardBusiness } = useMarketplace();

  const [businessName, setBusinessName] = useState('Varanasi Silk Works');
  const [industry, setIndustry] = useState('Handloom & Fashion');
  const [city, setCity] = useState('Varanasi');
  const [website, setWebsite] = useState('https://varanashisilkworks.in');
  const [description, setDescription] = useState(
    'Heritage handloom weaving cluster partnering with Indian creators to present authentic Banarasi weaves to modern Gen-Z consumers.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onboardBusiness({
      business_name: businessName,
      industry,
      city,
      website,
      description,
    });
    router.push('/dashboard/business');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="editorial-label text-[#FF5416]">Business Onboarding</span>
        <h1 className="font-mono text-3xl font-extrabold text-[#121214] tracking-tight">
          Register Your Brand
        </h1>
        <p className="text-xs text-[#71717A]">
          Set up your organization profile to commission verified creators and fund campaigns with escrow protection.
        </p>
      </div>

      <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#121214] block mb-1">
              Registered Brand / Company Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              >
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Handloom & Fashion">Handloom & Fashion</option>
                <option value="Wellness & Skincare">Wellness & Skincare</option>
                <option value="D2C Consumer Goods">D2C Consumer Goods</option>
                <option value="Tech & SaaS">Tech & SaaS</option>
                <option value="Hospitality & Travel">Hospitality & Travel</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Headquarters City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#121214] block mb-1">Website or Store URL</label>
            <input
              type="url"
              required
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#121214] block mb-1">Brand Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          <div className="pt-4 border-t border-[#ECECE6]">
            <Button type="submit" variant="primary" size="md" className="w-full">
              <span>Complete Setup & Open Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
