/**
 * Download image from URL
 * @param imageUrl - The URL of the image to download
 * @param filename - Optional filename (without extension, will be added)
 */
export async function downloadImage(
  imageUrl: string,
  filename: string = "image"
): Promise<void> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Determine file extension from content-type or URL
    let extension = ".jpg";
    const contentType = response.headers.get("content-type");
    if (contentType) {
      if (contentType.includes("png")) extension = ".png";
      else if (contentType.includes("webp")) extension = ".webp";
      else if (contentType.includes("jpeg") || contentType.includes("jpg"))
        extension = ".jpg";
    } else if (imageUrl.includes(".png")) {
      extension = ".png";
    } else if (imageUrl.includes(".webp")) {
      extension = ".webp";
    }

    // Create blob URL
    const blobUrl = window.URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${filename}${extension}`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to download image";
    throw new Error(errorMessage);
  }
}

/**
 * Download multiple images as individual files
 */
export async function downloadImages(
  images: Array<{ url: string; name?: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const filename = image.name || `image-${new Date().getTime()}-${i + 1}`;

    await downloadImage(image.url, filename);

    onProgress?.(i + 1, images.length);

    // Add a small delay between downloads to avoid overwhelming the browser
    if (i < images.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

/**
 * Download multiple images as a ZIP file
 * Requires JSZip library: npm install jszip
 */
export async function downloadImagesAsZip(
  images: Array<{ url: string; name?: string }>,
  zipFilename: string = "images",
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  try {
    // Dynamically import JSZip to avoid dependency issues
    const { default: JSZip } = await import("jszip");

    const zip = new JSZip();
    const imgFolder = zip.folder("images");

    if (!imgFolder) {
      throw new Error("Failed to create images folder in ZIP");
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        const response = await fetch(image.url);

        if (!response.ok) {
          console.warn(`Failed to fetch image ${i + 1}, skipping...`);
          continue;
        }

        const blob = await response.blob();

        // Determine file extension
        let extension = ".jpg";
        const contentType = response.headers.get("content-type");
        if (contentType) {
          if (contentType.includes("png")) extension = ".png";
          else if (contentType.includes("webp")) extension = ".webp";
          else if (contentType.includes("jpeg") || contentType.includes("jpg"))
            extension = ".jpg";
        }

        // Create filename
        const filename = image.name || `image-${new Date().getTime()}-${i + 1}`;
        imgFolder.file(`${filename}${extension}`, blob);

        onProgress?.(i + 1, images.length);

        // Small delay between fetches
        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn(`Error processing image ${i + 1}:`, error);
        continue;
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Download ZIP
    const blobUrl = window.URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${zipFilename}.zip`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to download images as ZIP";
    throw new Error(errorMessage);
  }
}
