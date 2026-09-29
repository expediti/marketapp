import { CreatorReel } from '@/types/marketplace';

export interface ShowcaseReelItem extends CreatorReel {
  creator_name: string;
  creator_city: string;
  category: string;
}

export const SHOWCASE_REELS: ShowcaseReelItem[] = [
  {
    id: 'reel_01',
    creator_id: 'c0000000-0000-0000-0000-000000000042',
    creator_name: 'Priya Sharma',
    creator_city: 'Varanasi',
    category: 'Food & Culinary',
    title: 'Artisanal Cafe & Pour-Over Tasting',
    video_url: '/reels/demo-reel-01.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    type: 'client_work',
    sort_order: 1,
    is_featured: true,
    is_visible: true,
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'reel_02',
    creator_id: 'c0000000-0000-0000-0000-000000000018',
    creator_name: 'Rohan Mehta',
    creator_city: 'Bengaluru',
    category: 'Fitness & Wellness',
    title: 'Morning Mobility & Whey Protein Routine',
    video_url: '/reels/demo-reel-02.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    type: 'client_work',
    sort_order: 2,
    is_featured: true,
    is_visible: true,
    created_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 'reel_03',
    creator_id: 'c0000000-0000-0000-0000-000000000007',
    creator_name: 'Ananya Desai',
    creator_city: 'Mumbai',
    category: 'Fashion & Style',
    title: 'Handloom Cotton Summer Lookbook',
    video_url: '/reels/demo-reel-03.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    type: 'client_work',
    sort_order: 3,
    is_featured: true,
    is_visible: true,
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'reel_04',
    creator_id: 'c0000000-0000-0000-0000-000000000089',
    creator_name: 'Vikram Patel',
    creator_city: 'Jaipur',
    category: 'Travel & Heritage',
    title: 'Heritage Stepwell Cinematic Walkthrough',
    video_url: '/reels/demo-reel-04.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80',
    type: 'demo',
    sort_order: 4,
    is_featured: true,
    is_visible: true,
    created_at: '2026-09-22T10:00:00Z',
  },
];
