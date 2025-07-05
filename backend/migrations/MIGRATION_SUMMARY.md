# Migration Summary for Enhanced Login and Chat Features

This document provides an overview of all migrations required for the enhanced login system and organization chat feature.

## Migration Order

The migrations should be run in the following order:

### Chat System Migrations

1. **010_create_chat_tables_fixed.sql** (Use this if you get "already exists" errors)
   - Creates core chat tables: channels, members, messages, attachments, user status, notifications
   - Sets up basic indexes and triggers for updated_at timestamps
   - **Fixed version**: Includes `IF NOT EXISTS` clauses for all objects

2. **011_chat_rls_policies.sql**
   - Enables Row Level Security on all chat tables
   - Creates comprehensive RLS policies for secure data access
   - Ensures users can only see/modify data within their organization and permissions

3. **012_chat_functions.sql**
   - Creates helper functions for chat functionality
   - Includes functions for unread counts, direct messages, search, statistics
   - Sets up trigger for processing @mentions in messages

4. **014_chat_storage_bucket.sql**
   - Creates Supabase storage bucket for chat file attachments
   - Sets up storage policies for secure file uploads/downloads
   - Configures allowed file types and size limits (50MB)

5. **015_create_default_channels_fixed.sql** (Use this instead of 015_create_default_channels.sql)
   - Creates function to generate default channels for new organizations
   - Sets up triggers to auto-create channels when organizations are created
   - Adds users to default channels automatically
   - Creates #general, #random, and #announcements channels
   - **Fixed version**: Handles organizations table without `created_by` column

6. **016_add_chat_indexes_and_views.sql**
   - Adds performance indexes including full-text search
   - Creates views for channel summaries and unread counts
   - Adds user statistics functions
   - Optimizes common query patterns

### Enhanced Authentication Migrations

7. **013_enhanced_auth_tables.sql**
   - Creates tables for login tracking and session management
   - Adds support for login attempts, account lockouts, and login history
   - Prepares infrastructure for 2FA and advanced security features
   - Creates functions for checking lockout status and recording attempts

## Important Notes

### Organizations Table Structure
The migrations are designed to work whether or not your `organizations` table has a `created_by` column. If you encounter the error:
```
ERROR: 42703: column "created_by" does not exist
```
Use `015_create_default_channels_fixed.sql` instead of `015_create_default_channels.sql`.

### Handling Partial Migration Errors
If you encounter errors like:
```
ERROR: 42P07: relation "idx_chat_channels_org_id" already exists
```
This means the migration was partially run before. You have two options:

**Option 1: Use the fixed versions**
- Use `010_create_chat_tables_fixed.sql` instead of `010_create_chat_tables.sql`
- The fixed version includes `IF NOT EXISTS` clauses for all objects

**Option 2: Clean up and start fresh**
1. Run the cleanup script first:
   ```sql
   \i migrations/000_cleanup_partial_chat.sql
   ```
2. Then run the migrations normally

⚠️ **WARNING**: The cleanup script will remove ALL chat-related tables and data. Only use it if you want to completely reinstall the chat system.

## Running the Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run all migrations
supabase db push

# Or run specific migration
supabase migration up 010_create_chat_tables.sql
```

### Option 2: Direct SQL Execution

```bash
# Connect to your Supabase database
psql -h <your-supabase-host> -U postgres -d postgres

# Run each migration file
\i migrations/010_create_chat_tables.sql
\i migrations/011_chat_rls_policies.sql
# ... continue for all files
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Execute in order

## Post-Migration Steps

1. **Verify Tables Created**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'chat_%';
   ```

2. **Check RLS Policies**
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'chat_%';
   ```

3. **Verify Storage Bucket**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
   ```

4. **Test Default Channels**
   - Create a new organization and verify default channels are created
   - Add a new user and verify they're added to default channels

## Rollback Instructions

If you need to rollback the migrations:

```sql
-- Drop chat-related objects
DROP TABLE IF EXISTS chat_notifications CASCADE;
DROP TABLE IF EXISTS chat_attachments CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_channel_members CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;
DROP TABLE IF EXISTS chat_user_status CASCADE;

-- Drop auth enhancement tables
DROP TABLE IF EXISTS account_lockouts CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS password_history CASCADE;
DROP TABLE IF EXISTS user_security_settings CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_channel_last_read CASCADE;
DROP FUNCTION IF EXISTS get_unread_message_count CASCADE;
DROP FUNCTION IF EXISTS create_direct_message_channel CASCADE;
DROP FUNCTION IF EXISTS search_chat_messages CASCADE;
DROP FUNCTION IF EXISTS get_channel_statistics CASCADE;
DROP FUNCTION IF EXISTS create_chat_notification CASCADE;
DROP FUNCTION IF EXISTS process_message_mentions CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_typing_indicators CASCADE;
DROP FUNCTION IF EXISTS create_default_channels_for_org CASCADE;
DROP FUNCTION IF EXISTS add_user_to_default_channels CASCADE;
DROP FUNCTION IF EXISTS get_user_chat_stats CASCADE;
DROP FUNCTION IF EXISTS is_account_locked CASCADE;
DROP FUNCTION IF EXISTS record_login_attempt CASCADE;

-- Drop views
DROP VIEW IF EXISTS chat_channel_summary CASCADE;
DROP VIEW IF EXISTS chat_user_unread_counts CASCADE;
DROP VIEW IF EXISTS chat_active_users CASCADE;

-- Drop storage bucket
DELETE FROM storage.buckets WHERE id = 'chat-attachments';
```

## Migration Dependencies

- Requires existing tables: `organizations`, `users`, `auth.users`
- Requires Supabase Auth to be configured
- Requires storage to be enabled in Supabase

## Performance Considerations

1. The full-text search index on messages may take time for large datasets
2. Views are not materialized - consider materializing for very large datasets
3. Cleanup job for typing indicators should be scheduled (cron job)
4. Consider partitioning chat_messages table by created_at for very high volume

## Security Notes

1. All tables have RLS enabled - ensure auth is properly configured
2. Storage bucket is private - files can only be accessed through proper authentication
3. Account lockout is set to 5 attempts in 15 minutes, 5-minute lockout
4. Functions use SECURITY DEFINER - be cautious with modifications