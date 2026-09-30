export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string | null;
          display_name: string;
          email: string;
          avatar_url: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: string | null;
          display_name?: string;
          email?: string;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: string | null;
          display_name?: string;
          email?: string;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creator_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          bio: string | null;
          profile_image_path: string | null;
          country: string | null;
          state: string | null;
          city: string | null;
          languages: string[] | null;
          categories: string[] | null;
          niche: string;
          audience_age: Json;
          audience_gender: Json;
          audience_locations: Json;
          follower_count: number;
          average_reach: number;
          engagement_rate: number;
          instagram_connected: boolean;
          instagram_user_id: string | null;
          instagram_verified: boolean;
          metrics_source: string;
          metrics_verified_at: string | null;
          verification_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          bio?: string | null;
          profile_image_path?: string | null;
          country?: string | null;
          state?: string | null;
          city?: string | null;
          languages?: string[] | null;
          categories?: string[] | null;
          niche?: string;
          audience_age?: Json;
          audience_gender?: Json;
          audience_locations?: Json;
          follower_count?: number;
          average_reach?: number;
          engagement_rate?: number;
          instagram_connected?: boolean;
          instagram_user_id?: string | null;
          instagram_verified?: boolean;
          metrics_source?: string;
          metrics_verified_at?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          bio?: string | null;
          profile_image_path?: string | null;
          country?: string | null;
          state?: string | null;
          city?: string | null;
          languages?: string[] | null;
          categories?: string[] | null;
          niche?: string;
          audience_age?: Json;
          audience_gender?: Json;
          audience_locations?: Json;
          follower_count?: number;
          average_reach?: number;
          engagement_rate?: number;
          instagram_connected?: boolean;
          instagram_user_id?: string | null;
          instagram_verified?: boolean;
          metrics_source?: string;
          metrics_verified_at?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          logo_path: string | null;
          website: string | null;
          app_url: string | null;
          description: string | null;
          business_type: string;
          category: string | null;
          industry: string;
          city: string;
          state: string | null;
          target_audience: string | null;
          target_locations: string[] | null;
          budget_range: string | null;
          verification_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          logo_path?: string | null;
          website?: string | null;
          app_url?: string | null;
          description?: string | null;
          business_type?: string;
          category?: string | null;
          industry?: string;
          city?: string;
          state?: string | null;
          target_audience?: string | null;
          target_locations?: string[] | null;
          budget_range?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          logo_path?: string | null;
          website?: string | null;
          app_url?: string | null;
          description?: string | null;
          business_type?: string;
          category?: string | null;
          industry?: string;
          city?: string;
          state?: string | null;
          target_audience?: string | null;
          target_locations?: string[] | null;
          budget_range?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creator_packages: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          platform: string;
          content_type: string;
          description: string;
          price: number;
          currency: string;
          delivery_days: number;
          revision_count: number;
          deliverables: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          platform?: string;
          content_type?: string;
          description: string;
          price: number;
          currency?: string;
          delivery_days?: number;
          revision_count?: number;
          deliverables?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          platform?: string;
          content_type?: string;
          description?: string;
          price?: number;
          currency?: string;
          delivery_days?: number;
          revision_count?: number;
          deliverables?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
