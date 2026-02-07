/**
 * Supabase Database Types for Liquid Memory
 * US-015: Database schema definitions
 */

export interface Database {
  public: {
    Tables: {
      creative_items: {
        Row: {
          id: string;
          user_id: string;
          local_id: string;
          image_url: string;
          thumbnail_url: string;
          prompt_subject: string | null;
          prompt_environment: string | null;
          prompt_composition: string | null;
          prompt_lighting: string | null;
          prompt_mood: string | null;
          prompt_style: string | null;
          prompt_camera: string | null;
          prompt_color: string | null;
          natural_prompt: string;
          tags: string[];
          sync_status: 'synced' | 'pending' | 'conflict';
          is_encrypted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['creative_items']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['creative_items']['Insert']>;
      };
      sync_logs: {
        Row: {
          id: string;
          user_id: string;
          operation: 'create' | 'update' | 'delete';
          table_name: string;
          record_id: string;
          payload: Record<string, unknown>;
          retry_count: number;
          error_message: string | null;
          created_at: string;
          synced_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sync_logs']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['sync_logs']['Insert']>;
      };
      user_settings: {
        Row: {
          user_id: string;
          encryption_enabled: boolean;
          encryption_key_salt: string | null;
          last_sync_at: string | null;
          sync_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>;
      };
    };
  };
}

// Type helpers
export type CreativeItemRow = Database['public']['Tables']['creative_items']['Row'];
export type SyncLogRow = Database['public']['Tables']['sync_logs']['Row'];
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];
