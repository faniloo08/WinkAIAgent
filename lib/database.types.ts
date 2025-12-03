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
      candidates: {
        Row: {
          id: string
          email: string
          name: string
          position: string
          offer_id: string | null
          status: string
          interview_date: string | null
          interview_time: string | null
          google_calendar_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          position: string
          offer_id?: string | null
          status?: string
          interview_date?: string | null
          interview_time?: string | null
          google_calendar_link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          position?: string
          offer_id?: string | null
          status?: string
          interview_date?: string | null
          interview_time?: string | null
          google_calendar_link?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      emails_sent: {
        Row: {
          id: string
          candidate_id: string
          email_type: string
          sent_at: string
          status: string
        }
        Insert: {
          id?: string
          candidate_id: string
          email_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          email_type?: string
          sent_at?: string
          status?: string
        }
      }
      confirmations: {
        Row: {
          id: string
          candidate_id: string
          confirmation_token: string
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          confirmation_token: string
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          confirmation_token?: string
          confirmed_at?: string | null
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
  }
}