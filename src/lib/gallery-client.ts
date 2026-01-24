"use client";

import { createClient } from "@/lib/supabase";

interface GalleryImagePayload {
  url: string;
  prompt: string;
  model: string;
  guidance: number;
  num_inference_steps: number;
  output_format: string;
  aspect_ratio: string;
  tags?: string[];
  image_name?: string;
}

export async function saveToGalleryClient(payload: GalleryImagePayload) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const { data, error } = await supabase
    .from("generated_images")
    .insert([
      {
        user_id: user.id,
        url: payload.url,
        prompt: payload.prompt,
        model: payload.model,
        image_name: payload.image_name ?? null,
        tags: payload.tags ?? [],
        guidance: payload.guidance,
        num_inference_steps: payload.num_inference_steps,
        output_format: payload.output_format,
        aspect_ratio: payload.aspect_ratio,
      },
    ])
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message || "Failed to save image",
    };
  }

  return {
    success: true,
    data,
  };
}
