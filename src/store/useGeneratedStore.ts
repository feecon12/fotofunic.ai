import { generateImageAction } from "@/app/actions/image-actions";
import { ImageGenerationFormSchema } from "@/components/image-generation/Configurations";
import { saveToGalleryClient } from "@/lib/gallery-client";
import { z } from "zod";
import { create } from "zustand";

interface GenerateState {
  loading: boolean;
  images: Array<{ url: string }>;
  generationCount: number;
  error: string | null;
  generateImage: (
    values: z.infer<typeof ImageGenerationFormSchema>,
  ) => Promise<void>;
}

const useGeneratedStore = create<GenerateState>((set) => ({
  loading: false,
  images: [],
  generationCount: 0,
  error: null,

  generateImage: async (values: z.infer<typeof ImageGenerationFormSchema>) => {
    set({ loading: true, error: null });

    try {
      const { error, success, data } = await generateImageAction(values);

      if (!success) {
        const errorMsg = error || "Failed to generate image";
        set({ error: errorMsg, loading: false });
        return;
      }

      if (!data) {
        const errorMsg = "No data returned from image generation";
        set({ error: errorMsg, loading: false });
        return;
      }

      // Save each generated image to gallery via client (requires login)
      const imageUrls = Array.isArray(data) ? data : [data];

      for (const url of imageUrls) {
        const result = await saveToGalleryClient({
          url,
          prompt: values.prompt,
          model: values.model,
          guidance: values.guidance,
          num_inference_steps: values.num_of_inference_steps,
          output_format: values.output_format,
          aspect_ratio: values.aspect_ratio,
          tags: [],
          image_name: undefined,
        });
        if (!result.success) {
          // Silent fail - user sees error on UI if save fails
        }
      }

      const dataWithUrl = imageUrls.map((url: string) => {
        return { url };
      });
      set((state) => ({
        images: dataWithUrl,
        loading: false,
        generationCount: state.generationCount + 1,
      }));
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      set({ error: errorMsg, loading: false });
    }
  },
}));

export default useGeneratedStore;
