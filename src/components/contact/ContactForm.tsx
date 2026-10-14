'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketId, setTicketId] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send your message. Please try again.');
      }

      setTicketId(data.ticketId);
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        category: 'General Inquiry',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again or email us directly.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-[#ECFDF5] dark:bg-[#064E3B]/20 border border-[#A7F3D0] dark:border-[#065F46] rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#10B981] text-white mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-mono text-xl font-bold text-[#065F46] dark:text-[#34D399]">
            Message Received Successfully
          </h3>
          <p className="text-xs sm:text-sm text-[#047857] dark:text-[#A7F3D0] max-w-md mx-auto leading-relaxed">
            Thank you for reaching out. We have logged your request under ticket reference:
          </p>
          <div className="pt-2">
            <span className="font-mono text-xs font-bold px-3 py-1.5 bg-white dark:bg-[#064E3B] border border-[#A7F3D0] dark:border-[#047857] text-[#065F46] dark:text-white rounded-md inline-block">
              {ticketId}
            </span>
          </div>
        </div>
        <p className="text-xs text-[#065F46] dark:text-[#A7F3D0]/80">
          Our customer support team will review your inquiry and respond to your email within {BUSINESS_INFO.support.responseTime}.
        </p>
        <div className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStatus('idle')}
            className="border-[#047857] text-[#065F46] hover:bg-[#D1FAE5]"
          >
            Send Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Submission Error</span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs font-mono font-semibold text-[#121214] dark:text-zinc-200">
            Full Name <span className="text-[#FF5416]">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-lg text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416] transition-colors"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-mono font-semibold text-[#121214] dark:text-zinc-200">
            Email Address <span className="text-[#FF5416]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-lg text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416] transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Inquiry Category */}
        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-xs font-mono font-semibold text-[#121214] dark:text-zinc-200">
            Inquiry Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-lg text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416] transition-colors"
          >
            <option value="General Inquiry">General Inquiry</option>
            <option value="Order & Campaign Support">Order & Campaign Support</option>
            <option value="Payment & Billing">Payment & Billing</option>
            <option value="Creator / Influencer Inquiries">Creator / Influencer Inquiries</option>
            <option value="Brand & Founder Inquiries">Brand & Founder Inquiries</option>
            <option value="Grievance / Dispute Escalation">Grievance / Dispute Escalation</option>
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label htmlFor="subject" className="block text-xs font-mono font-semibold text-[#121214] dark:text-zinc-200">
            Subject <span className="text-[#FF5416]">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={formData.subject}
            onChange={handleChange}
            placeholder="Brief summary of your inquiry"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-lg text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416] transition-colors"
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-xs font-mono font-semibold text-[#121214] dark:text-zinc-200">
          Message <span className="text-[#FF5416]">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          value={formData.message}
          onChange={handleChange}
          placeholder="Please describe your question or issue in detail. If your inquiry relates to an active collaboration, please include your Order ID."
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-lg text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416] transition-colors resize-y"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={status === 'loading'}
          className="w-full sm:w-auto"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Sending Message...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              <span>Submit Message</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
