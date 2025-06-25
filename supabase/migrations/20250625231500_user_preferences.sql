/*
  # User Preferences Table

  1. Table
    - user_preferences stores per-user app settings
  2. Security
    - Enable RLS and allow users to manage their own preferences
*/

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  default_branch UUID REFERENCES branches(id),
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  theme TEXT DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
