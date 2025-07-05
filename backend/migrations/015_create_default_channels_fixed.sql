-- Migration: Create default channels for organizations (Fixed version)
-- This migration creates a function to automatically create default channels when a new organization is created
-- Fixed to handle organizations table without created_by column

-- Function to create default channels for an organization
CREATE OR REPLACE FUNCTION create_default_channels_for_org(
  p_org_id UUID,
  p_created_by UUID
) RETURNS VOID AS $$
BEGIN
  -- Create #general channel
  INSERT INTO chat_channels (org_id, name, description, type, created_by)
  VALUES (
    p_org_id,
    'general',
    'General discussion and announcements for the entire organization',
    'public',
    p_created_by
  );
  
  -- Create #random channel
  INSERT INTO chat_channels (org_id, name, description, type, created_by)
  VALUES (
    p_org_id,
    'random',
    'Non-work banter and water cooler conversation',
    'public',
    p_created_by
  );
  
  -- Create #announcements channel
  INSERT INTO chat_channels (org_id, name, description, type, created_by)
  VALUES (
    p_org_id,
    'announcements',
    'Important company-wide announcements',
    'public',
    p_created_by
  );
  
  -- Add the creator to all default channels as admin
  INSERT INTO chat_channel_members (channel_id, user_id, role)
  SELECT id, p_created_by, 'admin'
  FROM chat_channels
  WHERE org_id = p_org_id
  AND name IN ('general', 'random', 'announcements');
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if organizations table has created_by column
CREATE OR REPLACE FUNCTION column_exists(
  p_table_name TEXT,
  p_column_name TEXT,
  p_schema_name TEXT DEFAULT 'public'
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = p_schema_name
    AND table_name = p_table_name
    AND column_name = p_column_name
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default channels when a new organization is created
CREATE OR REPLACE FUNCTION on_organization_created() RETURNS TRIGGER AS $$
DECLARE
  v_creator_id UUID;
  v_has_created_by BOOLEAN;
BEGIN
  -- Check if organizations table has created_by column
  v_has_created_by := column_exists('organizations', 'created_by');
  
  IF v_has_created_by THEN
    -- Try to get created_by value dynamically
    EXECUTE format('SELECT %I FROM %I WHERE id = $1', 'created_by', 'organizations')
    INTO v_creator_id
    USING NEW.id;
  END IF;
  
  -- If we don't have a creator_id, the default channels will be created
  -- when the first admin user is added to the organization
  IF v_creator_id IS NOT NULL THEN
    PERFORM create_default_channels_for_org(NEW.id, v_creator_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS create_default_channels_on_org_creation ON organizations;
CREATE TRIGGER create_default_channels_on_org_creation
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION on_organization_created();

-- Function to add a user to default channels when they join an organization
CREATE OR REPLACE FUNCTION add_user_to_default_channels(
  p_user_id UUID,
  p_org_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Add user to all public default channels
  INSERT INTO chat_channel_members (channel_id, user_id, role)
  SELECT id, p_user_id, 'member'
  FROM chat_channels
  WHERE org_id = p_org_id
  AND type = 'public'
  AND name IN ('general', 'random', 'announcements')
  ON CONFLICT (channel_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add users to default channels when they are created
CREATE OR REPLACE FUNCTION on_user_created() RETURNS TRIGGER AS $$
DECLARE
  v_channel_count INTEGER;
BEGIN
  -- Add user to default channels of their organization
  IF NEW.org_id IS NOT NULL THEN
    -- Check if default channels exist for this organization
    SELECT COUNT(*) INTO v_channel_count
    FROM chat_channels
    WHERE org_id = NEW.org_id
    AND name IN ('general', 'random', 'announcements');
    
    -- If no default channels exist and this is an admin user, create them
    IF v_channel_count = 0 AND NEW.role IN ('admin', 'superadmin') THEN
      PERFORM create_default_channels_for_org(NEW.org_id, NEW.id);
    END IF;
    
    -- Add user to default channels
    PERFORM add_user_to_default_channels(NEW.id, NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS add_user_to_default_channels_on_creation ON users;
CREATE TRIGGER add_user_to_default_channels_on_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION on_user_created();

-- Create default channels for existing organizations
DO $$
DECLARE
  v_org RECORD;
  v_admin_user_id UUID;
BEGIN
  FOR v_org IN SELECT id FROM organizations
  LOOP
    -- Check if default channels already exist
    IF NOT EXISTS (
      SELECT 1 FROM chat_channels 
      WHERE org_id = v_org.id 
      AND name = 'general'
    ) THEN
      -- Find an admin user in this organization to be the creator
      SELECT id INTO v_admin_user_id
      FROM users
      WHERE org_id = v_org.id
      AND role IN ('admin', 'superadmin')
      LIMIT 1;
      
      -- If no admin found, use any user from the organization
      IF v_admin_user_id IS NULL THEN
        SELECT id INTO v_admin_user_id
        FROM users
        WHERE org_id = v_org.id
        LIMIT 1;
      END IF;
      
      -- Only create default channels if we have a user to set as creator
      IF v_admin_user_id IS NOT NULL THEN
        PERFORM create_default_channels_for_org(v_org.id, v_admin_user_id);
      END IF;
    END IF;
  END LOOP;
END $$;

-- Add existing users to default channels
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id, org_id FROM users WHERE org_id IS NOT NULL
  LOOP
    PERFORM add_user_to_default_channels(v_user.id, v_user.org_id);
  END LOOP;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_default_channels_for_org(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_default_channels(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION column_exists(TEXT, TEXT, TEXT) TO authenticated;

-- Clean up the helper function
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT, TEXT);