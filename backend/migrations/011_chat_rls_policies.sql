-- Migration: Create RLS policies for chat tables
-- This migration sets up row-level security for all chat-related tables

-- Enable RLS on all chat tables
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notifications ENABLE ROW LEVEL SECURITY;

-- Chat channels policies
CREATE POLICY "Users can view channels they are members of" ON chat_channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_channels.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create public channels in their org" ON chat_channels
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.users 
      WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Channel admins can update channels" ON chat_channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_channels.id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Channel admins can delete channels" ON chat_channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_channels.id 
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Chat channel members policies
CREATE POLICY "Users can view channel members" ON chat_channel_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members cm2
      WHERE cm2.channel_id = chat_channel_members.channel_id 
      AND cm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel admins can add members" ON chat_channel_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_channel_members.channel_id 
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Channel admins can update members" ON chat_channel_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_channel_members.channel_id 
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Channel admins can remove members" ON chat_channel_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_channel_members.channel_id 
      AND user_id = auth.uid()
      AND role = 'admin'
    )
    OR user_id = auth.uid() -- Users can leave channels
  );

-- Chat messages policies
CREATE POLICY "Users can view messages in their channels" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_messages.channel_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their channels" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channel_members 
      WHERE channel_id = chat_messages.channel_id 
      AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (
    sender_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

CREATE POLICY "Users can soft delete their own messages" ON chat_messages
  FOR DELETE USING (
    sender_id = auth.uid()
  );

-- Chat attachments policies
CREATE POLICY "Users can view attachments in their channels" ON chat_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_messages m
      JOIN chat_channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = chat_attachments.message_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add attachments to their messages" ON chat_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_messages 
      WHERE id = chat_attachments.message_id 
      AND sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own attachments" ON chat_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_messages 
      WHERE id = chat_attachments.message_id 
      AND sender_id = auth.uid()
    )
  );

-- Chat user status policies
CREATE POLICY "Users can view all user statuses in their org" ON chat_user_status
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE org_id = (
        SELECT org_id FROM public.users 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own status" ON chat_user_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own status" ON chat_user_status
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own status" ON chat_user_status
  FOR DELETE USING (user_id = auth.uid());

-- Chat notifications policies
CREATE POLICY "Users can view their own notifications" ON chat_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications for users" ON chat_notifications
  FOR INSERT WITH CHECK (true); -- Will be created by functions/triggers

CREATE POLICY "Users can update their own notifications" ON chat_notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON chat_notifications
  FOR DELETE USING (user_id = auth.uid());