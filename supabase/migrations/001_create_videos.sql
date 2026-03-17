-- Videos table for Kling async job tracking and gallery.
-- Run this in Supabase SQL Editor or via: supabase db push

CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  source_image TEXT,
  reference_video TEXT,
  final_video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
