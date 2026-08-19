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
      appointment_events: {
        Row: {
          actor_id: string | null
          appointment_id: string
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          payload: Json | null
          to_status: string | null
        }
        Insert: {
          actor_id?: string | null
          appointment_id: string
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          payload?: Json | null
          to_status?: string | null
        }
        Update: {
          actor_id?: string | null
          appointment_id?: string
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          payload?: Json | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_requests: {
        Row: {
          assigned_to: string | null
          contact_method: string
          converted_patient_id: string | null
          created_at: string
          follow_up_status: string | null
          id: string
          idempotency_key: string | null
          last_contact_at: string | null
          message: string | null
          name: string
          next_action_at: string | null
          phone_e164: string
          phone_normalized: string | null
          phone_raw: string
          preferred_date: string | null
          preferred_time: string | null
          priority: string | null
          source_page: string | null
          status: string
          temperature: string | null
          treatment: string | null
          updated_at: string
          utm: Json | null
        }
        Insert: {
          assigned_to?: string | null
          contact_method?: string
          converted_patient_id?: string | null
          created_at?: string
          follow_up_status?: string | null
          id?: string
          idempotency_key?: string | null
          last_contact_at?: string | null
          message?: string | null
          name: string
          next_action_at?: string | null
          phone_e164: string
          phone_normalized?: string | null
          phone_raw: string
          preferred_date?: string | null
          preferred_time?: string | null
          priority?: string | null
          source_page?: string | null
          status?: string
          temperature?: string | null
          treatment?: string | null
          updated_at?: string
          utm?: Json | null
        }
        Update: {
          assigned_to?: string | null
          contact_method?: string
          converted_patient_id?: string | null
          created_at?: string
          follow_up_status?: string | null
          id?: string
          idempotency_key?: string | null
          last_contact_at?: string | null
          message?: string | null
          name?: string
          next_action_at?: string | null
          phone_e164?: string
          phone_normalized?: string | null
          phone_raw?: string
          preferred_date?: string | null
          preferred_time?: string | null
          priority?: string | null
          source_page?: string | null
          status?: string
          temperature?: string | null
          treatment?: string | null
          updated_at?: string
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_requests_converted_patient_id_fkey"
            columns: ["converted_patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointment_requests_converted_patient_id_fkey"
            columns: ["converted_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          confirmation_status: string
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          practitioner_id: string | null
          previous_ends_at: string | null
          previous_starts_at: string | null
          request_id: string | null
          room: string | null
          starts_at: string
          status: string
          treatment: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          confirmation_status?: string
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          no_show_at?: string | null
          notes?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          previous_ends_at?: string | null
          previous_starts_at?: string | null
          request_id?: string | null
          room?: string | null
          starts_at: string
          status?: string
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          confirmation_status?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          no_show_at?: string | null
          notes?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          previous_ends_at?: string | null
          previous_starts_at?: string | null
          request_id?: string | null
          room?: string | null
          starts_at?: string
          status?: string
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "appointment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      follow_up_tasks: {
        Row: {
          appointment_id: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          completion_note: string | null
          created_at: string
          created_by: string | null
          dedupe_key: string | null
          description: string | null
          due_at: string | null
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          patient_id: string | null
          priority: string
          request_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_note?: string | null
          created_at?: string
          created_by?: string | null
          dedupe_key?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          patient_id?: string | null
          priority?: string
          request_id?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_note?: string | null
          created_at?: string
          created_by?: string | null
          dedupe_key?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          patient_id?: string | null
          priority?: string
          request_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "follow_up_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "appointment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          meta: Json | null
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          meta?: Json | null
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          meta?: Json | null
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      patient_activities: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          meta: Json | null
          patient_id: string | null
          request_id: string | null
          summary: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          patient_id?: string | null
          request_id?: string | null
          summary: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          patient_id?: string | null
          request_id?: string | null
          summary?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "appointment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          author_id: string | null
          body: string
          category: string | null
          created_at: string
          id: string
          patient_id: string
          pinned: boolean
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category?: string | null
          created_at?: string
          id?: string
          patient_id: string
          pinned?: boolean
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          pinned?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_staff_assignments: {
        Row: {
          active: boolean
          assigned_by: string | null
          assignment_type: string
          created_at: string
          ended_at: string | null
          id: string
          patient_id: string
          staff_user_id: string
        }
        Insert: {
          active?: boolean
          assigned_by?: string | null
          assignment_type?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          patient_id: string
          staff_user_id: string
        }
        Update: {
          active?: boolean
          assigned_by?: string | null
          assignment_type?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          patient_id?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_staff_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_staff_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments: {
        Row: {
          agreed_value: number | null
          created_at: string
          expected_end_date: string | null
          expected_value: number | null
          id: string
          next_step: string | null
          patient_id: string
          practitioner_id: string | null
          progress: number | null
          stage: string
          start_date: string | null
          status: string
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          agreed_value?: number | null
          created_at?: string
          expected_end_date?: string | null
          expected_value?: number | null
          id?: string
          next_step?: string | null
          patient_id: string
          practitioner_id?: string | null
          progress?: number | null
          stage?: string
          start_date?: string | null
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          agreed_value?: number | null
          created_at?: string
          expected_end_date?: string | null
          expected_value?: number | null
          id?: string
          next_step?: string | null
          patient_id?: string
          practitioner_id?: string | null
          progress?: number | null
          stage?: string
          start_date?: string | null
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          appointment_count: number
          archived: boolean
          assigned_to: string | null
          campaign: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          estimated_value: number | null
          full_name: string
          gender: string | null
          id: string
          last_contact_at: string | null
          lifecycle_status: string
          next_appointment_at: string | null
          next_follow_up_at: string | null
          no_show_count: number
          notes_summary: string | null
          phone_e164: string
          phone_normalized: string | null
          phone_raw: string | null
          preferred_contact: string | null
          source: string | null
          tags: string[] | null
          temperature: string | null
          treatment_interest: string | null
          updated_at: string
          whatsapp_available: boolean | null
        }
        Insert: {
          appointment_count?: number
          archived?: boolean
          assigned_to?: string | null
          campaign?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          estimated_value?: number | null
          full_name: string
          gender?: string | null
          id?: string
          last_contact_at?: string | null
          lifecycle_status?: string
          next_appointment_at?: string | null
          next_follow_up_at?: string | null
          no_show_count?: number
          notes_summary?: string | null
          phone_e164: string
          phone_normalized?: string | null
          phone_raw?: string | null
          preferred_contact?: string | null
          source?: string | null
          tags?: string[] | null
          temperature?: string | null
          treatment_interest?: string | null
          updated_at?: string
          whatsapp_available?: boolean | null
        }
        Update: {
          appointment_count?: number
          archived?: boolean
          assigned_to?: string | null
          campaign?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          estimated_value?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          last_contact_at?: string | null
          lifecycle_status?: string
          next_appointment_at?: string | null
          next_follow_up_at?: string | null
          no_show_count?: number
          notes_summary?: string | null
          phone_e164?: string
          phone_normalized?: string | null
          phone_raw?: string | null
          preferred_contact?: string | null
          source?: string | null
          tags?: string[] | null
          temperature?: string | null
          treatment_interest?: string | null
          updated_at?: string
          whatsapp_available?: boolean | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          correction_of: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          method: string
          note: string | null
          paid_at: string
          patient_id: string
          patient_treatment_id: string | null
          payment_reference: string | null
          quote_id: string | null
          received_by: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          correction_of?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          patient_id: string
          patient_treatment_id?: string | null
          payment_reference?: string | null
          quote_id?: string | null
          received_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          correction_of?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string
          patient_id?: string
          patient_treatment_id?: string | null
          payment_reference?: string | null
          quote_id?: string | null
          received_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_correction_of_fkey"
            columns: ["correction_of"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatment_financials"
            referencedColumns: ["patient_treatment_id"]
          },
          {
            foreignKeyName: "payments_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string | null
          discount_amount: number
          id: string
          label: string
          quantity: number
          quote_id: string
          sort_order: number
          total: number
          treatment_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_amount?: number
          id?: string
          label: string
          quantity?: number
          quote_id: string
          sort_order?: number
          total?: number
          treatment_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_amount?: number
          id?: string
          label?: string
          quantity?: number
          quote_id?: string
          sort_order?: number
          total?: number
          treatment_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          amount: number
          assigned_to: string | null
          created_at: string
          created_by: string | null
          currency: string
          discount: number
          expires_at: string | null
          final_amount: number
          id: string
          notes: string | null
          patient_id: string
          patient_note: string | null
          patient_treatment_id: string | null
          quote_number: string | null
          reference: string | null
          refusal_reason: string | null
          refused_at: string | null
          sent_at: string | null
          status: string
          title: string | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          amount?: number
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          expires_at?: string | null
          final_amount?: number
          id?: string
          notes?: string | null
          patient_id: string
          patient_note?: string | null
          patient_treatment_id?: string | null
          quote_number?: string | null
          reference?: string | null
          refusal_reason?: string | null
          refused_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          expires_at?: string | null
          final_amount?: number
          id?: string
          notes?: string | null
          patient_id?: string
          patient_note?: string | null
          patient_treatment_id?: string | null
          quote_number?: string | null
          reference?: string | null
          refusal_reason?: string | null
          refused_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "quotes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatment_financials"
            referencedColumns: ["patient_treatment_id"]
          },
          {
            foreignKeyName: "quotes_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          scope: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          name: string
          scope: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          color: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      treatments: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          default_duration_min: number | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          price_max: number | null
          price_min: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          default_duration_min?: number | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          default_duration_min?: number | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_events: {
        Row: {
          created_at: string
          device: string | null
          event_type: string
          id: string
          meta: Json | null
          page: string | null
          session_id: string | null
          utm: Json | null
        }
        Insert: {
          created_at?: string
          device?: string | null
          event_type: string
          id?: string
          meta?: Json | null
          page?: string | null
          session_id?: string | null
          utm?: Json | null
        }
        Update: {
          created_at?: string
          device?: string | null
          event_type?: string
          id?: string
          meta?: Json | null
          page?: string | null
          session_id?: string | null
          utm?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      patient_financials: {
        Row: {
          balance: number | null
          patient_id: string | null
          total_due: number | null
          total_paid: number | null
        }
        Insert: {
          balance?: never
          patient_id?: string | null
          total_due?: never
          total_paid?: never
        }
        Update: {
          balance?: never
          patient_id?: string | null
          total_due?: never
          total_paid?: never
        }
        Relationships: []
      }
      patient_treatment_financials: {
        Row: {
          balance: number | null
          due: number | null
          paid: number | null
          patient_id: string | null
          patient_treatment_id: string | null
        }
        Insert: {
          balance?: never
          due?: never
          paid?: never
          patient_id?: string | null
          patient_treatment_id?: string | null
        }
        Update: {
          balance?: never
          due?: never
          paid?: never
          patient_id?: string | null
          patient_treatment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financials"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_quote: {
        Args: { _expected_updated_at?: string; _quote_id: string }
        Returns: string
      }
      admin_global_search: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          id: string
          occurred_at: string
          result_type: string
          route: string
          status: string
          subtitle: string
          title: string
        }[]
      }
      can_access_appointment: {
        Args: { _appt_id: string; _user_id?: string }
        Returns: boolean
      }
      can_access_patient: {
        Args: { _patient_id: string; _user_id?: string }
        Returns: boolean
      }
      can_access_treatment: {
        Args: { _pt_id: string; _user_id?: string }
        Returns: boolean
      }
      convert_request_to_patient: {
        Args: { _existing_patient_id?: string; _request_id: string }
        Returns: string
      }
      generate_quote_followups: { Args: never; Returns: number }
      generate_quote_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_marketing: { Args: { _user_id?: string }; Returns: boolean }
      is_practitioner: { Args: { _user_id?: string }; Returns: boolean }
      is_reception: { Args: { _user_id?: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      list_my_notifications: {
        Args: { p_limit?: number }
        Returns: {
          body: string
          created_at: string
          id: string
          link: string
          priority: string
          read_at: string
          read_for_me: boolean
          title: string
          type: string
          user_id: string
        }[]
      }
      normalize_phone: { Args: { _raw: string }; Returns: string }
      patient_financial_summary: {
        Args: { _patient_id: string }
        Returns: Json
      }
      quote_balance: {
        Args: { _quote_id: string }
        Returns: {
          paid: number
          remaining: number
          total: number
        }[]
      }
      record_payment: {
        Args: {
          _allow_overpayment?: boolean
          _amount: number
          _method: string
          _note?: string
          _paid_at?: string
          _patient_id: string
          _patient_treatment_id?: string
          _payment_reference?: string
          _quote_id?: string
        }
        Returns: string
      }
      refuse_quote: {
        Args: {
          _expected_updated_at?: string
          _quote_id: string
          _reason?: string
        }
        Returns: undefined
      }
      revenue_kpis: { Args: { _from?: string; _to?: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      suggest_patients_for_request: {
        Args: { _request_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          phone_e164: string
        }[]
      }
      unread_notifications_count: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "reception"
        | "practitioner"
        | "marketing"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "reception",
        "practitioner",
        "marketing",
      ],
    },
  },
} as const
