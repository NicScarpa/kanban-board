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
      projects: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          tags: string[]
          prompt: string | null
          attachments: Json
          status: 'planning' | 'error' | 'in-progress' | 'human-review' | 'ai-review' | 'to-verify' | 'done'
          order: number | null
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          tags?: string[]
          prompt?: string | null
          attachments?: Json
          status: 'planning' | 'error' | 'in-progress' | 'human-review' | 'ai-review' | 'to-verify' | 'done'
          order?: number | null
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          tags?: string[]
          prompt?: string | null
          attachments?: Json
          status?: 'planning' | 'error' | 'in-progress' | 'human-review' | 'ai-review' | 'done'
          order?: number | null
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
