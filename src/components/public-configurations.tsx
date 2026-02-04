"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import useGeneratedStore from "@/store/useGeneratedStore";
import { Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const PublicPromptSchema = z.object({
  prompt: z.string().min(1, { message: "Prompt is required" }),
});

type PublicPromptValues = z.infer<typeof PublicPromptSchema>;

const DEFAULT_VALUES = {
  model: "black-forest-labs/flux-dev",
  guidance: 3.5,
  num_outputs: 1,
  aspect_ratio: "1:1",
  output_format: "jpg",
  output_quality: 80,
  num_of_inference_steps: 28,
};

interface PublicConfigurationsProps {
  onBeforeGenerate?: () => boolean;
  onLockedClick?: () => void;
}

export function PublicConfigurations({
  onBeforeGenerate,
  onLockedClick,
}: PublicConfigurationsProps) {
  const generateImage = useGeneratedStore((state) => state.generateImage);
  const loading = useGeneratedStore((state) => state.loading);
  const error = useGeneratedStore((state) => state.error);

  const form = useForm<PublicPromptValues>({
    resolver: zodResolver(PublicPromptSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(values: PublicPromptValues) {
    const canGenerate = onBeforeGenerate?.();
    if (canGenerate === false) {
      return;
    }

    await generateImage({
      ...DEFAULT_VALUES,
      prompt: values.prompt,
    });

    if (error) {
      toast.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FormLabel>Advanced Settings</FormLabel>
            <span className="text-xs text-muted-foreground">Pro</span>
          </div>

          <div className="relative rounded-lg border bg-muted/30 p-4">
            <div className="pointer-events-none space-y-4 blur-[2px]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>Model</FormLabel>
                  <Select defaultValue={DEFAULT_VALUES.model} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black-forest-labs/flux-dev">
                        Flux Dev
                      </SelectItem>
                      <SelectItem value="black-forest-labs/flux-schnell">
                        Flux Schnell
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FormLabel>Aspect Ratio</FormLabel>
                  <Select defaultValue={DEFAULT_VALUES.aspect_ratio} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">1:1</SelectItem>
                      <SelectItem value="4:5">4:5</SelectItem>
                      <SelectItem value="16:9">16:9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Guidance</FormLabel>
                <Slider
                  value={[DEFAULT_VALUES.guidance]}
                  max={10}
                  step={0.1}
                  disabled
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>Output Format</FormLabel>
                  <Select defaultValue={DEFAULT_VALUES.output_format} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WEBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FormLabel>Outputs</FormLabel>
                  <Input
                    type="number"
                    defaultValue={DEFAULT_VALUES.num_outputs}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Output Quality</FormLabel>
                <Slider
                  value={[DEFAULT_VALUES.output_quality]}
                  max={100}
                  step={1}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Inference Steps</FormLabel>
                <Slider
                  value={[DEFAULT_VALUES.num_of_inference_steps]}
                  max={50}
                  step={1}
                  disabled
                />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Button type="button" onClick={onLockedClick} className="gap-2">
                <Lock className="h-4 w-4" />
                Unlock Advanced Settings
              </Button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </form>
    </Form>
  );
}
