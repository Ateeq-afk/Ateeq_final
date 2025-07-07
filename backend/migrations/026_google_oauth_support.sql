-- Google OAuth Support Migration
-- This migration adds support for Google OAuth users

-- 1. Add oauth provider tracking to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS oauth_provider TEXT CHECK (oauth_provider IN ('google', 'email', 'github')),
ADD COLUMN IF NOT EXISTS oauth_uid TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 2. Create index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider_uid ON public.users(oauth_provider, oauth_uid) WHERE oauth_provider IS NOT NULL;

-- 3. Update existing users to have email provider
UPDATE public.users 
SET oauth_provider = 'email', email_verified = TRUE 
WHERE oauth_provider IS NULL;

-- 4. Create function to handle OAuth user creation/update
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an OAuth signup
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    -- Insert or update user profile
    INSERT INTO public.users (
      id,
      email,
      full_name,
      avatar_url,
      oauth_provider,
      oauth_uid,
      email_verified,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      NEW.raw_user_meta_data->>'avatar_url',
      'google',
      NEW.raw_user_meta_data->>'sub',
      COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      email_verified = COALESCE(EXCLUDED.email_verified, users.email_verified),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to handle OAuth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_oauth_user();

-- 6. Create function for admins to assign OAuth users to organizations
CREATE OR REPLACE FUNCTION public.assign_oauth_user_to_organization(
  p_user_email TEXT,
  p_organization_id UUID,
  p_branch_id UUID,
  p_role TEXT DEFAULT 'operator',
  p_username TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Find the OAuth user by email
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = p_user_email
  AND oauth_provider = 'google';
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Google user not found with this email'
    );
  END IF;
  
  -- Check if user is already assigned to an organization
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_user_id 
    AND organization_id IS NOT NULL
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is already assigned to an organization'
    );
  END IF;
  
  -- Verify the organization and branch exist
  IF NOT EXISTS (
    SELECT 1 FROM public.branches 
    WHERE id = p_branch_id 
    AND organization_id = p_organization_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid organization or branch'
    );
  END IF;
  
  -- Generate username if not provided
  IF p_username IS NULL THEN
    p_username := LOWER(SPLIT_PART(p_user_email, '@', 1));
  END IF;
  
  -- Update the user with organization details
  UPDATE public.users
  SET
    organization_id = p_organization_id,
    branch_id = p_branch_id,
    role = p_role,
    username = p_username,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'User successfully assigned to organization'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create view for unassigned OAuth users (for admin dashboard)
CREATE OR REPLACE VIEW public.unassigned_oauth_users AS
SELECT 
  id,
  email,
  full_name,
  oauth_provider,
  avatar_url,
  email_verified,
  created_at
FROM public.users
WHERE oauth_provider IN ('google')
AND organization_id IS NULL
ORDER BY created_at DESC;

-- 8. Grant necessary permissions
GRANT SELECT ON public.unassigned_oauth_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_oauth_user_to_organization TO authenticated;

-- 9. Create RLS policy for OAuth user management
CREATE POLICY "Admins can view unassigned OAuth users" ON public.users
  FOR SELECT
  USING (
    oauth_provider IS NOT NULL 
    AND organization_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.role IN ('admin', 'superadmin')
    )
  );

-- 10. Add comments
COMMENT ON COLUMN public.users.oauth_provider IS 'OAuth provider used for authentication (google, email, github)';
COMMENT ON COLUMN public.users.oauth_uid IS 'Unique identifier from OAuth provider';
COMMENT ON COLUMN public.users.avatar_url IS 'User avatar URL from OAuth provider';
COMMENT ON COLUMN public.users.email_verified IS 'Whether the email has been verified';
COMMENT ON FUNCTION public.assign_oauth_user_to_organization IS 'Function to assign OAuth users to organizations';
COMMENT ON VIEW public.unassigned_oauth_users IS 'View of OAuth users not yet assigned to any organization';