"use server";

import { createServerClientComponent } from "@/lib/supabase-server";

interface GalleryImage {
  id: number;
  url: string;
  prompt: string;
  model: string;
  image_name: string | null;
  tags: string[];
  created_at: string;
  guidance: number | null;
  num_inference_steps: number | null;
  output_format: string | null;
  aspect_ratio: string | null;
}

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Save image to gallery
export async function saveToGallery(
  url: string,
  prompt: string,
  model: string,
  guidance: number,
  num_inference_steps: number,
  output_format: string,
  aspect_ratio: string,
  tags: string[] = [],
  image_name?: string
): Promise<ActionResponse<GalleryImage>> {
  try {
    const supabase = await createServerClientComponent();

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
          url,
          prompt,
          model,
          image_name: image_name || null,
          tags: tags || [],
          guidance,
          num_inference_steps,
          output_format,
          aspect_ratio,
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
      data: data as GalleryImage,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Fetch all gallery images for current user
export async function fetchGalleryImages(): Promise<
  ActionResponse<GalleryImage[]>
> {
  try {
    const supabase = await createServerClientComponent();

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
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch gallery",
      };
    }

    return {
      success: true,
      data: (data || []) as GalleryImage[],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Delete image from gallery
export async function deleteGalleryImage(
  imageId: number
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createServerClientComponent();

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

    const { error } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", imageId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete image",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Update image (rename and/or tags)
export async function updateGalleryImage(
  imageId: number,
  image_name?: string,
  tags?: string[]
): Promise<ActionResponse<GalleryImage>> {
  try {
    const supabase = await createServerClientComponent();

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

    const updateData: { image_name?: string; tags?: string[] } = {};
    if (image_name !== undefined) updateData.image_name = image_name;
    if (tags !== undefined) updateData.tags = tags;

    const { data, error } = await supabase
      .from("generated_images")
      .update(updateData)
      .eq("id", imageId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to update image",
      };
    }

    return {
      success: true,
      data: data as GalleryImage,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get images by tag
export async function getImagesByTag(
  tag: string
): Promise<ActionResponse<GalleryImage[]>> {
  try {
    const supabase = await createServerClientComponent();

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
      .select("*")
      .eq("user_id", user.id)
      .contains("tags", [tag])
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch images by tag",
      };
    }

    return {
      success: true,
      data: (data || []) as GalleryImage[],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get all unique tags for current user
export async function getAllTags(): Promise<ActionResponse<string[]>> {
  try {
    const supabase = await createServerClientComponent();

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
      .select("tags")
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch tags",
      };
    }

    // Extract unique tags from all images
    const allTags = new Set<string>();
    (data || []).forEach((image: { tags: string[] }) => {
      if (Array.isArray(image.tags)) {
        image.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return {
      success: true,
      data: Array.from(allTags).sort(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
