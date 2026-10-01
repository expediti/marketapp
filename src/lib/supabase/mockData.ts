// Purged mockData file. Production marketplace relies strictly on real Supabase tables.
import {
  CreatorProfile,
  BusinessProfile,
  Order,
  ChatMessage,
} from '@/types/marketplace';

export const INITIAL_CREATORS: CreatorProfile[] = [];
export const INITIAL_BUSINESSES: BusinessProfile[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};
