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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          order_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          order_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          order_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          created_at: string
          deliverer_id: string | null
          delivery_fee: number
          delivery_latitude: number | null
          delivery_location: string
          delivery_longitude: number | null
          delivery_proof_url: string | null
          description: string
          estimated_item_cost: number
          id: string
          item_image_url: string | null
          item_link: string | null
          pickup_latitude: number | null
          pickup_location: string
          pickup_longitude: number | null
          requester_confirmed: boolean | null
          requester_id: string
          status: Database["public"]["Enums"]["order_status"]
          title: string
          total_amount: number | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          deliverer_id?: string | null
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_location: string
          delivery_longitude?: number | null
          delivery_proof_url?: string | null
          description?: string
          estimated_item_cost?: number
          id?: string
          item_image_url?: string | null
          item_link?: string | null
          pickup_latitude?: number | null
          pickup_location: string
          pickup_longitude?: number | null
          requester_confirmed?: boolean | null
          requester_id: string
          status?: Database["public"]["Enums"]["order_status"]
          title: string
          total_amount?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          deliverer_id?: string | null
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_location?: string
          delivery_longitude?: number | null
          delivery_proof_url?: string | null
          description?: string
          estimated_item_cost?: number
          id?: string
          item_image_url?: string | null
          item_link?: string | null
          pickup_latitude?: number | null
          pickup_location?: string
          pickup_longitude?: number | null
          requester_confirmed?: boolean | null
          requester_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          title?: string
          total_amount?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          college_name: string
          created_at: string
          full_name: string
          hostel_room: string | null
          id: string
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          phone: string | null
          student_email: string | null
          total_deliveries: number | null
          total_earnings: number | null
          total_requests: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          college_name?: string
          created_at?: string
          full_name?: string
          hostel_room?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          student_email?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          total_requests?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          college_name?: string
          created_at?: string
          full_name?: string
          hostel_room?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          student_email?: string | null
          total_deliveries?: number | null
          total_earnings?: number | null
          total_requests?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rated_id: string
          rater_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rated_id: string
          rater_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rated_id?: string
          rater_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_order_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      item_category:
        | "stationery"
        | "food"
        | "medicine"
        | "electronics"
        | "groceries"
        | "clothing"
        | "other"
      order_status:
        | "pending"
        | "accepted"
        | "picked_up"
        | "delivered"
        | "confirmed"
        | "cancelled"
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
      item_category: [
        "stationery",
        "food",
        "medicine",
        "electronics",
        "groceries",
        "clothing",
        "other",
      ],
      order_status: [
        "pending",
        "accepted",
        "picked_up",
        "delivered",
        "confirmed",
        "cancelled",
      ],
    },
  },
} as const
