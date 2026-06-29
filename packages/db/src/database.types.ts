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
      claim_lines_current: {
        Row: {
          cdt_code: string
          claim_id: string
          fee_allowed: number | null
          fee_billed: number
          id: string
          line_index: number
          quadrant: string | null
          tooth: string | null
        }
        Insert: {
          cdt_code: string
          claim_id: string
          fee_allowed?: number | null
          fee_billed: number
          id?: string
          line_index: number
          quadrant?: string | null
          tooth?: string | null
        }
        Update: {
          cdt_code?: string
          claim_id?: string
          fee_allowed?: number | null
          fee_billed?: number
          id?: string
          line_index?: number
          quadrant?: string | null
          tooth?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_lines_current_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_current"
            referencedColumns: ["id"]
          },
        ]
      }
      claims_current: {
        Row: {
          clinic_id: string
          created_at: string
          external_claim_id: string
          id: string
          last_event_id: string | null
          patient_ref: string
          payer_name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          external_claim_id: string
          id?: string
          last_event_id?: string | null
          patient_ref: string
          payer_name: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          external_claim_id?: string
          id?: string
          last_event_id?: string | null
          patient_ref?: string
          payer_name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_current_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_current_last_event_id_fkey"
            columns: ["last_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_current_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_current: {
        Row: {
          active: boolean
          alerts: string[]
          annual_max_remaining: number | null
          breakdown: Json
          checked_at: string
          clinic_id: string
          deductible_remaining: number | null
          id: string
          patient_ref: string
          payer_name: string
          source_event_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          alerts?: string[]
          annual_max_remaining?: number | null
          breakdown?: Json
          checked_at?: string
          clinic_id: string
          deductible_remaining?: number | null
          id?: string
          patient_ref: string
          payer_name: string
          source_event_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          alerts?: string[]
          annual_max_remaining?: number | null
          breakdown?: Json
          checked_at?: string
          clinic_id?: string
          deductible_remaining?: number | null
          id?: string
          patient_ref?: string
          payer_name?: string
          source_event_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_current_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_current_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_current_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          id: string
          name: string
          pms_type: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pms_type?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pms_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          payload: Json
          tenant_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          payload: Json
          tenant_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      flags_open: {
        Row: {
          cdt_code: string | null
          claim_id: string
          created_at: string
          dollar_impact: number | null
          flag_type: string
          id: string
          line_index: number | null
          raised_event_id: string
          reason: string
          severity: string
          suggested_fix: string | null
          tenant_id: string
        }
        Insert: {
          cdt_code?: string | null
          claim_id: string
          created_at?: string
          dollar_impact?: number | null
          flag_type: string
          id?: string
          line_index?: number | null
          raised_event_id: string
          reason: string
          severity: string
          suggested_fix?: string | null
          tenant_id: string
        }
        Update: {
          cdt_code?: string | null
          claim_id?: string
          created_at?: string
          dollar_impact?: number | null
          flag_type?: string
          id?: string
          line_index?: number | null
          raised_event_id?: string
          reason?: string
          severity?: string
          suggested_fix?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_open_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_open_raised_event_id_fkey"
            columns: ["raised_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_open_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      flags_resolved: {
        Row: {
          claim_id: string
          flag_type: string
          id: string
          resolution_event_id: string
          resolution_reason: string | null
          resolved_at: string
          severity: string
          status: string
          tenant_id: string
        }
        Insert: {
          claim_id: string
          flag_type: string
          id?: string
          resolution_event_id: string
          resolution_reason?: string | null
          resolved_at?: string
          severity: string
          status: string
          tenant_id: string
        }
        Update: {
          claim_id?: string
          flag_type?: string
          id?: string
          resolution_event_id?: string
          resolution_reason?: string | null
          resolved_at?: string
          severity?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_resolved_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_resolved_resolution_event_id_fkey"
            columns: ["resolution_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_resolved_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      outcomes: {
        Row: {
          claim_id: string
          id: string
          observed_at: string
          paid_amount: number
          remark_code: string | null
          remark_text: string | null
          result: string
          source_event_id: string
          tenant_id: string
        }
        Insert: {
          claim_id: string
          id?: string
          observed_at?: string
          paid_amount?: number
          remark_code?: string | null
          remark_text?: string | null
          result: string
          source_event_id: string
          tenant_id: string
        }
        Update: {
          claim_id?: string
          id?: string
          observed_at?: string
          paid_amount?: number
          remark_code?: string | null
          remark_text?: string | null
          result?: string
          source_event_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims_current"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcomes_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcomes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payer_intelligence: {
        Row: {
          avg_paid_amount: number | null
          cdt_code: string
          common_remark_codes: Json
          denied_count: number
          downcoded_count: number
          id: string
          paid_count: number
          payer_name: string
          prediction_count: number
          sample_size: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avg_paid_amount?: number | null
          cdt_code: string
          common_remark_codes?: Json
          denied_count?: number
          downcoded_count?: number
          id?: string
          paid_count?: number
          payer_name: string
          prediction_count?: number
          sample_size?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avg_paid_amount?: number | null
          cdt_code?: string
          common_remark_codes?: Json
          denied_count?: number
          downcoded_count?: number
          id?: string
          paid_count?: number
          payer_name?: string
          prediction_count?: number
          sample_size?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payer_intelligence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_clinic_id: { Args: never; Returns: string }
      auth_tenant_id: { Args: never; Returns: string }
      auth_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
