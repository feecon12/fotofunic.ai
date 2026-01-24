import { saveToGallery } from "@/app/actions/gallery-actions";
import { generateImageAction } from "@/app/actions/image-actions";
import { ImageGenerationFormSchema } from "@/components/image-generation/Configurations";
import { z } from "zod";
import { create } from "zustand";

interface GenerateState {
  loading: boolean;
  images: Array<{ url: string }>;
  error: string | null;
  generateImage: (
    values: z.infer<typeof ImageGenerationFormSchema>
  ) => Promise<void>;
}

const useGeneratedStore = create<GenerateState>((set) => ({
  loading: false,
  images: [],
  error: null,

  generateImage: async (values: z.infer<typeof ImageGenerationFormSchema>) => {
    set({ loading: true, error: null });

    try {
      const { error, success, data } = await generateImageAction(values);
      if (!success) {
        set({ error: error, loading: false });
        return;
      }

      // Save each generated image to gallery
      const imageUrls = Array.isArray(data) ? data : [data];
      for (const url of imageUrls) {
        await saveToGallery(
          url,
          values.prompt,
          values.model,
          values.guidance,
          values.num_of_inference_steps,
          values.output_format,
          values.aspect_ratio,
          [], // tags (empty by default)
          undefined // image_name (user can rename in gallery)
        );
      }

      const dataWithUrl = imageUrls.map((url: string) => {
        return { url };
      });
      set({ images: dataWithUrl, loading: false });
    } catch (e) {
      console.log(e);
      set({ error: "failed to generate image", loading: false });
    }
  },
}));

export default useGeneratedStore;
