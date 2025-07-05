-- Migration: Create chat-related functions
-- This migration creates helper functions for chat functionality

-- Function to update last_read_at for a channel member
CREATE OR REPLACE FUNCTION update_channel_last_read(
  p_channel_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE chat_channel_members
  SET last_read_at = NOW()
  WHERE channel_id = p_channel_id
  AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_channel_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_last_read TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  SELECT last_read_at INTO v_last_read
  FROM chat_channel_members
  WHERE channel_id = p_channel_id
  AND user_id = auth.uid();
  
  SELECT COUNT(*) INTO v_count
  FROM chat_messages
  WHERE channel_id = p_channel_id
  AND created_at > v_last_read
  AND sender_id != auth.uid()
  AND is_deleted = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a direct message channel between two users
CREATE OR REPLACE FUNCTION create_direct_message_channel(
  p_other_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_channel_id UUID;
  v_org_id UUID;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Get the organization ID
  SELECT org_id INTO v_org_id
  FROM public.users
  WHERE id = v_current_user_id;
  
  -- Check if direct channel already exists
  SELECT c.id INTO v_channel_id
  FROM chat_channels c
  JOIN chat_channel_members cm1 ON c.id = cm1.channel_id AND cm1.user_id = v_current_user_id
  JOIN chat_channel_members cm2 ON c.id = cm2.channel_id AND cm2.user_id = p_other_user_id
  WHERE c.type = 'direct'
  AND (SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id) = 2;
  
  IF v_channel_id IS NOT NULL THEN
    RETURN v_channel_id;
  END IF;
  
  -- Create new direct channel
  INSERT INTO chat_channels (org_id, name, type, created_by)
  VALUES (v_org_id, 'Direct Message', 'direct', v_current_user_id)
  RETURNING id INTO v_channel_id;
  
  -- Add both users as members
  INSERT INTO chat_channel_members (channel_id, user_id, role)
  VALUES 
    (v_channel_id, v_current_user_id, 'admin'),
    (v_channel_id, p_other_user_id, 'admin');
  
  RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search messages
CREATE OR REPLACE FUNCTION search_chat_messages(
  p_search_query TEXT,
  p_channel_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  message_id UUID,
  channel_id UUID,
  channel_name TEXT,
  sender_id UUID,
  sender_email TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as message_id,
    m.channel_id,
    c.name as channel_name,
    m.sender_id,
    u.email as sender_email,
    m.content,
    m.created_at,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', p_search_query)) as relevance
  FROM chat_messages m
  JOIN chat_channels c ON c.id = m.channel_id
  JOIN auth.users u ON u.id = m.sender_id
  JOIN chat_channel_members cm ON cm.channel_id = m.channel_id AND cm.user_id = auth.uid()
  WHERE 
    m.is_deleted = FALSE
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', p_search_query)
    AND (p_channel_id IS NULL OR m.channel_id = p_channel_id)
  ORDER BY relevance DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get channel statistics
CREATE OR REPLACE FUNCTION get_channel_statistics(
  p_channel_id UUID
) RETURNS TABLE (
  total_messages BIGINT,
  total_members INTEGER,
  active_members_today INTEGER,
  messages_today BIGINT,
  messages_this_week BIGINT,
  most_active_user_id UUID,
  most_active_user_email TEXT,
  most_active_user_message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH message_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE NOT is_deleted) as total_msgs,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND NOT is_deleted) as msgs_today,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND NOT is_deleted) as msgs_week
    FROM chat_messages
    WHERE channel_id = p_channel_id
  ),
  member_stats AS (
    SELECT 
      COUNT(*) as total_mbrs,
      COUNT(*) FILTER (WHERE last_read_at >= CURRENT_DATE) as active_today
    FROM chat_channel_members
    WHERE channel_id = p_channel_id
  ),
  top_user AS (
    SELECT 
      m.sender_id,
      u.email,
      COUNT(*) as msg_count
    FROM chat_messages m
    JOIN auth.users u ON u.id = m.sender_id
    WHERE m.channel_id = p_channel_id
    AND m.is_deleted = FALSE
    GROUP BY m.sender_id, u.email
    ORDER BY msg_count DESC
    LIMIT 1
  )
  SELECT 
    ms.total_msgs,
    mb.total_mbrs,
    mb.active_today,
    ms.msgs_today,
    ms.msgs_week,
    tu.sender_id,
    tu.email,
    tu.msg_count
  FROM message_stats ms
  CROSS JOIN member_stats mb
  LEFT JOIN top_user tu ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_chat_notification(
  p_user_id UUID,
  p_channel_id UUID,
  p_message_id UUID,
  p_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO chat_notifications (user_id, channel_id, message_id, type)
  VALUES (p_user_id, p_channel_id, p_message_id, p_type)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle mentions in messages
CREATE OR REPLACE FUNCTION process_message_mentions() RETURNS TRIGGER AS $$
DECLARE
  v_mentioned_user RECORD;
  v_mention_pattern TEXT;
BEGIN
  -- Only process for new text messages
  IF NEW.type != 'text' OR NEW.is_deleted THEN
    RETURN NEW;
  END IF;
  
  -- Find all @mentions in the message
  FOR v_mentioned_user IN
    SELECT DISTINCT u.id, u.email
    FROM auth.users u
    JOIN chat_channel_members cm ON cm.user_id = u.id
    WHERE cm.channel_id = NEW.channel_id
    AND NEW.content ~ ('@' || split_part(u.email, '@', 1) || '\b')
    AND u.id != NEW.sender_id
  LOOP
    -- Create a notification for the mentioned user
    PERFORM create_chat_notification(
      v_mentioned_user.id,
      NEW.channel_id,
      NEW.id,
      'mention'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for processing mentions
CREATE TRIGGER process_mentions_on_new_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION process_message_mentions();

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators() RETURNS VOID AS $$
BEGIN
  UPDATE chat_user_status
  SET 
    is_typing_in_channel = NULL,
    typing_started_at = NULL
  WHERE 
    typing_started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_channel_last_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_direct_message_channel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_chat_messages(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_channel_statistics(UUID) TO authenticated;