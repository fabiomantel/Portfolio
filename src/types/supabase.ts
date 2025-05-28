export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string
          user_id: string
          name: string
          ticker: string
          exchange: string
          trading_currency: string
          broker: string
          current_price: number
          previous_price: number
          last_updated: string
          current_price_overwritten: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          ticker: string
          exchange: string
          trading_currency: string
          broker: string
          current_price?: number
          previous_price?: number
          last_updated?: string
          current_price_overwritten?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          ticker?: string
          exchange?: string
          trading_currency?: string
          broker?: string
          current_price?: number
          previous_price?: number
          last_updated?: string
          current_price_overwritten?: boolean
          created_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          asset_id: string
          price: number
          quantity: number
          date: string
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          price: number
          quantity: number
          date: string
          currency: string
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          price?: number
          quantity?: number
          date?: string
          currency?: string
          created_at?: string
        }
      }
      rsus: {
        Row: {
          id: string
          user_id: string
          ticker: string
          company_name: string
          grant_date: string
          total_granted: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          company_name: string
          grant_date: string
          total_granted: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ticker?: string
          company_name?: string
          grant_date?: string
          total_granted?: number
          created_at?: string
        }
      }
      vesting_entries: {
        Row: {
          id: string
          rsu_id: string
          date: string
          quantity: number
          is_vested: boolean
          created_at: string
        }
        Insert: {
          id?: string
          rsu_id: string
          date: string
          quantity: number
          is_vested?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          rsu_id?: string
          date?: string
          quantity?: number
          is_vested?: boolean
          created_at?: string
        }
      }
      espps: {
        Row: {
          id: string
          user_id: string
          ticker: string
          company_name: string
          grant_date: string
          purchase_price: number
          market_price: number
          quantity: number
          discount: number
          broker: string
          cycle_start_date: string
          cycle_end_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          company_name: string
          grant_date: string
          purchase_price: number
          market_price: number
          quantity: number
          discount: number
          broker: string
          cycle_start_date: string
          cycle_end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ticker?: string
          company_name?: string
          grant_date?: string
          purchase_price?: number
          market_price?: number
          quantity?: number
          discount?: number
          broker?: string
          cycle_start_date?: string
          cycle_end_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}