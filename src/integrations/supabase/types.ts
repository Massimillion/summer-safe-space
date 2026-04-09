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
      add_ons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_cents: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
        }
        Relationships: []
      }
      available_dates: {
        Row: {
          available_date: string
          date_type: Database["public"]["Enums"]["date_type"]
          id: string
          is_active: boolean
          school: Database["public"]["Enums"]["school_enum"]
          slots_remaining: number | null
          time_slot: string | null
        }
        Insert: {
          available_date: string
          date_type: Database["public"]["Enums"]["date_type"]
          id?: string
          is_active?: boolean
          school: Database["public"]["Enums"]["school_enum"]
          slots_remaining?: number | null
          time_slot?: string | null
        }
        Update: {
          available_date?: string
          date_type?: Database["public"]["Enums"]["date_type"]
          id?: string
          is_active?: boolean
          school?: Database["public"]["Enums"]["school_enum"]
          slots_remaining?: number | null
          time_slot?: string | null
        }
        Relationships: []
      }
      dorms: {
        Row: {
          description: string | null
          id: string
          is_active: boolean
          name: string
          requires_address: boolean
          school: Database["public"]["Enums"]["school_enum"]
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          requires_address?: boolean
          school: Database["public"]["Enums"]["school_enum"]
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          requires_address?: boolean
          school?: Database["public"]["Enums"]["school_enum"]
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          add_on_id: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          price_cents: number
          quantity: number
        }
        Insert: {
          add_on_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          price_cents?: number
          quantity?: number
        }
        Update: {
          add_on_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          price_cents?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          comments: string | null
          created_at: string
          custom_box_count: number | null
          deposit_paid: boolean | null
          dropoff_date_id: string | null
          id: string
          package_id: string | null
          pickup_date_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          storage_term: string
          stripe_session_id: string | null
          student_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          custom_box_count?: number | null
          deposit_paid?: boolean | null
          dropoff_date_id?: string | null
          id?: string
          package_id?: string | null
          pickup_date_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          storage_term?: string
          stripe_session_id?: string | null
          student_id: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          custom_box_count?: number | null
          deposit_paid?: boolean | null
          dropoff_date_id?: string | null
          id?: string
          package_id?: string | null
          pickup_date_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          storage_term?: string
          stripe_session_id?: string | null
          student_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_dropoff_date_id_fkey"
            columns: ["dropoff_date_id"]
            isOneToOne: false
            referencedRelation: "available_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_date_id_fkey"
            columns: ["pickup_date_id"]
            isOneToOne: false
            referencedRelation: "available_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          num_boxes: number
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          num_boxes?: number
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          num_boxes?: number
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      parents: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          description: string | null
          id: string
          order_id: string
          payment_type: string
          stripe_payment_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          payment_type?: string
          stripe_payment_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          payment_type?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address_line: string | null
          created_at: string
          dorm_id: string | null
          email: string
          first_name: string
          id: string
          is_off_campus: boolean
          last_name: string
          phone: string | null
          school: Database["public"]["Enums"]["school_enum"]
          stripe_customer_id: string | null
          user_id: string
        }
        Insert: {
          address_line?: string | null
          created_at?: string
          dorm_id?: string | null
          email: string
          first_name: string
          id?: string
          is_off_campus?: boolean
          last_name: string
          phone?: string | null
          school: Database["public"]["Enums"]["school_enum"]
          stripe_customer_id?: string | null
          user_id: string
        }
        Update: {
          address_line?: string | null
          created_at?: string
          dorm_id?: string | null
          email?: string
          first_name?: string
          id?: string
          is_off_campus?: boolean
          last_name?: string
          phone?: string | null
          school?: Database["public"]["Enums"]["school_enum"]
          stripe_customer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
        ]
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
      warehouse_locations: {
        Row: {
          bin: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          shelf: string | null
          zone: string | null
        }
        Insert: {
          bin?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          shelf?: string | null
          zone?: string | null
        }
        Update: {
          bin?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          shelf?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      update_order_details: {
        Args: {
          _comments?: string
          _dropoff_date_id?: string
          _order_id: string
          _package_id?: string
          _pickup_date_id?: string
          _storage_term?: string
          _total_cents?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      date_type: "dropoff" | "pickup"
      order_status:
        | "booked"
        | "boxes_delivered"
        | "boxes_picked_up"
        | "in_storage"
        | "delivered_back"
        | "cancelled"
      school_enum: "cu_boulder" | "du"
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
      app_role: ["admin", "user"],
      date_type: ["dropoff", "pickup"],
      order_status: [
        "booked",
        "boxes_delivered",
        "boxes_picked_up",
        "in_storage",
        "delivered_back",
        "cancelled",
      ],
      school_enum: ["cu_boulder", "du"],
    },
  },
} as const
