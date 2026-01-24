-- Drop and recreate generated_images with correct columns
DO $$
BEGIN
  -- Drop existing table if it was created with wrong schema
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'generated_images'
  ) THEN
    DROP TABLE public.generated_images;
  END IF;
END $$;

-- Create generated_images table matching app expectations
CREATE TABLE public.generated_images (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  image_name TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guidance NUMERIC(5, 2),
  num_inference_steps INTEGER,
  output_format TEXT,
  aspect_ratio TEXT
);

-- Indexes
CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX idx_generated_images_created_at ON public.generated_images(created_at DESC);

-- RLS
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own images"
  ON public.generated_images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images"
  ON public.generated_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
  ON public.generated_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
  ON public.generated_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
