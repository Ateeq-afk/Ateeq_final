-- Migration: Create storage bucket for chat attachments
-- This migration creates a storage bucket in Supabase for chat file uploads

-- Create the storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false, -- Private bucket
  false,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the storage bucket
CREATE POLICY "Users can upload files to chat attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1] -- User can only upload to their own folder
);

CREATE POLICY "Users can view chat attachments in their channels" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM chat_attachments ca
    JOIN chat_messages m ON ca.message_id = m.id
    JOIN chat_channel_members cm ON cm.channel_id = m.channel_id
    WHERE ca.file_url LIKE '%' || storage.objects.name
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own chat attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);