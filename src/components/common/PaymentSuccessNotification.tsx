'use client';

import React, { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface PaymentSuccessNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWorking?: () => void;
  title?: string;
  message?: string;
  orderNumber?: string;
  autoDismissMs?: number;
}

/**
 * In-App Payment Success Notification
 * 
 * Features:
 * - Green success icon with animated stroke-drawing tick (~2-second animation).
 * - Subtle scale & fade transition.
 * - Automatic disappearance after ~4 seconds.
 * - Prominent "Start Working" action.
 * - Purely in-app (no browser popups or Chrome notification permissions).
 */
export function PaymentSuccessNotification({
  isOpen,
  onClose,
  onStartWorking,
  title = 'First payment received',
  message = 'Your campaign is now funded for the first instalment. You can start working.',
  orderNumber,
  autoDismissMs = 4200,
}: PaymentSuccessNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    let dismissTimer: NodeJS.Timeout;
    let fadeOutTimer: NodeJS.Timeout;

    if (isOpen) {
      setVisible(true);
      setAnimatingOut(false);

      fadeOutTimer = setTimeout(() => {
        setAnimatingOut(true);
      }, autoDismissMs - 400);

      dismissTimer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, autoDismissMs);
    } else {
      setVisible(false);
    }

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [isOpen, autoDismissMs, onClose]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-6 right-6 z-50 max-w-md w-full bg-white dark:bg-[#18181B] border-2 border-[#10B981] dark:border-emerald-500 rounded-xl shadow-2xl p-4 sm:p-5 transition-all duration-300 font-mono ${
        animatingOut
          ? 'opacity-0 scale-95 translate-y-2'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Animated Green Tick Icon (~2s animation) */}
        <div className="shrink-0 relative w-10 h-10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#10B981] dark:text-emerald-400"
            viewBox="0 0 52 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Circle */}
            <circle
              cx="26"
              cy="26"
              r="24"
              className="stroke-[#10B981] dark:stroke-emerald-400 opacity-20"
              strokeWidth="4"
            />
            {/* Animated Ring */}
            <circle
              cx="26"
              cy="26"
              r="24"
              className="stroke-[#10B981] dark:stroke-emerald-400 animate-[dash_1.8s_cubic-bezier(0.65,0,0.45,1)_forwards]"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="166"
              strokeDashoffset="166"
            />
            {/* Animated Checkmark */}
            <path
              className="stroke-[#10B981] dark:stroke-emerald-400 animate-[check_1.4s_cubic-bezier(0.65,0,0.45,1)_0.4s_forwards]"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="48"
              strokeDashoffset="48"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
              <span>{title}</span>
              {orderNumber && (
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400 font-normal">
                  #{orderNumber}
                </span>
              )}
            </h4>
            <button
              onClick={() => {
                setAnimatingOut(true);
                setTimeout(onClose, 200);
              }}
              className="text-[#71717A] hover:text-[#121214] dark:hover:text-white p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-1 leading-relaxed">
            {message}
          </p>

          {onStartWorking && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  onStartWorking();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] dark:bg-emerald-600 dark:hover:bg-emerald-500 px-3 py-1.5 rounded-lg shadow-sm transition-all"
              >
                <span>Start Working</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: 166;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes check {
          0% {
            stroke-dashoffset: 48;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
