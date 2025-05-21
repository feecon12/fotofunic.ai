import { create } from "zustand";
import { ImageGenerationFormSchema } from "@/components/image-generation/Configurations";
import { z } from "zod";
import { generateImageAction } from "@/app/actions/image-actions";

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
      const dataWithUrl = data.map((url: string) => {
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
