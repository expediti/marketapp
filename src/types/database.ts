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
          country: string | null;
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
          country?: string | null;
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
          country?: string | null;
          target_audience?: string | null;
          target_locations?: string[] | null;
          budget_range?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          business_id: string;
          campaign_name: string;
          product_name: string;
          product_type: string;
          app_url: string | null;
          website_url: string | null;
          category: string | null;
          description: string | null;
          campaign_brief: string | null;
          target_locations: string[] | null;
          budget: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          campaign_name: string;
          product_name: string;
          product_type?: string;
          app_url?: string | null;
          website_url?: string | null;
          category?: string | null;
          description?: string | null;
          campaign_brief?: string | null;
          target_locations?: string[] | null;
          budget?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          campaign_name?: string;
          product_name?: string;
          product_type?: string;
          app_url?: string | null;
          website_url?: string | null;
          category?: string | null;
          description?: string | null;
          campaign_brief?: string | null;
          target_locations?: string[] | null;
          budget?: number;
          status?: string;
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
      creator_reels: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          storage_path: string | null;
          video_url: string;
          thumbnail_path: string | null;
          thumbnail_url: string | null;
          mime_type: string;
          file_size_bytes: number | null;
          duration_seconds: number | null;
          type: string;
          sort_order: number;
          is_featured: boolean;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          storage_path?: string | null;
          video_url: string;
          thumbnail_path?: string | null;
          thumbnail_url?: string | null;
          mime_type?: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          type?: string;
          sort_order?: number;
          is_featured?: boolean;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          storage_path?: string | null;
          video_url?: string;
          thumbnail_path?: string | null;
          thumbnail_url?: string | null;
          mime_type?: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          type?: string;
          sort_order?: number;
          is_featured?: boolean;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          business_id: string;
          creator_id: string;
          package_id: string;
          order_status: string;
          payment_status: string;
          payout_status: string;
          subtotal: number;
          platform_fee: number;
          total_amount: number;
          deadline: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          business_id: string;
          creator_id: string;
          package_id: string;
          order_status?: string;
          payment_status?: string;
          payout_status?: string;
          subtotal: number;
          platform_fee: number;
          total_amount: number;
          deadline: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          business_id?: string;
          creator_id?: string;
          package_id?: string;
          order_status?: string;
          payment_status?: string;
          payout_status?: string;
          subtotal?: number;
          platform_fee?: number;
          total_amount?: number;
          deadline?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_briefs: {
        Row: {
          id: string;
          order_id: string;
          objective: string;
          requirements: string;
          dos: string | null;
          donts: string | null;
          deadline: string;
          additional_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          objective: string;
          requirements: string;
          dos?: string | null;
          donts?: string | null;
          deadline: string;
          additional_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          objective?: string;
          requirements?: string;
          dos?: string | null;
          donts?: string | null;
          deadline?: string;
          additional_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          order_id: string | null;
          business_id: string;
          creator_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          business_id: string;
          creator_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          business_id?: string;
          creator_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          sender_role: string;
          body: string;
          moderation_status: string;
          moderation_flags: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          sender_role: string;
          body: string;
          moderation_status?: string;
          moderation_flags?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          sender_role?: string;
          body?: string;
          moderation_status?: string;
          moderation_flags?: Json | null;
          created_at?: string;
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
