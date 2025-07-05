-- Cleanup script: Remove partial chat installation
-- Run this ONLY if you need to clean up a failed partial migration
-- This will remove all chat-related objects

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_chat_channels_org_id;
DROP INDEX IF EXISTS idx_chat_channel_members_user_id;
DROP INDEX IF EXISTS idx_chat_channel_members_channel_id;
DROP INDEX IF EXISTS idx_chat_messages_channel_id;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_messages_parent_message_id;
DROP INDEX IF EXISTS idx_chat_notifications_user_id;
DROP INDEX IF EXISTS idx_chat_notifications_is_read;
DROP INDEX IF EXISTS idx_chat_messages_content_fts;
DROP INDEX IF EXISTS idx_chat_messages_channel_created;
DROP INDEX IF EXISTS idx_chat_members_user_channel;
DROP INDEX IF EXISTS idx_chat_notifications_user_unread;

-- Drop views if they exist
DROP VIEW IF EXISTS chat_channel_summary CASCADE;
DROP VIEW IF EXISTS chat_user_unread_counts CASCADE;
DROP VIEW IF EXISTS chat_active_users CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_channel_last_read(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_unread_message_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_direct_message_channel(UUID) CASCADE;
DROP FUNCTION IF EXISTS search_chat_messages(TEXT, UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_channel_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_chat_notification(UUID, UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS process_message_mentions() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_typing_indicators() CASCADE;
DROP FUNCTION IF EXISTS create_default_channels_for_org(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS add_user_to_default_channels(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_chat_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS on_organization_created() CASCADE;
DROP FUNCTION IF EXISTS on_user_created() CASCADE;
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT, TEXT) CASCADE;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_chat_channels_updated_at ON chat_channels;
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
DROP TRIGGER IF EXISTS process_mentions_on_new_message ON chat_messages;
DROP TRIGGER IF EXISTS create_default_channels_on_org_creation ON organizations;
DROP TRIGGER IF EXISTS add_user_to_default_channels_on_creation ON users;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS chat_notifications CASCADE;
DROP TABLE IF EXISTS chat_attachments CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_channel_members CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;
DROP TABLE IF EXISTS chat_user_status CASCADE;

-- Drop storage bucket policies
DROP POLICY IF EXISTS "Users can upload files to chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments in their channels" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

-- Remove storage bucket (be careful with this)
-- DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Chat system cleanup completed. You can now run the migrations fresh.';
END $$;