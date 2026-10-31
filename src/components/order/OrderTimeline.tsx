import React from 'react';
import { Order, OrderStatus } from '@/types/marketplace';
import { CampaignTimeline } from './CampaignTimeline';

interface OrderTimelineProps {
  currentStatus?: OrderStatus;
  order?: Order;
}

export function OrderTimeline({ currentStatus = 'DEAL_CONFIRMED', order }: OrderTimelineProps) {
  // If full order is provided, use the comprehensive 9-stage CampaignTimeline
  if (order) {
    return <CampaignTimeline order={order} />;
  }

  // Construct synthetic minimal order for backward compatibility
  const syntheticOrder: Order = {
    id: 'placeholder',
    order_number: 'N/A',
    business_id: 'placeholder',
    creator_id: 'placeholder',
    package_id: 'placeholder',
    order_status: currentStatus,
    payment_status: currentStatus === 'COMPLETED' ? 'PAID' : 'PENDING',
    payout_status: 'UNRELEASED',
    subtotal: 0,
    platform_fee: 0,
    total_amount: 0,
    deadline: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <CampaignTimeline order={syntheticOrder} />;
}
