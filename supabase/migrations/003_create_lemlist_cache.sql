-- Create tables for caching Lemlist data
-- This allows fast dashboard loading and historical tracking

-- Cached campaigns table
CREATE TABLE IF NOT EXISTS lemlist_campaigns (
    _id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    sequence_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    has_error BOOLEAN DEFAULT FALSE,
    errors JSONB DEFAULT '[]',
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_leads INTEGER DEFAULT 0
);

-- Campaign statistics (snapshots over time)
CREATE TABLE IF NOT EXISTS lemlist_campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL REFERENCES lemlist_campaigns(_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Lead counts by state
    total_leads INTEGER DEFAULT 0,
    scanned INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    linkedin_invite_accepted INTEGER DEFAULT 0,
    linkedin_replied INTEGER DEFAULT 0,
    unsubscribed INTEGER DEFAULT 0,
    
    -- Calculated rates
    open_rate DECIMAL(5,2) DEFAULT 0,
    reply_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Raw data for flexibility
    raw_states JSONB DEFAULT '{}'
);

-- Cached leads (top leads only, not all 50k)
CREATE TABLE IF NOT EXISTS lemlist_leads (
    _id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES lemlist_campaigns(_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    status TEXT,
    state TEXT,
    linkedin_url TEXT,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync log to track when data was last updated
CREATE TABLE IF NOT EXISTS lemlist_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'running', -- running, completed, failed
    campaigns_synced INTEGER DEFAULT 0,
    leads_synced INTEGER DEFAULT 0,
    error_message TEXT,
    duration_seconds INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON lemlist_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_cached_at ON lemlist_campaigns(cached_at);
CREATE INDEX IF NOT EXISTS idx_stats_campaign_id ON lemlist_campaign_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_stats_user_id ON lemlist_campaign_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_recorded_at ON lemlist_campaign_stats(recorded_at);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON lemlist_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON lemlist_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON lemlist_sync_log(user_id);

-- RLS Policies
ALTER TABLE lemlist_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lemlist_campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE lemlist_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lemlist_sync_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own campaigns" 
    ON lemlist_campaigns FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" 
    ON lemlist_campaign_stats FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own leads" 
    ON lemlist_leads FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync logs" 
    ON lemlist_sync_log FOR SELECT 
    USING (auth.uid() = user_id);

-- Service role can manage all data (for sync job)
CREATE POLICY "Service role can manage campaigns" 
    ON lemlist_campaigns FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Service role can manage stats" 
    ON lemlist_campaign_stats FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Service role can manage leads" 
    ON lemlist_leads FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Service role can manage sync logs" 
    ON lemlist_sync_log FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Function to get latest stats for each campaign
CREATE OR REPLACE FUNCTION get_latest_campaign_stats(p_user_id UUID)
RETURNS TABLE (
    campaign_id TEXT,
    campaign_name TEXT,
    campaign_status TEXT,
    total_leads INTEGER,
    emails_sent INTEGER,
    emails_opened INTEGER,
    emails_replied INTEGER,
    open_rate DECIMAL,
    reply_rate DECIMAL,
    last_synced TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c._id as campaign_id,
        c.name as campaign_name,
        c.status as campaign_status,
        COALESCE(s.total_leads, 0) as total_leads,
        COALESCE(s.emails_sent, 0) as emails_sent,
        COALESCE(s.emails_opened, 0) as emails_opened,
        COALESCE(s.emails_replied, 0) as emails_replied,
        COALESCE(s.open_rate, 0) as open_rate,
        COALESCE(s.reply_rate, 0) as reply_rate,
        c.cached_at as last_synced
    FROM lemlist_campaigns c
    LEFT JOIN LATERAL (
        SELECT *
        FROM lemlist_campaign_stats
        WHERE campaign_id = c._id
        ORDER BY recorded_at DESC
        LIMIT 1
    ) s ON true
    WHERE c.user_id = p_user_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
