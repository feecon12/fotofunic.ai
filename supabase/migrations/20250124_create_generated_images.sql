-- Create generated_images table
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON public.generated_images(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own images
CREATE POLICY "Users can view their own images"
  ON public.generated_images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can insert their own images
CREATE POLICY "Users can insert their own images"
  ON public.generated_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can update their own images
CREATE POLICY "Users can update their own images"
  ON public.generated_images
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON public.generated_images
  FOR DELETE
  USING (auth.uid() = user_id);
