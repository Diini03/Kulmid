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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance_stats: {
        Row: {
          actual_rate: number | null
          calculated_at: string | null
          confidence: string | null
          created_at: string | null
          event_id: string
          id: string
          predicted_attendance: number | null
          predicted_rate: number | null
          total_checked_in: number
          total_registrations: number
        }
        Insert: {
          actual_rate?: number | null
          calculated_at?: string | null
          confidence?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          predicted_attendance?: number | null
          predicted_rate?: number | null
          total_checked_in?: number
          total_registrations: number
        }
        Update: {
          actual_rate?: number | null
          calculated_at?: string | null
          confidence?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          predicted_attendance?: number | null
          predicted_rate?: number | null
          total_checked_in?: number
          total_registrations?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_stats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_guests: {
        Row: {
          about: string | null
          check_in_token: string | null
          checked_in: boolean | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          degree: string | null
          dietary_restrictions: string | null
          email: string
          event_id: string
          heard_from: string | null
          id: string
          job_title: string | null
          name: string | null
          notes: string | null
          organization: string | null
          phone_number: string | null
          questions: string | null
          registration_type: string | null
          rsvp_at: string | null
          special_requirements: string | null
          status: string
          updated_at: string | null
          what_to_gain: string | null
          why_interested: string | null
        }
        Insert: {
          about?: string | null
          check_in_token?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          degree?: string | null
          dietary_restrictions?: string | null
          email: string
          event_id: string
          heard_from?: string | null
          id?: string
          job_title?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          phone_number?: string | null
          questions?: string | null
          registration_type?: string | null
          rsvp_at?: string | null
          special_requirements?: string | null
          status?: string
          updated_at?: string | null
          what_to_gain?: string | null
          why_interested?: string | null
        }
        Update: {
          about?: string | null
          check_in_token?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          degree?: string | null
          dietary_restrictions?: string | null
          email?: string
          event_id?: string
          heard_from?: string | null
          id?: string
          job_title?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          phone_number?: string | null
          questions?: string | null
          registration_type?: string | null
          rsvp_at?: string | null
          special_requirements?: string | null
          status?: string
          updated_at?: string | null
          what_to_gain?: string | null
          why_interested?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          created_at: string | null
          created_by: string
          custom_message: string | null
          custom_title: string | null
          email: string
          event_id: string
          id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          custom_message?: string | null
          custom_title?: string | null
          email: string
          event_id: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          custom_message?: string | null
          custom_title?: string | null
          email?: string
          event_id?: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_answers: {
        Row: {
          answer_boolean: boolean | null
          answer_option: string | null
          answer_text: string | null
          created_at: string
          id: string
          question_id: string
          registration_id: string
        }
        Insert: {
          answer_boolean?: boolean | null
          answer_option?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id: string
          registration_id: string
        }
        Update: {
          answer_boolean?: boolean | null
          answer_option?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "event_registration_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_answers_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_guests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_fields: {
        Row: {
          created_at: string
          event_id: string
          field_key: string
          id: string
          is_enabled: boolean
          is_required: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          event_id: string
          field_key: string
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          field_key?: string
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_questions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          is_required: boolean
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          auto_approve_registrations: boolean | null
          category: string
          created_at: string | null
          created_by: string
          date: string
          description: string | null
          end_date: string | null
          event_type: string | null
          facebook_url: string | null
          host_description: string | null
          host_email: string | null
          host_name: string | null
          host_phone: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          linkedin_url: string | null
          location: string
          max_attendees: number | null
          meeting_link: string | null
          payout_phone: string | null
          price: number
          registration_deadline: string | null
          rejection_reason: string | null
          status: string
          title: string
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          auto_approve_registrations?: boolean | null
          category: string
          created_at?: string | null
          created_by: string
          date: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          facebook_url?: string | null
          host_description?: string | null
          host_email?: string | null
          host_name?: string | null
          host_phone?: string | null
          id: string
          image_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          location: string
          max_attendees?: number | null
          meeting_link?: string | null
          payout_phone?: string | null
          price?: number
          registration_deadline?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          auto_approve_registrations?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string
          date?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          facebook_url?: string | null
          host_description?: string | null
          host_email?: string | null
          host_name?: string | null
          host_phone?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string
          max_attendees?: number | null
          meeting_link?: string | null
          payout_phone?: string | null
          price?: number
          registration_deadline?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_profiles_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          event_reminders: boolean | null
          guest_alerts: boolean | null
          id: string
          invitation_emails: boolean | null
          marketing_updates: boolean | null
          platform_announcements: boolean | null
          registration_confirmations: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_reminders?: boolean | null
          guest_alerts?: boolean | null
          id?: string
          invitation_emails?: boolean | null
          marketing_updates?: boolean | null
          platform_announcements?: boolean | null
          registration_confirmations?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_reminders?: boolean | null
          guest_alerts?: boolean | null
          id?: string
          invitation_emails?: boolean | null
          marketing_updates?: boolean | null
          platform_announcements?: boolean | null
          registration_confirmations?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_email: string | null
          actor_name: string | null
          created_at: string
          event_id: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_discovery: boolean | null
          allow_invitations: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          instagram: string | null
          is_public: boolean | null
          linkedin: string | null
          location: string | null
          show_attended_events: boolean | null
          show_hosted_events: boolean | null
          social_links: Json | null
          twitter: string | null
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          allow_discovery?: boolean | null
          allow_invitations?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          instagram?: string | null
          is_public?: boolean | null
          linkedin?: string | null
          location?: string | null
          show_attended_events?: boolean | null
          show_hosted_events?: boolean | null
          social_links?: Json | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          allow_discovery?: boolean | null
          allow_invitations?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          instagram?: string | null
          is_public?: boolean | null
          linkedin?: string | null
          location?: string | null
          show_attended_events?: boolean | null
          show_hosted_events?: boolean | null
          social_links?: Json | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string
          reason: string
          reported_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string
          reason: string
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          type: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string
          reason?: string
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          type?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          age_range: string | null
          allow_recommendations: boolean | null
          attendance_frequency: string | null
          created_at: string | null
          event_categories: string[] | null
          event_mode: string | null
          id: string
          location_city: string | null
          onboarding_completed: boolean
          preferred_format: string | null
          source: string | null
          topics: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_range?: string | null
          allow_recommendations?: boolean | null
          attendance_frequency?: string | null
          created_at?: string | null
          event_categories?: string[] | null
          event_mode?: string | null
          id?: string
          location_city?: string | null
          onboarding_completed?: boolean
          preferred_format?: string | null
          source?: string | null
          topics?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_range?: string | null
          allow_recommendations?: boolean | null
          attendance_frequency?: string | null
          created_at?: string | null
          event_categories?: string[] | null
          event_mode?: string | null
          id?: string
          location_city?: string | null
          onboarding_completed?: boolean
          preferred_format?: string | null
          source?: string | null
          topics?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_username_slug: {
        Args: { _name: string; _user_id: string }
        Returns: string
      }
      get_event_registration_count: {
        Args: { _event_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_event_status: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "organizer"
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
      app_role: ["admin", "user", "organizer"],
    },
  },
} as const
