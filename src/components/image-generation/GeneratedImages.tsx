"use client";

import { downloadImage } from "@/lib/download-utils";
import { cn } from "@/lib/utils";
import useGeneratedStore from "@/store/useGeneratedStore";
import { Download, Loader2, Lock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";

// const images = [
//   {
//     src: "/hero-images/Charismatic Young Man with a Warm Smile and Stylish Tousled Hair.jpeg",
//     alt: "some alt text",
//   },
//   {
//     src: "/hero-images/Confident Businesswoman on Turquoise Backdrop.jpeg",
//     alt: "some alt text",
//   },
//   {
//     src: "/hero-images/Confident Woman in Red Outfit.jpeg",
//     alt: "some alt text",
//   },
//   {
//     src: "/hero-images/Man in Brown Suit.jpeg",
//     alt: "some alt text",
//   },
// ];

const GeneratedImages = ({ blurred = false }: { blurred?: boolean }) => {
  const images = useGeneratedStore((state) => state.images);
  const loading = useGeneratedStore((state) => state.loading);
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleDownload = async (imageUrl: string, index: number) => {
    setDownloading(index);
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      await downloadImage(
        imageUrl,
        `generated-image-${timestamp}-${index + 1}`,
      );
      toast.success("Image downloaded!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to download image";
      toast.error(errorMessage);
    } finally {
      setDownloading(null);
    }
  };

  if (images.length === 0) {
    return (
      <Card className="w-full bg-muted p-4 rounded-lg border">
        <CardContent className="flex aspect-[3/2] items-center justify-center">
          <span className="text-2xl">No images generated</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="bg-background p-4 rounded-lg border relative">
        <Carousel className="w-full">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="flex relative items-center justify-center rounded-lg overflow-hidden aspect-[3/2]">
                  {loading ? (
                    <Loader2 className="absolute inset-0 m-auto animate-spin" />
                  ) : (
                    <Image
                      src={image.url}
                      alt={"generated images using AI"}
                      fill
                      className={cn(
                        "w-full h-full object-cover transition",
                        blurred && "blur-md scale-[1.02]",
                      )}
                    />
                  )}
                  {blurred && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                      <Lock className="h-6 w-6 mb-2" />
                      <p className="text-sm font-medium">Sign up to unlock</p>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" />
        </Carousel>
      </div>

      {/* Download Button */}
      {!loading && images.length > 0 && (
        <div className="flex gap-2 w-full justify-end">
          {images.length > 1 && (
            <Button
              onClick={() => {
                images.forEach((image, index) => {
                  setTimeout(
                    () => handleDownload(image.url, index),
                    index * 200,
                  );
                });
              }}
              disabled={downloading !== null || blurred}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Download All ({images.length})
            </Button>
          )}
          <Button
            onClick={() => handleDownload(images[0].url, 0)}
            disabled={downloading !== null || blurred}
            className="flex items-center gap-2"
            size="sm"
          >
            {downloading === 0 ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GeneratedImages;
