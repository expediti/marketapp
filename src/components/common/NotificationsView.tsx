'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  Bell,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Video,
  FileCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  user_id: string;
  related_order_id?: string | null;
  type: string;
  title: string;
  body: string;
  read?: boolean;
  is_read?: boolean;
  created_at: string;
}

interface NotificationsViewProps {
  userId: string;
}

export function NotificationsView({ userId }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          setNotifications(data);
        }
      } catch (err) {
        console.warn('Error fetching notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_STATUS_CHANGED':
        return <CreditCard className="w-4 h-4 text-[#047857]" />;
      case 'ORDER_DELIVERED':
        return <Video className="w-4 h-4 text-[#FF5416]" />;
      case 'ORDER_APPROVED':
        return <CheckCircle className="w-4 h-4 text-[#047857]" />;
      case 'REVISION_REQUESTED':
        return <RefreshCw className="w-4 h-4 text-amber-600" />;
      case 'DISPUTE_OPENED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#FF5416]" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
        <div>
          <span className="editorial-label text-[#FF5416]">System Notifications</span>
          <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FF5416]" />
            <span>Activity Feed ({notifications.length})</span>
          </h3>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-[#71717A] dark:text-zinc-400">
          <div className="w-6 h-6 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Loading activity alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-12 text-center text-[#71717A] dark:text-zinc-400 border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl">
          <Bell className="w-8 h-8 text-[#A1A1AA] mx-auto mb-2 opacity-50" />
          <p className="font-bold text-sm text-[#121214] dark:text-white">No notifications yet</p>
          <p className="text-[11px] mt-1">Updates regarding your campaign payments, previews, and revisions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-4 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 flex items-start gap-3.5 hover:border-[#FF5416]/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs text-[#121214] dark:text-white truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-[#A1A1AA] dark:text-zinc-500 shrink-0">
                    {new Date(notif.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-[11px] text-[#52525B] dark:text-zinc-300 mt-1 leading-relaxed">
                  {notif.body}
                </p>

                {notif.related_order_id && (
                  <div className="mt-2.5">
                    <Link
                      href={`/orders/${notif.related_order_id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5416] hover:underline"
                    >
                      <span>Open Campaign Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
