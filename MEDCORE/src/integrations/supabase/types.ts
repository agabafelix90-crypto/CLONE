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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string | null
          created_at: string
          created_by: string | null
          doctor_name: string | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          reminder_sent: boolean | null
          status: string
        }
        Insert: {
          appointment_date: string
          appointment_time?: string | null
          created_at?: string
          created_by?: string | null
          doctor_name?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          reminder_sent?: boolean | null
          status?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string | null
          created_at?: string
          created_by?: string | null
          doctor_name?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          reminder_sent?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          id: string
          patient_id: string | null
          status: Database["public"]["Enums"]["bed_status"]
          ward_id: string
        }
        Insert: {
          bed_number: string
          id?: string
          patient_id?: string | null
          status?: Database["public"]["Enums"]["bed_status"]
          ward_id: string
        }
        Update: {
          bed_number?: string
          id?: string
          patient_id?: string | null
          status?: Database["public"]["Enums"]["bed_status"]
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_items: {
        Row: {
          amount: number
          billed_by: string | null
          created_at: string
          id: string
          item_name: string
          item_type: string
          notes: string | null
          paid_at: string | null
          patient_id: string
          quantity: number
          reference_id: string | null
          status: string
          total_amount: number
        }
        Insert: {
          amount?: number
          billed_by?: string | null
          created_at?: string
          id?: string
          item_name: string
          item_type?: string
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          quantity?: number
          reference_id?: string | null
          status?: string
          total_amount?: number
        }
        Update: {
          amount?: number
          billed_by?: string | null
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          quantity?: number
          reference_id?: string | null
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          normal_ranges: string | null
          parameters: Json | null
          price: number | null
          test_name: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          normal_ranges?: string | null
          parameters?: Json | null
          price?: number | null
          test_name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          normal_ranges?: string | null
          parameters?: Json | null
          price?: number | null
          test_name?: string
        }
        Relationships: []
      }
      lab_tests: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          id: string
          is_positive: boolean | null
          normal_range: string | null
          notes: string | null
          ordered_by: string | null
          patient_id: string
          performed_by: string | null
          result: string | null
          result_data: Json | null
          status: string
          test_name: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_positive?: boolean | null
          normal_range?: string | null
          notes?: string | null
          ordered_by?: string | null
          patient_id: string
          performed_by?: string | null
          result?: string | null
          result_data?: Json | null
          status?: string
          test_name: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_positive?: boolean | null
          normal_range?: string | null
          notes?: string | null
          ordered_by?: string | null
          patient_id?: string
          performed_by?: string | null
          result?: string | null
          result_data?: Json | null
          status?: string
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          administered_at: string | null
          administered_by: string | null
          created_at: string
          dosage: string
          drug_name: string
          frequency: string
          id: string
          notes: string | null
          patient_id: string
          route: string
          scheduled_time: string
          status: Database["public"]["Enums"]["med_status"]
        }
        Insert: {
          administered_at?: string | null
          administered_by?: string | null
          created_at?: string
          dosage: string
          drug_name: string
          frequency: string
          id?: string
          notes?: string | null
          patient_id: string
          route?: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["med_status"]
        }
        Update: {
          administered_at?: string | null
          administered_by?: string | null
          created_at?: string
          dosage?: string
          drug_name?: string
          frequency?: string
          id?: string
          notes?: string | null
          patient_id?: string
          route?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["med_status"]
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          abortions: string | null
          address: string | null
          admitted_date: string | null
          age: number
          allergies: string | null
          bed_number: string | null
          blood_group: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          diagnosis: string | null
          dob: string | null
          edd: string | null
          gender: string | null
          gravida: string | null
          id: string
          lnmp: string | null
          name: string
          nok_contact: string | null
          nok_name: string | null
          nok_relationship: string | null
          para: string | null
          phone: string | null
          religion: string | null
          rhesus: string | null
          severity: string | null
          status: Database["public"]["Enums"]["patient_status"]
          symptoms: string | null
          triaged_at: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          abortions?: string | null
          address?: string | null
          admitted_date?: string | null
          age: number
          allergies?: string | null
          bed_number?: string | null
          blood_group?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          dob?: string | null
          edd?: string | null
          gender?: string | null
          gravida?: string | null
          id?: string
          lnmp?: string | null
          name: string
          nok_contact?: string | null
          nok_name?: string | null
          nok_relationship?: string | null
          para?: string | null
          phone?: string | null
          religion?: string | null
          rhesus?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          symptoms?: string | null
          triaged_at?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          abortions?: string | null
          address?: string | null
          admitted_date?: string | null
          age?: number
          allergies?: string | null
          bed_number?: string | null
          blood_group?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          dob?: string | null
          edd?: string | null
          gender?: string | null
          gravida?: string | null
          id?: string
          lnmp?: string | null
          name?: string
          nok_contact?: string | null
          nok_name?: string | null
          nok_relationship?: string | null
          para?: string | null
          phone?: string | null
          religion?: string | null
          rhesus?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          symptoms?: string | null
          triaged_at?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      pharmacy_inventory: {
        Row: {
          batch_number: string | null
          category: string | null
          cost_price: number | null
          created_at: string
          drug_name: string
          expiry_date: string | null
          generic_name: string | null
          id: string
          quantity_in_stock: number
          reorder_level: number | null
          supplier: string | null
          unit: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          drug_name: string
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          quantity_in_stock?: number
          reorder_level?: number | null
          supplier?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          drug_name?: string
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          quantity_in_stock?: number
          reorder_level?: number | null
          supplier?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_sale_items: {
        Row: {
          created_at: string
          drug_name: string
          id: string
          inventory_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          drug_name: string
          id?: string
          inventory_id: string
          quantity?: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          drug_name?: string
          id?: string
          inventory_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sale_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sales: {
        Row: {
          created_at: string
          id: string
          patient_id: string | null
          patient_name: string | null
          payment_method: string | null
          receipt_number: string
          sale_type: string
          sold_by: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id?: string | null
          patient_name?: string | null
          payment_method?: string | null
          receipt_number: string
          sale_type?: string
          sold_by?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string | null
          patient_name?: string | null
          payment_method?: string | null
          receipt_number?: string
          sale_type?: string
          sold_by?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          dispensed_at: string | null
          dispensed_by: string | null
          dosage: string
          drug_name: string
          frequency: string
          id: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          quantity: number
          status: string
        }
        Insert: {
          created_at?: string
          dispensed_at?: string | null
          dispensed_by?: string | null
          dosage: string
          drug_name: string
          frequency: string
          id?: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          quantity?: number
          status?: string
        }
        Update: {
          created_at?: string
          dispensed_at?: string | null
          dispensed_by?: string | null
          dosage?: string
          drug_name?: string
          frequency?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          quantity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          recorded_by: string | null
          shift: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          id?: string
          recorded_by?: string | null
          shift?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          recorded_by?: string | null
          shift?: string
        }
        Relationships: []
      }
      sms_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          momo_transaction_id: string | null
          phone_number: string | null
          reference_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          momo_transaction_id?: string | null
          phone_number?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          momo_transaction_id?: string | null
          phone_number?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_credits: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          api_response: Json | null
          category: string
          char_count: number
          cost: number
          created_at: string
          id: string
          message: string
          message_type: string
          patient_id: string | null
          recipient_name: string | null
          recipient_phone: string
          sent_by: string | null
          status: string
        }
        Insert: {
          api_response?: Json | null
          category?: string
          char_count?: number
          cost?: number
          created_at?: string
          id?: string
          message: string
          message_type?: string
          patient_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          sent_by?: string | null
          status?: string
        }
        Update: {
          api_response?: Json | null
          category?: string
          char_count?: number
          cost?: number
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          patient_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      store_invoice_items: {
        Row: {
          cost_price: number
          created_at: string
          drug_name: string
          id: string
          inventory_id: string
          invoice_id: string
          quantity: number
          total_price: number
        }
        Insert: {
          cost_price?: number
          created_at?: string
          drug_name: string
          id?: string
          inventory_id: string
          invoice_id: string
          quantity?: number
          total_price?: number
        }
        Update: {
          cost_price?: number
          created_at?: string
          drug_name?: string
          id?: string
          inventory_id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_invoice_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "store_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      store_invoices: {
        Row: {
          created_at: string
          id: string
          invoice_number: string
          notes: string | null
          received_by: string | null
          supplier: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number: string
          notes?: string | null
          received_by?: string | null
          supplier?: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          received_by?: string | null
          supplier?: string
          total_amount?: number
        }
        Relationships: []
      }
      store_transfers: {
        Row: {
          created_at: string
          drug_name: string
          id: string
          inventory_id: string
          notes: string | null
          quantity: number
          transferred_by: string | null
        }
        Insert: {
          created_at?: string
          drug_name: string
          id?: string
          inventory_id: string
          notes?: string | null
          quantity?: number
          transferred_by?: string | null
        }
        Update: {
          created_at?: string
          drug_name?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity?: number
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_transfers_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          expires_at: string
          id: string
          momo_reference: string | null
          payment_status: string
          phone_number: string | null
          plan: string
          starts_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          expires_at: string
          id?: string
          momo_reference?: string | null
          payment_status?: string
          phone_number?: string | null
          plan?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string
          id?: string
          momo_reference?: string | null
          payment_status?: string
          phone_number?: string | null
          plan?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          diastolic: number | null
          id: string
          notes: string | null
          oxygen_sat: number | null
          patient_id: string
          pulse: number | null
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          systolic: number | null
          temperature: number | null
        }
        Insert: {
          diastolic?: number | null
          id?: string
          notes?: string | null
          oxygen_sat?: number | null
          patient_id: string
          pulse?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          systolic?: number | null
          temperature?: number | null
        }
        Update: {
          diastolic?: number | null
          id?: string
          notes?: string | null
          oxygen_sat?: number | null
          patient_id?: string
          pulse?: number | null
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          systolic?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wards: {
        Row: {
          created_at: string
          id: string
          name: string
          total_beds: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          total_beds?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          total_beds?: number
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
    }
    Enums: {
      app_role:
        | "admin"
        | "doctor"
        | "nurse"
        | "pharmacist"
        | "cashier"
        | "receptionist"
      bed_status: "Available" | "Occupied" | "Maintenance"
      med_status: "Pending" | "Given" | "Missed" | "Held"
      patient_status:
        | "Just Come"
        | "On Antenatal"
        | "Post Natal"
        | "In Labour"
        | "Discharged"
        | "Admitted"
        | "Outpatient"
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
        "doctor",
        "nurse",
        "pharmacist",
        "cashier",
        "receptionist",
      ],
      bed_status: ["Available", "Occupied", "Maintenance"],
      med_status: ["Pending", "Given", "Missed", "Held"],
      patient_status: [
        "Just Come",
        "On Antenatal",
        "Post Natal",
        "In Labour",
        "Discharged",
        "Admitted",
        "Outpatient",
      ],
    },
  },
} as const
