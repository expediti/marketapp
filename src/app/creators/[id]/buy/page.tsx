'use client';

import React, { useState, use } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { paymentService } from '@/lib/services/paymentService';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function PackagePurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const creatorId = params.id as string;
  const packageId = searchParams.get('packageId');

  const { getCreator, createOrder } = useMarketplace();
  const creator = getCreator(creatorId);

  const selectedPkg = creator?.packages?.find((p) => p.id === packageId) || creator?.packages?.[0];

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form Fields
  const [productName, setProductName] = useState('');
  const [objective, setObjective] = useState('');
  const [requirements, setRequirements] = useState('');
  const [dos, setDos] = useState('');
  const [donts, setDonts] = useState('');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [additionalNotes, setAdditionalNotes] = useState('');

  if (!creator || !selectedPkg) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-mono text-xl font-bold">Package not found</h2>
        <Link href="/discover">
          <Button variant="primary" size="sm">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const basePrice = selectedPkg.price;
  const platformFee = paymentService.calculatePlatformFee(basePrice);
  const totalAmount = basePrice + platformFee;

  const handleFundCollaboration = async () => {
    setIsProcessing(true);
    try {
      // Create payment order via payment abstraction
      await paymentService.createPaymentOrder({
        orderId: `temp_${Date.now()}`,
        subtotal: basePrice,
        currency: 'INR',
      });

      // Initialize order in state store
      const newOrder = await createOrder({
        creatorId: creator.user_id,
        packageId: selectedPkg.id,
        brief: {
          objective: `${productName}: ${objective}`,
          requirements,
          dos,
          donts,
          deadline: new Date(deadline).toISOString(),
          additionalNotes,
        },
      });

      router.push(`/orders/${newOrder.id}`);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Steps Indicator */}
      <div className="space-y-4">
        <Link
          href={`/creators/${creator.user_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] dark:text-zinc-400 hover:text-[#121214] dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {creator.profile?.display_name}</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
          <div>
            <span className="editorial-label text-[#FF5416]">Collaboration Checkout</span>
            <h1 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] dark:text-white mt-0.5">
              Book Package with {creator.profile?.display_name}
            </h1>
          </div>

          {/* Stepper pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {[
              { num: 1, label: 'Summary' },
              { num: 2, label: 'Campaign Brief' },
              { num: 3, label: 'Platform Payment' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num as 1 | 2 | 3)}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  currentStep === s.num
                    ? 'bg-[#121214] dark:bg-white text-white dark:text-zinc-900 border-[#121214] dark:border-white font-bold'
                    : 'bg-[#FBFBFA] dark:bg-zinc-900 text-[#71717A] dark:text-zinc-400 border-[#E5E5DE] dark:border-zinc-800'
                }`}
              >
                {s.num}. {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: PACKAGE SUMMARY */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#71717A] dark:text-zinc-400">Step 01 of 03</span>
            <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-1">Package Deliverables</h3>
          </div>

          <div className="p-5 bg-[#FBFBFA] dark:bg-zinc-950/60 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[#FF5416] font-bold">
                  {creator.profile?.display_name} • {creator.profile?.city}
                </span>
                <h4 className="font-mono text-2xl font-bold text-[#121214] dark:text-white mt-1">
                  {selectedPkg.name}
                </h4>
              </div>
              <span className="font-mono text-2xl font-bold text-[#121214] dark:text-white">
                ₹{selectedPkg.price.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="text-sm text-[#52525B] dark:text-zinc-300 leading-relaxed">
              {selectedPkg.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono text-[#71717A] dark:text-zinc-400">
              <div>
                <span className="block text-[10px] uppercase">Delivery Time</span>
                <strong className="text-[#121214] dark:text-white">{selectedPkg.delivery_days} Days</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase">Revisions</span>
                <strong className="text-[#121214] dark:text-white">{selectedPkg.revision_count} Included</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase">Security</span>
                <strong className="text-[#047857] dark:text-emerald-400">Payment Protected</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="primary" size="md" onClick={() => setCurrentStep(2)}>
              <span>Continue to Campaign Brief</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: CAMPAIGN BRIEF FORM */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#71717A] dark:text-zinc-400">Step 02 of 03</span>
            <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-1">Campaign Specification</h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Provide clear guidance to ensure the creator understands your requirements before accepting.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-zinc-200 block mb-1">
                What are you promoting? (Product or Brand Name)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FocusTimer Mobile App"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white placeholder-[#71717A] dark:placeholder-zinc-500 focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-zinc-200 block mb-1">
                Campaign Objective
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Drive app installs from tech-savvy Indian professionals"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white placeholder-[#71717A] dark:placeholder-zinc-500 focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-zinc-200 block mb-1">
                Required Talking Points & Deliverable Specs
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. 30-45s vertical reel demonstrating core features, smooth UI, and quick download steps"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white placeholder-[#71717A] dark:placeholder-zinc-500 focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#15803D] dark:text-emerald-400 block mb-1">
                  Brand Dos
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tag official handle, show live app screen, speak clearly"
                  value={dos}
                  onChange={(e) => setDos(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#BBF7D0] dark:border-emerald-900/60 rounded-lg text-[#121214] dark:text-white placeholder-[#71717A] dark:placeholder-zinc-500 focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B91C1C] dark:text-red-400 block mb-1">
                  Brand Don&apos;ts
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Don't use robotic voiceovers, don't mention competitors"
                  value={donts}
                  onChange={(e) => setDonts(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#FECACA] dark:border-red-900/60 rounded-lg text-[#121214] dark:text-white placeholder-[#71717A] dark:placeholder-zinc-500 focus:outline-none focus:border-[#B91C1C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-zinc-200 block mb-1">
                  Target Publication Deadline
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-zinc-200 block mb-1">
                  Fulfillment / Shipping Notes
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Courier tracking info or promo codes"
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white placeholder-[#71717A] dark:placeholder-zinc-500 focus:outline-none focus:border-[#FF5416]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setCurrentStep(3)}>
              <span>Review & Fund Collaboration</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT & ORDER SUMMARY */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#71717A] dark:text-zinc-400">Step 03 of 03</span>
            <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-1">Platform Payment Review</h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Platform records protect your order and funds are released only after you review and approve the content.
            </p>
          </div>

          {/* Pricing breakdown */}
          <div className="bg-[#FBFBFA] dark:bg-zinc-950/60 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 space-y-3 font-mono">
            <div className="flex justify-between text-xs text-[#52525B] dark:text-zinc-300">
              <span>Deliverable ({selectedPkg.name}):</span>
              <span className="text-[#121214] dark:text-white">₹{basePrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-[#52525B] dark:text-zinc-300">
              <span>Market My Idea Platform Fee (5%):</span>
              <span className="text-[#121214] dark:text-white">₹{platformFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-3 border-t border-[#ECECE6] dark:border-zinc-800 flex justify-between text-base font-bold text-[#121214] dark:text-white">
              <span>Total Amount:</span>
              <span className="text-[#FF5416] dark:text-orange-500">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Platform Guarantee Notice */}
          <div className="bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-900/60 rounded-xl p-4 flex items-start gap-3 text-xs text-[#065F46] dark:text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-emerald-900 dark:text-emerald-300">Platform Protection Guarantee</span>
              <p>
                The creator will receive this payout only after you review and approve the delivered Reel or story proof. If agreed requirements are missing, included revisions or System Review are available.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
              Edit Brief
            </Button>

            <Button
              variant="primary"
              size="lg"
              isLoading={isProcessing}
              onClick={handleFundCollaboration}
              className="bg-[#047857] hover:bg-[#065F46]"
            >
              <Lock className="w-4 h-4" />
              <span>Fund Collaboration (₹{totalAmount.toLocaleString('en-IN')})</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
