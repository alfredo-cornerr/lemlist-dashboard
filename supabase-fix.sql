-- Drop old function first
DROP FUNCTION IF EXISTS get_latest_campaign_stats(UUID);

-- Create new function with correct column names
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
