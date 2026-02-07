-- Initial Schema for Liquid Memory Cloud Sync
-- US-015: Supabase Backend Setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Creative Items Table
-- ============================================
CREATE TABLE creative_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL, -- Original local ID for correlation
    
    -- Image storage
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    
    -- Prompt dimensions (flattened for query efficiency)
    prompt_subject TEXT,
    prompt_environment TEXT,
    prompt_composition TEXT,
    prompt_lighting TEXT,
    prompt_mood TEXT,
    prompt_style TEXT,
    prompt_camera TEXT,
    prompt_color TEXT,
    
    -- Combined natural prompt
    natural_prompt TEXT NOT NULL DEFAULT '',
    
    -- Tags array
    tags TEXT[] DEFAULT '{}',
    
    -- Sync metadata
    sync_status TEXT NOT NULL DEFAULT 'synced' 
        CHECK (sync_status IN ('synced', 'pending', 'conflict')),
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Constraints
    CONSTRAINT unique_local_id_per_user UNIQUE (user_id, local_id)
);

-- Indexes for creative_items
CREATE INDEX idx_creative_items_user_id ON creative_items(user_id);
CREATE INDEX idx_creative_items_updated_at ON creative_items(updated_at);
CREATE INDEX idx_creative_items_sync_status ON creative_items(sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_creative_items_deleted_at ON creative_items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_creative_items_tags ON creative_items USING GIN(tags);

-- Full-text search on prompts
CREATE INDEX idx_creative_items_search ON creative_items 
    USING gin(to_tsvector('english', 
        COALESCE(prompt_subject, '') || ' ' ||
        COALESCE(prompt_environment, '') || ' ' ||
        COALESCE(prompt_style, '') || ' ' ||
        natural_prompt
    ));

-- ============================================
-- Sync Logs Table (Offline Queue)
-- ============================================
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    
    CONSTRAINT unique_pending_operation UNIQUE (user_id, record_id, synced_at)
);

CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);
CREATE INDEX idx_sync_logs_pending ON sync_logs(user_id, synced_at) WHERE synced_at IS NULL;

-- ============================================
-- User Settings Table
-- ============================================
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Encryption settings
    encryption_enabled BOOLEAN NOT NULL DEFAULT false,
    encryption_key_salt TEXT, -- Salt for key derivation (NOT the key itself!)
    
    -- Sync settings
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE creative_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Creative Items policies
CREATE POLICY "Users can only access their own items"
    ON creative_items
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Sync Logs policies
CREATE POLICY "Users can only access their own sync logs"
    ON sync_logs
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- User Settings policies
CREATE POLICY "Users can only access their own settings"
    ON user_settings
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_creative_items_updated_at
    BEFORE UPDATE ON creative_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old soft-deleted items (run periodically)
CREATE OR REPLACE FUNCTION cleanup_deleted_items()
RETURNS void AS $$
BEGIN
    DELETE FROM creative_items 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
