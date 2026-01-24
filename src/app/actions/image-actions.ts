/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { z } from "zod";
import { ImageGenerationFormSchema } from "@/components/image-generation/Configurations";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
    useFileOutput:false,
});

interface ImageResponse {
  error: string | null;
  success: boolean;
  data: any | null;
}

export async function generateImageAction(
  input: z.infer<typeof ImageGenerationFormSchema>
): Promise<ImageResponse> {
  const modelInput = {
    prompt: input.prompt,
    go_fast: true,
    guidance: input.guidance,
    megapixels: "1",
    num_outputs: input.num_outputs,
    aspect_ratio: input.aspect_ratio,
    output_format: input.output_format,
    output_quality: input.output_quality,
    prompt_strength: 0.8,
    num_inference_steps: input.num_of_inference_steps,
  };

    try {
        const output = await replicate.run(input.model as `${string}/${string}`, {
            input: modelInput,
        });
        return {
            error: null,
            success: true,
            data:output,
        }
    
    } catch (e: any) {
        return {
            error: e.message || "Failed to generate image!",
            success: false,
            data: null
        }
  }
}
