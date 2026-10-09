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
          payout_upi_id: string | null;
          instagram_username: string | null;
          instagram_profile_url: string | null;
          submitted_reels: Json | null;
          primary_reel_url: string | null;
          claimed_followers: number | null;
          claimed_engagement_rate: number | null;
          reviewed_follower_count: number | null;
          reviewed_engagement_rate: number | null;
          reviewed_avg_reel_views: number | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_notes: string | null;
          instagram_profile_data: Json | null;
          instagram_connected_at: string | null;
          instagram_access_token: string | null;
          instagram_last_synced_at: string | null;
          instagram_sync_status: string | null;
          instagram_webhook_received_at: string | null;
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
          payout_upi_id?: string | null;
          instagram_username?: string | null;
          instagram_profile_url?: string | null;
          submitted_reels?: Json | null;
          primary_reel_url?: string | null;
          claimed_followers?: number | null;
          claimed_engagement_rate?: number | null;
          reviewed_follower_count?: number | null;
          reviewed_engagement_rate?: number | null;
          reviewed_avg_reel_views?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          instagram_profile_data?: Json | null;
          instagram_connected_at?: string | null;
          instagram_access_token?: string | null;
          instagram_last_synced_at?: string | null;
          instagram_sync_status?: string | null;
          instagram_webhook_received_at?: string | null;
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
          payout_upi_id?: string | null;
          instagram_username?: string | null;
          instagram_profile_url?: string | null;
          submitted_reels?: Json | null;
          primary_reel_url?: string | null;
          claimed_followers?: number | null;
          claimed_engagement_rate?: number | null;
          reviewed_follower_count?: number | null;
          reviewed_engagement_rate?: number | null;
          reviewed_avg_reel_views?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          instagram_profile_data?: Json | null;
          instagram_connected_at?: string | null;
          instagram_access_token?: string | null;
          instagram_last_synced_at?: string | null;
          instagram_sync_status?: string | null;
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
          instagram_media_id: string | null;
          reel_url: string | null;
          permalink: string | null;
          like_count: number | null;
          comments_count: number | null;
          view_count: number | null;
          reach: number | null;
          shares_count: number | null;
          saved_count: number | null;
          media_type: string | null;
          media_product_type: string | null;
          posted_at: string | null;
          last_synced_at: string | null;
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
          instagram_media_id?: string | null;
          reel_url?: string | null;
          permalink?: string | null;
          like_count?: number | null;
          comments_count?: number | null;
          view_count?: number | null;
          reach?: number | null;
          shares_count?: number | null;
          saved_count?: number | null;
          media_type?: string | null;
          media_product_type?: string | null;
          posted_at?: string | null;
          last_synced_at?: string | null;
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
          instagram_media_id?: string | null;
          reel_url?: string | null;
          permalink?: string | null;
          like_count?: number | null;
          comments_count?: number | null;
          view_count?: number | null;
          reach?: number | null;
          shares_count?: number | null;
          saved_count?: number | null;
          media_type?: string | null;
          media_product_type?: string | null;
          posted_at?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collaboration_requests: {
        Row: {
          id: string;
          business_user_id: string;
          creator_user_id: string;
          campaign_id: string | null;
          package_id: string | null;
          message: string | null;
          proposed_budget: number | null;
          status: string;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_user_id: string;
          creator_user_id: string;
          campaign_id?: string | null;
          package_id?: string | null;
          message?: string | null;
          proposed_budget?: number | null;
          status?: string;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_user_id?: string;
          creator_user_id?: string;
          campaign_id?: string | null;
          package_id?: string | null;
          message?: string | null;
          proposed_budget?: number | null;
          status?: string;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          campaign_id: string | null;
          request_id: string | null;
          business_id: string;
          business_user_id: string;
          creator_id: string;
          creator_user_id: string;
          package_id: string;
          order_status: string;
          payment_status: string;
          payout_status: string;
          subtotal: number;
          platform_fee: number;
          total_amount: number;
          deadline: string;
          included_revisions: number;
          revisions_used: number;
          work_started_at?: string | null;
          agreed_price?: number | null;
          agreed_deadline?: string | null;
          requirements?: string | null;
          delivered_at: string | null;
          auto_approve_deadline: string | null;
          waiting_reason: string | null;
          extension_requested_deadline: string | null;
          extension_reason: string | null;
          extension_status: string | null;
          system_review_reason: string | null;
          system_review_description: string | null;
          system_review_evidence_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          campaign_id?: string | null;
          request_id?: string | null;
          business_id: string;
          business_user_id?: string;
          creator_id: string;
          creator_user_id?: string;
          package_id: string;
          order_status?: string;
          payment_status?: string;
          payout_status?: string;
          subtotal: number;
          platform_fee: number;
          total_amount: number;
          deadline: string;
          agreed_price?: number | null;
          agreed_deadline?: string | null;
          requirements?: string | null;
          included_revisions?: number;
          revisions_used?: number;
          work_started_at?: string | null;
          delivered_at?: string | null;
          auto_approve_deadline?: string | null;
          waiting_reason?: string | null;
          extension_requested_deadline?: string | null;
          extension_reason?: string | null;
          extension_status?: string | null;
          system_review_reason?: string | null;
          system_review_description?: string | null;
          system_review_evidence_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          campaign_id?: string | null;
          request_id?: string | null;
          business_id?: string;
          business_user_id?: string;
          creator_id?: string;
          creator_user_id?: string;
          package_id?: string;
          order_status?: string;
          payment_status?: string;
          payout_status?: string;
          subtotal?: number;
          platform_fee?: number;
          total_amount?: number;
          deadline?: string;
          agreed_price?: number | null;
          agreed_deadline?: string | null;
          requirements?: string | null;
          included_revisions?: number;
          revisions_used?: number;
          work_started_at?: string | null;
          delivered_at?: string | null;
          auto_approve_deadline?: string | null;
          waiting_reason?: string | null;
          extension_requested_deadline?: string | null;
          extension_reason?: string | null;
          extension_status?: string | null;
          system_review_reason?: string | null;
          system_review_description?: string | null;
          system_review_evidence_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payer_user_id: string | null;
          provider: string;
          provider_payment_id: string | null;
          amount: number;
          currency: string;
          status: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          failure_reason: string | null;
          paid_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payer_user_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          failure_reason?: string | null;
          paid_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          payer_user_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          failure_reason?: string | null;
          paid_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          order_id: string;
          submitted_by: string | null;
          proof_url: string;
          instagram_post_url: string | null;
          file_storage_path: string | null;
          notes: string | null;
          submitted_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          submitted_by?: string | null;
          proof_url: string;
          instagram_post_url?: string | null;
          file_storage_path?: string | null;
          notes?: string | null;
          submitted_at?: string;
          status?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          submitted_by?: string | null;
          proof_url?: string;
          instagram_post_url?: string | null;
          file_storage_path?: string | null;
          notes?: string | null;
          submitted_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      deal_proposals: {
        Row: {
          id: string;
          request_id: string | null;
          conversation_id: string;
          order_id: string | null;
          proposed_by: string;
          deliverable: string;
          price: number;
          deadline: string;
          revisions_included: number;
          key_requirements: string;
          status: string;
          version: number;
          supersedes_proposal_id: string | null;
          accepted_by: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          conversation_id: string;
          order_id?: string | null;
          proposed_by: string;
          deliverable: string;
          price: number;
          deadline: string;
          revisions_included?: number;
          key_requirements: string;
          status?: string;
          version?: number;
          supersedes_proposal_id?: string | null;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          conversation_id?: string;
          order_id?: string | null;
          proposed_by?: string;
          deliverable?: string;
          price?: number;
          deadline?: string;
          revisions_included?: number;
          key_requirements?: string;
          status?: string;
          version?: number;
          supersedes_proposal_id?: string | null;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      disputes: {
        Row: {
          id: string;
          order_id: string;
          opened_by: string | null;
          reason: string;
          description: string;
          evidence_url: string | null;
          status: string;
          resolution: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          opened_by?: string | null;
          reason: string;
          description: string;
          evidence_url?: string | null;
          status?: string;
          resolution?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          opened_by?: string | null;
          reason?: string;
          description?: string;
          evidence_url?: string | null;
          status?: string;
          resolution?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          related_conversation_id: string | null;
          related_order_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          related_conversation_id?: string | null;
          related_order_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string;
          related_conversation_id?: string | null;
          related_order_id?: string | null;
          read_at?: string | null;
          created_at?: string;
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
          request_id: string | null;
          order_id: string | null;
          business_id: string | null;
          creator_id: string | null;
          business_user_id: string;
          creator_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          order_id?: string | null;
          business_id?: string | null;
          creator_id?: string | null;
          business_user_id: string;
          creator_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          order_id?: string | null;
          business_id?: string | null;
          creator_id?: string | null;
          business_user_id?: string;
          creator_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          order_id?: string | null;
          sender_id: string;
          sender_user_id: string | null;
          sender_role: string;
          body: string;
          message: string | null;
          moderation_status: string;
          moderation_flags: Json | null;
          created_at: string;
          updated_at?: string;
          read_at?: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          order_id?: string | null;
          sender_id: string;
          sender_user_id?: string | null;
          sender_role?: string;
          body: string;
          message?: string | null;
          moderation_status?: string;
          moderation_flags?: Json | null;
          created_at?: string;
          updated_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          order_id?: string | null;
          sender_id?: string;
          sender_user_id?: string | null;
          sender_role?: string;
          body?: string;
          message?: string | null;
          moderation_status?: string;
          moderation_flags?: Json | null;
          created_at?: string;
          updated_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          actor_id: string | null;
          event_type: string;
          from_status: string | null;
          to_status: string;
          reason: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          actor_id?: string | null;
          event_type?: string;
          from_status?: string | null;
          to_status: string;
          reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          actor_id?: string | null;
          event_type?: string;
          from_status?: string | null;
          to_status?: string;
          reason?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      instagram_webhook_events: {
        Row: {
          id: string;
          event_id: string | null;
          object_type: string;
          instagram_account_id: string | null;
          field_name: string | null;
          payload_summary: Json;
          status: string;
          error_message: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          object_type?: string;
          instagram_account_id?: string | null;
          field_name?: string | null;
          payload_summary?: Json;
          status?: string;
          error_message?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          object_type?: string;
          instagram_account_id?: string | null;
          field_name?: string | null;
          payload_summary?: Json;
          status?: string;
          error_message?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      process_auto_approvals: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      accept_deal_proposal: {
        Args: { p_proposal_id: string };
        Returns: Json;
      };
      end_collaboration: {
        Args: { p_conversation_id: string; p_reason?: string };
        Returns: Json;
      };
      cancel_confirmed_deal: {
        Args: { p_order_id: string; p_reason?: string };
        Returns: Json;
      };
      mark_work_started: {
        Args: { p_order_id: string };
        Returns: Json;
      };
      simulate_payment_success: {
        Args: { p_order_id: string };
        Returns: Json;
      };
      submit_order_delivery: {
        Args: {
          p_order_id: string;
          p_proof_url: string;
          p_instagram_post_url?: string;
          p_notes?: string;
        };
        Returns: Json;
      };
      accept_order_delivery: {
        Args: { p_order_id: string };
        Returns: Json;
      };
      request_order_revision: {
        Args: { p_order_id: string; p_notes: string };
        Returns: Json;
      };
      get_my_payout_upi_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      update_my_payout_upi_id: {
        Args: { p_upi_id: string };
        Returns: Json;
      };
      save_creator_instagram_connection: {
        Args: {
          p_user_id: string;
          p_instagram_user_id: string;
          p_instagram_username: string;
          p_follower_count: number;
          p_profile_data: Json;
          p_access_token?: string;
        };
        Returns: Json;
      };
      record_instagram_webhook_event: {
        Args: {
          p_event_id: string;
          p_object_type?: string;
          p_account_id?: string | null;
          p_field_name?: string | null;
          p_summary?: Json;
          p_status?: string;
          p_error?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
    ? (Database['public']['Tables'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'])[TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
    ? (Database['public']['Tables'])[PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'])[TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
    ? (Database['public']['Tables'])[PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
