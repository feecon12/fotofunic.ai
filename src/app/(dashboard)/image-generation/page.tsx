"use client";

import Configurations from "@/components/image-generation/Configurations";
import GeneratedImages from "@/components/image-generation/GeneratedImages";
import { useIsMobile } from "@/hooks/use-mobile";

const ImageGenerationPage = () => {
  const isMobile = useIsMobile();

  return (
    <section
      className={`container mx-auto flex-1 overflow-hidden ${
        isMobile ? "flex flex-col gap-4" : "grid gap-4 grid-cols-3"
      }`}
    >
      <Configurations />
      <div
        className={`${
          isMobile ? "w-full" : "col-span-2"
        } p-4 rounded-xl flex items-center justify-center h-fit`}
      >
        <GeneratedImages />
      </div>
    </section>
  );
};

export default ImageGenerationPage;
