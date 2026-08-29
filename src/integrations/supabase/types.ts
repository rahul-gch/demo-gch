export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_errors: {
        Row: {
          id: string
          message: string
          occurred_at: string
          org_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          route: string | null
          source: string
          stack: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          message: string
          occurred_at?: string
          org_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          source?: string
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          message?: string
          occurred_at?: string
          org_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          source?: string
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_errors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_errors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string
          org_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          org_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_requests: {
        Row: {
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          note: string | null
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string | null
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_comments: {
        Row: {
          author_name: string
          author_role: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_name?: string
          author_role?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_name: string
          author_role: string | null
          author_user_id: string | null
          body: string
          created_at: string
          event_at: string | null
          id: string
          kind: string
          media: Json
          org_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_name?: string
          author_role?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          event_at?: string | null
          id?: string
          kind?: string
          media?: Json
          org_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          event_at?: string | null
          id?: string
          kind?: string
          media?: Json
          org_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_requests: {
        Row: {
          agenda: string
          created_at: string
          duration_min: number
          id: string
          proposed_for: string
          recipient_org_id: string
          requested_by: string | null
          requester_org_id: string
          response_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agenda?: string
          created_at?: string
          duration_min?: number
          id?: string
          proposed_for: string
          recipient_org_id: string
          requested_by?: string | null
          requester_org_id: string
          response_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agenda?: string
          created_at?: string
          duration_min?: number
          id?: string
          proposed_for?: string
          recipient_org_id?: string
          requested_by?: string | null
          requester_org_id?: string
          response_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_requests_recipient_org_id_fkey"
            columns: ["recipient_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_requests_recipient_org_id_fkey"
            columns: ["recipient_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_requests_requester_org_id_fkey"
            columns: ["requester_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_requests_requester_org_id_fkey"
            columns: ["requester_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_name: string
          author_role: string | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_org_id: string
          sender_user_id: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_org_id: string
          sender_user_id?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_org_id?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_org_id_fkey"
            columns: ["sender_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_org_id_fkey"
            columns: ["sender_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_documents: {
        Row: {
          category: Database["public"]["Enums"]["doc_category"]
          created_at: string
          description: string | null
          id: string
          mime_type: string | null
          org_id: string
          size_bytes: number | null
          storage_path: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["doc_category"]
          created_at?: string
          description?: string | null
          id?: string
          mime_type?: string | null
          org_id: string
          size_bytes?: number | null
          storage_path: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["doc_category"]
          created_at?: string
          description?: string | null
          id?: string
          mime_type?: string | null
          org_id?: string
          size_bytes?: number | null
          storage_path?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string | null
          max_uses: number
          org_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["org_role"]
          token: string
          updated_at: string
          uses: number
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          max_uses?: number
          org_id: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
          updated_at?: string
          uses?: number
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          max_uses?: number
          org_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          avatar_url: string | null
          display_name: string
          id: string
          invited_by: string | null
          joined_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          title: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          title?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          address: string | null
          avg_delay_days: number | null
          banner_urls: string[]
          capabilities: string[]
          capacity: string | null
          certification_details: Json
          certifications: string[]
          city: string | null
          comments: string | null
          confidence_score: number | null
          contacts: Json
          country: string | null
          created_at: string
          created_by: string | null
          delivery_timeframe_days: number | null
          description: string | null
          entity_type: string | null
          evidence_count: number
          expired_cert_count: number
          gch_number: string | null
          governance: string | null
          id: string
          kpi_readiness: number
          latitude: number | null
          lead_time_days: number | null
          legacy_id: string | null
          logo_url: string | null
          longitude: number | null
          matchmaking_readiness: number
          materials: string[]
          missing_data_count: number
          missing_fields: string[]
          moq: string | null
          name: string
          on_time_rate: number | null
          onboarding_completed_at: string | null
          organization_type: string | null
          preferred_channel: string | null
          product_categories: string[]
          product_types: string[]
          profile_answers: Json
          profile_completeness: number
          profile_score: number
          rating: number | null
          raw_entity_type: string | null
          recommended_next_action: string | null
          region: string | null
          risk_level: string | null
          size: string | null
          slug: string
          specializations: string[]
          tier: number | null
          traceability_notes: string | null
          traceability_readiness: number
          type: string
          updated_at: string
          verification_status: string | null
          verified_cert_count: number
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avg_delay_days?: number | null
          banner_urls?: string[]
          capabilities?: string[]
          capacity?: string | null
          certification_details?: Json
          certifications?: string[]
          city?: string | null
          comments?: string | null
          confidence_score?: number | null
          contacts?: Json
          country?: string | null
          created_at?: string
          created_by?: string | null
          delivery_timeframe_days?: number | null
          description?: string | null
          entity_type?: string | null
          evidence_count?: number
          expired_cert_count?: number
          gch_number?: string | null
          governance?: string | null
          id?: string
          kpi_readiness?: number
          latitude?: number | null
          lead_time_days?: number | null
          legacy_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          matchmaking_readiness?: number
          materials?: string[]
          missing_data_count?: number
          missing_fields?: string[]
          moq?: string | null
          name: string
          on_time_rate?: number | null
          onboarding_completed_at?: string | null
          organization_type?: string | null
          preferred_channel?: string | null
          product_categories?: string[]
          product_types?: string[]
          profile_answers?: Json
          profile_completeness?: number
          profile_score?: number
          rating?: number | null
          raw_entity_type?: string | null
          recommended_next_action?: string | null
          region?: string | null
          risk_level?: string | null
          size?: string | null
          slug: string
          specializations?: string[]
          tier?: number | null
          traceability_notes?: string | null
          traceability_readiness?: number
          type?: string
          updated_at?: string
          verification_status?: string | null
          verified_cert_count?: number
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avg_delay_days?: number | null
          banner_urls?: string[]
          capabilities?: string[]
          capacity?: string | null
          certification_details?: Json
          certifications?: string[]
          city?: string | null
          comments?: string | null
          confidence_score?: number | null
          contacts?: Json
          country?: string | null
          created_at?: string
          created_by?: string | null
          delivery_timeframe_days?: number | null
          description?: string | null
          entity_type?: string | null
          evidence_count?: number
          expired_cert_count?: number
          gch_number?: string | null
          governance?: string | null
          id?: string
          kpi_readiness?: number
          latitude?: number | null
          lead_time_days?: number | null
          legacy_id?: string | null
          logo_url?: string | null
          longitude?: number | null
          matchmaking_readiness?: number
          materials?: string[]
          missing_data_count?: number
          missing_fields?: string[]
          moq?: string | null
          name?: string
          on_time_rate?: number | null
          onboarding_completed_at?: string | null
          organization_type?: string | null
          preferred_channel?: string | null
          product_categories?: string[]
          product_types?: string[]
          profile_answers?: Json
          profile_completeness?: number
          profile_score?: number
          rating?: number | null
          raw_entity_type?: string | null
          recommended_next_action?: string | null
          region?: string | null
          risk_level?: string | null
          size?: string | null
          slug?: string
          specializations?: string[]
          tier?: number | null
          traceability_notes?: string | null
          traceability_readiness?: number
          type?: string
          updated_at?: string
          verification_status?: string | null
          verified_cert_count?: number
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      platform_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string | null
          max_uses: number
          note: string | null
          org_name: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["org_role"]
          target_org_id: string | null
          token: string
          updated_at: string
          uses: number
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          max_uses?: number
          note?: string | null
          org_name?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          target_org_id?: string | null
          token?: string
          updated_at?: string
          uses?: number
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          max_uses?: number
          note?: string | null
          org_name?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          target_org_id?: string | null
          token?: string
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_invites_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_invites_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activity: {
        Row: {
          actor_org_id: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          message: string
          project_id: string
          type: string
        }
        Insert: {
          actor_org_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          message: string
          project_id: string
          type: string
        }
        Update: {
          actor_org_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_actor_org_id_fkey"
            columns: ["actor_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activity_actor_org_id_fkey"
            columns: ["actor_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_discussions: {
        Row: {
          attachments: Json
          author_name: string
          author_org_id: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          mentions: string[]
          project_id: string
          reactions: Json
          replies: Json
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_name?: string
          author_org_id?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          project_id: string
          reactions?: Json
          replies?: Json
          title?: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_name?: string
          author_org_id?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          project_id?: string
          reactions?: Json
          replies?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_discussions_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_discussions_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_discussions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          comments: Json
          created_at: string
          folder: string
          id: string
          mime: string | null
          name: string
          project_id: string
          size_bytes: number | null
          storage_path: string | null
          uploaded_by: string | null
          uploaded_by_org_id: string | null
          url: string | null
          version: number
          visibility: string
        }
        Insert: {
          comments?: Json
          created_at?: string
          folder?: string
          id?: string
          mime?: string | null
          name: string
          project_id: string
          size_bytes?: number | null
          storage_path?: string | null
          uploaded_by?: string | null
          uploaded_by_org_id?: string | null
          url?: string | null
          version?: number
          visibility?: string
        }
        Update: {
          comments?: Json
          created_at?: string
          folder?: string
          id?: string
          mime?: string | null
          name?: string
          project_id?: string
          size_bytes?: number | null
          storage_path?: string | null
          uploaded_by?: string | null
          uploaded_by_org_id?: string | null
          url?: string | null
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_org_id_fkey"
            columns: ["uploaded_by_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_org_id_fkey"
            columns: ["uploaded_by_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_meetings: {
        Row: {
          action_items: Json
          agenda: string
          attachments: Json
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          meeting_date: string
          meeting_time: string
          notes: string
          participants: string[]
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json
          agenda?: string
          attachments?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          meeting_date?: string
          meeting_time?: string
          notes?: string
          participants?: string[]
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json
          agenda?: string
          attachments?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          meeting_date?: string
          meeting_time?: string
          notes?: string
          participants?: string[]
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_partners: {
        Row: {
          created_at: string
          id: string
          org_id: string
          permissions: Json
          project_id: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          permissions?: Json
          project_id: string
          role?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          permissions?: Json
          project_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_partners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requests: {
        Row: {
          assigned_org_id: string | null
          attachments: Json
          comments: Json
          created_at: string
          description: string
          due_date: string | null
          id: string
          priority: string
          project_id: string
          requested_by: string | null
          requested_by_org_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_org_id?: string | null
          attachments?: Json
          comments?: Json
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: string
          project_id: string
          requested_by?: string | null
          requested_by_org_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_org_id?: string | null
          attachments?: Json
          comments?: Json
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string
          requested_by?: string | null
          requested_by_org_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requests_assigned_org_id_fkey"
            columns: ["assigned_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_requests_assigned_org_id_fkey"
            columns: ["assigned_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_requests_requested_by_org_id_fkey"
            columns: ["requested_by_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_requests_requested_by_org_id_fkey"
            columns: ["requested_by_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          country: string
          created_at: string
          created_by: string | null
          description: string
          end_date: string
          id: string
          image: string
          industry: string
          name: string
          objectives: string[]
          owner_org_id: string
          progress: number
          start_date: string
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string
          id?: string
          image?: string
          industry?: string
          name: string
          objectives?: string[]
          owner_org_id: string
          progress?: number
          start_date?: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string
          id?: string
          image?: string
          industry?: string
          name?: string
          objectives?: string[]
          owner_org_id?: string
          progress?: number
          start_date?: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_orders: {
        Row: {
          buyer_org_id: string
          conversation_id: string | null
          created_at: string
          id: string
          material: string | null
          needed_by: string | null
          notes: string | null
          product_id: string | null
          quantity: number
          requested_by: string | null
          seller_org_id: string
          shipping_address: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_org_id: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          material?: string | null
          needed_by?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          requested_by?: string | null
          seller_org_id: string
          shipping_address: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_org_id?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          material?: string | null
          needed_by?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          requested_by?: string | null
          seller_org_id?: string
          shipping_address?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_orders_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_orders_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "showroom_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_orders_seller_org_id_fkey"
            columns: ["seller_org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_orders_seller_org_id_fkey"
            columns: ["seller_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          action: string
          created_at: string
          detail: Json
          id: string
          org_id: string | null
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json
          id?: string
          org_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json
          id?: string
          org_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      showroom_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          images: string[]
          is_active: boolean
          materials: string[]
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          materials?: string[]
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          materials?: string[]
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "showroom_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showroom_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted: boolean
          accepted_at: string
          created_at: string
          id: string
          policy_type: string
          policy_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string
          created_at?: string
          id?: string
          policy_type: string
          policy_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          created_at?: string
          id?: string
          policy_type?: string
          policy_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      org_public_profiles: {
        Row: {
          capabilities: string[] | null
          certifications: string[] | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          entity_type: string | null
          id: string | null
          logo_url: string | null
          materials: string[] | null
          name: string | null
          product_categories: string[] | null
          product_types: string[] | null
          region: string | null
          slug: string | null
          specializations: string[] | null
          type: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          capabilities?: string[] | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string | null
          logo_url?: string | null
          materials?: string[] | null
          name?: string | null
          product_categories?: string[] | null
          product_types?: string[] | null
          region?: string | null
          slug?: string | null
          specializations?: string[] | null
          type?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          capabilities?: string[] | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string | null
          logo_url?: string | null
          materials?: string[] | null
          name?: string | null
          product_categories?: string[] | null
          product_types?: string[] | null
          region?: string | null
          slug?: string | null
          specializations?: string[] | null
          type?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invite: {
        Args: { _display_name?: string; _token: string }
        Returns: string
      }
      accept_platform_invite: {
        Args: { _display_name?: string; _token: string }
        Returns: string
      }
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          invited_email: string
          is_email_locked: boolean
          org_id: string
          org_name: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
        }[]
      }
      get_or_create_conversation: {
        Args: { _org_a: string; _org_b: string }
        Returns: string
      }
      get_platform_invite_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          org_name: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
          target_org_id: string
          target_org_name: string
        }[]
      }
      is_conversation_participant: {
        Args: { _conversation: string; _user: string }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string; _user: string }; Returns: boolean }
      is_platform_admin: { Args: { _user: string }; Returns: boolean }
      is_project_member: {
        Args: { _project: string; _user: string }
        Returns: boolean
      }
      is_project_partner: {
        Args: { _project: string; _user: string }
        Returns: boolean
      }
      orgs_are_connected: {
        Args: { _org_a: string; _org_b: string }
        Returns: boolean
      }
      platform_admin_domains: { Args: never; Returns: string[] }
      project_permission: {
        Args: { _key: string; _project: string; _user: string }
        Returns: boolean
      }
      user_can_edit: { Args: { _org: string; _user: string }; Returns: boolean }
      user_can_manage: {
        Args: { _org: string; _user: string }
        Returns: boolean
      }
      user_is_owner: { Args: { _org: string; _user: string }; Returns: boolean }
      user_org_role: {
        Args: { _org: string; _user: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
    }
    Enums: {
      doc_category: "certification" | "evidence" | "org_document"
      org_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      doc_category: ["certification", "evidence", "org_document"],
      org_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
