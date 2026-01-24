-- Replace with your local user's UUID from Authentication > Users
INSERT INTO public.generated_images (user_id, url, prompt, model, image_name, tags)
VALUES ('<your-user-uuid>', 'https://example.com/test.jpg', 'test prompt', 'flux', 'test', ARRAY['sample']);