-- Setup database for Lemlist Portal
-- Run this in Supabase SQL Editor

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  lemlist_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lemlist campaigns cache
CREATE TABLE IF NOT EXISTS lemlist_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

-- Campaign stats
CREATE TABLE IF NOT EXISTS lemlist_campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  open_rate NUMERIC DEFAULT 0,
  reply_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

-- Leads
CREATE TABLE IF NOT EXISTS lemlist_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  status TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lead_id)
);

-- Sync log
CREATE TABLE IF NOT EXISTS lemlist_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  campaigns_synced INTEGER DEFAULT 0,
  leads_synced INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get latest campaign stats
CREATE OR REPLACE FUNCTION get_latest_campaign_stats(p_user_id UUID)
RETURNS TABLE (
  campaign_id TEXT,
  campaign_name TEXT,
  campaign_status TEXT,
  total_leads INTEGER,
  emails_sent INTEGER,
  emails_opened INTEGER,
  emails_replied INTEGER,
  open_rate NUMERIC,
  reply_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.campaign_id,
    c.name as campaign_name,
    c.status as campaign_status,
    COALESCE(s.leads, 0) as total_leads,
    COALESCE(s.sent, 0) as emails_sent,
    COALESCE(s.opened, 0) as emails_opened,
    COALESCE(s.replied, 0) as emails_replied,
    COALESCE(s.open_rate, 0) as open_rate,
    COALESCE(s.reply_rate, 0) as reply_rate
  FROM lemlist_campaigns c
  LEFT JOIN lemlist_campaign_stats s ON c.campaign_id = s.campaign_id AND c.user_id = s.user_id
  WHERE c.user_id = p_user_id
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (optional - disable if you want public access)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
