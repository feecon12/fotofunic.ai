"use client";

import {
  deleteGalleryImage,
  fetchGalleryImages,
  getAllTags,
  getImagesByTag,
  saveToGallery,
  toggleFavorite,
  updateGalleryImage,
} from "@/app/actions/gallery-actions";
import { create } from "zustand";

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
  is_favorite: boolean;
}

interface GalleryState {
  images: GalleryImage[];
  allTags: string[];
  selectedTag: string | null;
  showOnlyFavorites: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  loadGallery: () => Promise<void>;
  loadImagesByTag: (tag: string) => Promise<void>;
  clearTagFilter: () => Promise<void>;
  toggleShowFavorites: () => void;
  deleteImage: (imageId: number) => Promise<void>;
  renameImage: (imageId: number, newName: string) => Promise<void>;
  addTagToImage: (imageId: number, tag: string) => Promise<void>;
  removeTagFromImage: (imageId: number, tag: string) => Promise<void>;
  toggleFavoriteImage: (imageId: number) => Promise<void>;
  loadAllTags: () => Promise<void>;
  addToGallery: (
    url: string,
    prompt: string,
    model: string,
    guidance: number,
    num_inference_steps: number,
    output_format: string,
    aspect_ratio: string,
    tags?: string[],
    image_name?: string
  ) => Promise<void>;
}

const useGalleryStore = create<GalleryState>((set, get) => ({
  images: [],
  allTags: [],
  selectedTag: null,
  showOnlyFavorites: false,
  loading: false,
  error: null,

  toggleShowFavorites: () => {
    set({ showOnlyFavorites: !get().showOnlyFavorites });
  },

  loadGallery: async () => {
    set({ loading: true, error: null });
    try {
      const { success, data, error } = await fetchGalleryImages();
      if (!success) {
        set({ error: error || "Failed to load gallery", loading: false });
        return;
      }
      set({ images: data || [], loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  },

  loadImagesByTag: async (tag: string) => {
    set({ loading: true, error: null, selectedTag: tag });
    try {
      const { success, data, error } = await getImagesByTag(tag);
      if (!success) {
        set({ error: error || "Failed to load images", loading: false });
        return;
      }
      set({ images: data || [], loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  },

  clearTagFilter: async () => {
    set({ selectedTag: null });
    await get().loadGallery();
  },

  deleteImage: async (imageId: number) => {
    // Optimistic update - immediately remove from UI
    const previousImages = get().images;
    set((state) => ({
      images: state.images.filter((img) => img.id !== imageId),
    }));

    try {
      const { success, error } = await deleteGalleryImage(imageId);
      if (!success) {
        // Rollback on error
        set({
          images: previousImages,
          error: error || "Failed to delete image",
        });
        return;
      }
    } catch (err) {
      // Rollback on error
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ images: previousImages, error: errorMessage });
    }
  },

  renameImage: async (imageId: number, newName: string) => {
    // Optimistic update - immediately update UI with new name
    const previousImages = get().images;
    set((state) => ({
      images: state.images.map((img) =>
        img.id === imageId ? { ...img, image_name: newName } : img
      ),
    }));

    try {
      const { success, data, error } = await updateGalleryImage(
        imageId,
        newName
      );
      if (!success) {
        // Rollback on error
        set({
          images: previousImages,
          error: error || "Failed to rename image",
        });
        return;
      }
      // Update with server response to ensure consistency
      set((state) => ({
        images: state.images.map((img) => (img.id === imageId ? data! : img)),
      }));
    } catch (err) {
      // Rollback on error
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ images: previousImages, error: errorMessage });
    }
  },

  addTagToImage: async (imageId: number, tag: string) => {
    // Optimistic update - immediately add tag to UI
    const previousImages = get().images;
    const currentImage = previousImages.find((img) => img.id === imageId);
    if (!currentImage) {
      set({ error: "Image not found" });
      return;
    }

    const newTags = Array.from(new Set([...currentImage.tags, tag]));
    set((state) => ({
      images: state.images.map((img) =>
        img.id === imageId ? { ...img, tags: newTags } : img
      ),
    }));

    try {
      const { success, data, error } = await updateGalleryImage(
        imageId,
        undefined,
        newTags
      );
      if (!success) {
        // Rollback on error
        set({ images: previousImages, error: error || "Failed to add tag" });
        return;
      }

      // Update with server response and reload tags in background
      set((state) => ({
        images: state.images.map((img) => (img.id === imageId ? data! : img)),
      }));
      await get().loadAllTags();
    } catch (err) {
      // Rollback on error
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ images: previousImages, error: errorMessage });
    }
  },

  removeTagFromImage: async (imageId: number, tag: string) => {
    // Optimistic update - immediately remove tag from UI
    const previousImages = get().images;
    const currentImage = previousImages.find((img) => img.id === imageId);
    if (!currentImage) {
      set({ error: "Image not found" });
      return;
    }

    const newTags = currentImage.tags.filter((t) => t !== tag);
    set((state) => ({
      images: state.images.map((img) =>
        img.id === imageId ? { ...img, tags: newTags } : img
      ),
    }));

    try {
      const { success, data, error } = await updateGalleryImage(
        imageId,
        undefined,
        newTags
      );
      if (!success) {
        // Rollback on error
        set({ images: previousImages, error: error || "Failed to remove tag" });
        return;
      }

      // Update with server response and reload tags in background
      set((state) => ({
        images: state.images.map((img) => (img.id === imageId ? data! : img)),
      }));
      await get().loadAllTags();
    } catch (err) {
      // Rollback on error
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ images: previousImages, error: errorMessage });
    }
  },

  loadAllTags: async () => {
    try {
      const { success, data, error } = await getAllTags();
      if (!success) {
        console.error("Failed to load tags:", error);
        return;
      }
      set({ allTags: data || [] });
    } catch (err) {
      console.error("Error loading tags:", err);
    }
  },

  addToGallery: async (
    url: string,
    prompt: string,
    model: string,
    guidance: number,
    num_inference_steps: number,
    output_format: string,
    aspect_ratio: string,
    tags = [],
    image_name = undefined
  ) => {
    set({ loading: true, error: null });
    try {
      const { success, data, error } = await saveToGallery(
        url,
        prompt,
        model,
        guidance,
        num_inference_steps,
        output_format,
        aspect_ratio,
        tags,
        image_name
      );
      if (!success) {
        set({ error: error || "Failed to save image", loading: false });
        return;
      }

      // Add to local state
      set((state) => ({
        images: [data!, ...state.images],
        loading: false,
      }));

      // Reload tags
      await get().loadAllTags();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  },

  toggleFavoriteImage: async (imageId: number) => {
    // Optimistic update
    const previousImages = get().images;
    set((state) => ({
      images: state.images.map((img) =>
        img.id === imageId ? { ...img, is_favorite: !img.is_favorite } : img
      ),
    }));

    try {
      const { success, data, error } = await toggleFavorite(imageId);
      if (!success) {
        // Rollback on error
        set({
          images: previousImages,
          error: error || "Failed to toggle favorite",
        });
        return;
      }

      // Update with server response
      set((state) => ({
        images: state.images.map((img) => (img.id === imageId ? data! : img)),
      }));
    } catch (err) {
      // Rollback on error
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      set({ images: previousImages, error: errorMessage });
    }
  },
}));

export default useGalleryStore;
