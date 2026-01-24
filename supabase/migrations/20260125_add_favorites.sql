-- Add is_favorite column to generated_images
ALTER TABLE public.generated_images
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for faster favorite queries
CREATE INDEX IF NOT EXISTS idx_generated_images_is_favorite 
ON public.generated_images(user_id, is_favorite);
