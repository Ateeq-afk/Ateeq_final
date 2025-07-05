-- Migration: Add additional indexes and views for chat performance
-- This migration creates indexes and materialized views for better chat performance

-- Add full-text search index on messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_fts 
ON chat_messages 
USING gin(to_tsvector('english', content));

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created 
ON chat_messages(channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_members_user_channel 
ON chat_channel_members(user_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_chat_notifications_user_unread 
ON chat_notifications(user_id, is_read, created_at DESC);

-- Create a view for channel summaries with last message
CREATE OR REPLACE VIEW chat_channel_summary AS
WITH last_messages AS (
  SELECT DISTINCT ON (channel_id)
    channel_id,
    id as last_message_id,
    content as last_message_content,
    sender_id as last_message_sender_id,
    created_at as last_message_at,
    type as last_message_type
  FROM chat_messages
  WHERE is_deleted = FALSE
  ORDER BY channel_id, created_at DESC
),
member_counts AS (
  SELECT 
    channel_id,
    COUNT(*) as member_count,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count
  FROM chat_channel_members
  GROUP BY channel_id
),
message_counts AS (
  SELECT 
    channel_id,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as messages_today
  FROM chat_messages
  WHERE is_deleted = FALSE
  GROUP BY channel_id
)
SELECT 
  c.id,
  c.org_id,
  c.name,
  c.description,
  c.type,
  c.created_by,
  c.created_at,
  c.updated_at,
  c.is_archived,
  c.metadata,
  COALESCE(mc.member_count, 0) as member_count,
  COALESCE(mc.admin_count, 0) as admin_count,
  COALESCE(msg.total_messages, 0) as total_messages,
  COALESCE(msg.messages_today, 0) as messages_today,
  lm.last_message_id,
  lm.last_message_content,
  lm.last_message_sender_id,
  lm.last_message_at,
  lm.last_message_type
FROM chat_channels c
LEFT JOIN member_counts mc ON c.id = mc.channel_id
LEFT JOIN message_counts msg ON c.id = msg.channel_id
LEFT JOIN last_messages lm ON c.id = lm.channel_id;

-- Create a view for user's unread messages per channel
CREATE OR REPLACE VIEW chat_user_unread_counts AS
SELECT 
  cm.user_id,
  cm.channel_id,
  c.name as channel_name,
  COUNT(m.id) as unread_count,
  MAX(m.created_at) as last_unread_at
FROM chat_channel_members cm
JOIN chat_channels c ON c.id = cm.channel_id
LEFT JOIN chat_messages m ON m.channel_id = cm.channel_id 
  AND m.created_at > cm.last_read_at 
  AND m.sender_id != cm.user_id
  AND m.is_deleted = FALSE
GROUP BY cm.user_id, cm.channel_id, c.name;

-- Create a view for active users in the last 24 hours
CREATE OR REPLACE VIEW chat_active_users AS
SELECT 
  u.id as user_id,
  u.email,
  u.org_id,
  us.status,
  us.custom_status,
  us.last_seen_at,
  COUNT(DISTINCT m.id) as messages_last_24h,
  COUNT(DISTINCT m.channel_id) as active_channels_24h
FROM users u
LEFT JOIN chat_user_status us ON u.id = us.user_id
LEFT JOIN chat_messages m ON m.sender_id = u.id 
  AND m.created_at >= NOW() - INTERVAL '24 hours'
  AND m.is_deleted = FALSE
GROUP BY u.id, u.email, u.org_id, us.status, us.custom_status, us.last_seen_at;

-- Function to get a user's chat statistics
CREATE OR REPLACE FUNCTION get_user_chat_stats(p_user_id UUID)
RETURNS TABLE (
  total_messages_sent BIGINT,
  total_reactions_given INTEGER,
  total_reactions_received INTEGER,
  total_channels_joined INTEGER,
  total_direct_messages INTEGER,
  most_active_channel_id UUID,
  most_active_channel_name TEXT,
  messages_in_most_active_channel BIGINT,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH message_stats AS (
    SELECT 
      COUNT(*) as total_msgs,
      MIN(created_at) as first_msg,
      MAX(created_at) as last_msg
    FROM chat_messages
    WHERE sender_id = p_user_id
    AND is_deleted = FALSE
  ),
  reaction_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE p_user_id = ANY(r.users)) as reactions_given,
      COUNT(*) FILTER (WHERE m.sender_id = p_user_id) as reactions_received
    FROM chat_messages m
    CROSS JOIN LATERAL jsonb_array_elements(m.reactions) as r(reaction)
    WHERE m.reactions != '[]'::jsonb
  ),
  channel_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE c.type != 'direct') as channels_joined,
      COUNT(*) FILTER (WHERE c.type = 'direct') as direct_messages
    FROM chat_channel_members cm
    JOIN chat_channels c ON c.id = cm.channel_id
    WHERE cm.user_id = p_user_id
  ),
  most_active AS (
    SELECT 
      m.channel_id,
      c.name,
      COUNT(*) as msg_count
    FROM chat_messages m
    JOIN chat_channels c ON c.id = m.channel_id
    WHERE m.sender_id = p_user_id
    AND m.is_deleted = FALSE
    GROUP BY m.channel_id, c.name
    ORDER BY msg_count DESC
    LIMIT 1
  )
  SELECT 
    ms.total_msgs,
    rs.reactions_given::INTEGER,
    rs.reactions_received::INTEGER,
    cs.channels_joined::INTEGER,
    cs.direct_messages::INTEGER,
    ma.channel_id,
    ma.name,
    ma.msg_count,
    ms.first_msg,
    ms.last_msg
  FROM message_stats ms
  CROSS JOIN reaction_stats rs
  CROSS JOIN channel_stats cs
  LEFT JOIN most_active ma ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON chat_channel_summary TO authenticated;
GRANT SELECT ON chat_user_unread_counts TO authenticated;
GRANT SELECT ON chat_active_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_stats(UUID) TO authenticated;