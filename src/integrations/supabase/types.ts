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
      events: {
        Row: {
          auto_approve_registrations: boolean | null
          category: string
          created_at: string | null
          created_by: string
          date: string
          description: string | null
          event_type: string | null
          host_description: string | null
          host_email: string | null
          host_name: string | null
          host_phone: string | null
          id: string
          image_url: string | null
          location: string
          max_attendees: number | null
          meeting_link: string | null
          price: number
          registration_deadline: string | null
          rejection_reason: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_approve_registrations?: boolean | null
          category: string
          created_at?: string | null
          created_by: string
          date: string
          description?: string | null
          event_type?: string | null
          host_description?: string | null
          host_email?: string | null
          host_name?: string | null
          host_phone?: string | null
          id: string
          image_url?: string | null
          location: string
          max_attendees?: number | null
          meeting_link?: string | null
          price?: number
          registration_deadline?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_approve_registrations?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string
          date?: string
          description?: string | null
          event_type?: string | null
          host_description?: string | null
          host_email?: string | null
          host_name?: string | null
          host_phone?: string | null
          id?: string
          image_url?: string | null
          location?: string
          max_attendees?: number | null
          meeting_link?: string | null
          price?: number
          registration_deadline?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
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
