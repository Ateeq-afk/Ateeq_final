-- Migration: Create tables for enhanced authentication features
-- This migration adds support for login tracking, session management, and 2FA preparation

-- Create login_attempts table for tracking failed login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user_sessions table for extended session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_remember_me BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user_security_settings table
CREATE TABLE IF NOT EXISTS user_security_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  password_updated_at TIMESTAMPTZ DEFAULT NOW(),
  login_notification_enabled BOOLEAN DEFAULT TRUE,
  suspicious_activity_notification BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create password_history table
CREATE TABLE IF NOT EXISTS password_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  location JSONB DEFAULT '{}'::jsonb,
  login_method TEXT CHECK (login_method IN ('password', 'social', 'biometric', 'mobile_app', 'sso')),
  session_duration INTERVAL GENERATED ALWAYS AS (
    CASE 
      WHEN logout_at IS NOT NULL THEN logout_at - login_at 
      ELSE NULL 
    END
  ) STORED
);

-- Create account_lockouts table
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  failed_attempt_count INTEGER DEFAULT 0,
  unlocked_by UUID REFERENCES auth.users(id),
  unlocked_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at DESC);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_at ON login_history(login_at DESC);
CREATE INDEX idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX idx_account_lockouts_unlock_at ON account_lockouts(unlock_at);

-- Enable RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_attempts (admin only)
CREATE POLICY "Only admins can view login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON user_sessions
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for user_security_settings
CREATE POLICY "Users can view their own security settings" ON user_security_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own security settings" ON user_security_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own security settings" ON user_security_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for password_history
CREATE POLICY "Users can view their own password history" ON password_history
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for login_history
CREATE POLICY "Users can view their own login history" ON login_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all login history" ON login_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- RLS Policies for account_lockouts (public read for checking, admin write)
CREATE POLICY "Anyone can check lockout status" ON account_lockouts
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage lockouts" ON account_lockouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(p_email TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  v_is_locked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM account_lockouts 
    WHERE email = p_email 
    AND unlock_at > NOW()
    AND unlocked_at IS NULL
  ) INTO v_is_locked;
  
  RETURN v_is_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_recent_failures INTEGER;
BEGIN
  -- Insert the login attempt
  INSERT INTO login_attempts (email, success, ip_address, user_agent, failure_reason)
  VALUES (p_email, p_success, p_ip_address, p_user_agent, p_failure_reason);
  
  -- If failed, check if we need to lock the account
  IF NOT p_success THEN
    -- Count recent failures (last 15 minutes)
    SELECT COUNT(*) INTO v_recent_failures
    FROM login_attempts
    WHERE email = p_email
    AND success = FALSE
    AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    -- Lock account after 5 failures
    IF v_recent_failures >= 5 THEN
      INSERT INTO account_lockouts (email, unlock_at, reason, failed_attempt_count)
      VALUES (p_email, NOW() + INTERVAL '5 minutes', 'Too many failed login attempts', v_recent_failures)
      ON CONFLICT (email) DO UPDATE
      SET 
        locked_at = NOW(),
        unlock_at = NOW() + INTERVAL '5 minutes',
        failed_attempt_count = v_recent_failures,
        unlocked_at = NULL;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_account_locked(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_login_attempt(TEXT, BOOLEAN, INET, TEXT, TEXT) TO anon, authenticated;