"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { downloadImage, downloadImagesAsZip } from "@/lib/download-utils";
import useGalleryStore from "@/store/useGalleryStore";
import {
  CheckSquare,
  Download,
  Edit2,
  Heart,
  Loader2,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function GalleryPage() {
  const {
    images,
    allTags,
    selectedTag,
    showOnlyFavorites,
    loading,
    error,
    loadGallery,
    loadImagesByTag,
    clearTagFilter,
    toggleShowFavorites,
    deleteImage,
    renameImage,
    addTagToImage,
    removeTagFromImage,
    toggleFavoriteImage,
    loadAllTags,
  } = useGalleryStore();

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [addingTagId, setAddingTagId] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [renamingImageId, setRenamingImageId] = useState<number | null>(null);
  const [taggingImageId, setTaggingImageId] = useState<number | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Bulk operations state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkTagging, setBulkTagging] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState("");
  const [showBulkTagDialog, setShowBulkTagDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  useEffect(() => {
    loadGallery();
    loadAllTags();
  }, [loadGallery, loadAllTags]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRename = async (imageId: number) => {
    if (!renamingValue.trim()) {
      toast.error("Please enter a name");
      return;
    }
    const newName = renamingValue; // Save value before clearing
    setRenamingId(null); // Close dialog immediately
    setRenamingValue("");
    setRenamingImageId(imageId); // Set rename operation state
    try {
      await renameImage(imageId, newName);
      toast.success("Image renamed!");
    } catch {
      toast.error("Failed to rename image");
    } finally {
      setRenamingImageId(null);
    }
  };

  const handleAddTag = async (imageId: number) => {
    if (!newTag.trim()) {
      toast.error("Please enter a tag");
      return;
    }
    const tagToAdd = newTag; // Save tag before clearing
    setAddingTagId(null); // Close dialog immediately
    setNewTag("");
    setTaggingImageId(imageId); // Set tagging operation state
    try {
      await addTagToImage(imageId, tagToAdd.trim().toLowerCase());
      toast.success("Tag added!");
    } catch {
      toast.error("Failed to add tag");
    } finally {
      setTaggingImageId(null);
    }
  };

  const handleDeleteTag = async (imageId: number, tag: string) => {
    setTaggingImageId(imageId); // Set tagging operation state
    try {
      await removeTagFromImage(imageId, tag);
      toast.success("Tag removed!");
    } catch {
      toast.error("Failed to remove tag");
    } finally {
      setTaggingImageId(null);
    }
  };

  const handleDelete = async (imageId: number) => {
    setDeletingImageId(imageId); // Set delete operation state
    try {
      await deleteImage(imageId);
      setDeletingId(null);
      toast.success("Image deleted!");
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDownload = async (image: GalleryImage) => {
    setDownloadingId(image.id);
    try {
      const filename = image.image_name || `image-${image.id}`;
      await downloadImage(image.url, filename);
      toast.success("Image downloaded!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to download image";
      toast.error(errorMessage);
    } finally {
      setDownloadingId(null);
    }
  };

  // Bulk operations handlers
  const toggleSelectImage = (imageId: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map((img) => img.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;

    const imagesToDelete = Array.from(selectedImages);
    const count = imagesToDelete.length;

    setShowBulkDeleteDialog(false); // Close dialog immediately
    setBulkDeleting(true);

    try {
      for (const imageId of imagesToDelete) {
        await deleteImage(imageId);
      }
      setSelectedImages(new Set());
      toast.success(`Deleted ${count} image(s)!`);
    } catch (error) {
      toast.error("Failed to delete some images");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkTag = async () => {
    if (selectedImages.size === 0 || !bulkTagValue.trim()) return;

    const imagesToTag = Array.from(selectedImages);
    const count = imagesToTag.length;
    const tagToAdd = bulkTagValue.trim().toLowerCase();

    setShowBulkTagDialog(false); // Close dialog immediately
    setBulkTagging(true);

    try {
      for (const imageId of imagesToTag) {
        await addTagToImage(imageId, tagToAdd);
      }
      setSelectedImages(new Set());
      setBulkTagValue("");
      toast.success(`Tagged ${count} image(s)!`);
    } catch (error) {
      toast.error("Failed to tag some images");
    } finally {
      setBulkTagging(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedImages.size === 0) return;

    setBulkDownloading(true);
    try {
      const imagesToDownload = filteredImages.filter((img) =>
        selectedImages.has(img.id)
      );

      if (imagesToDownload.length === 1) {
        // Single image - download directly
        const image = imagesToDownload[0];
        const filename = image.image_name || `image-${image.id}`;
        await downloadImage(image.url, filename);
        toast.success("Image downloaded!");
      } else {
        // Multiple images - download as ZIP
        await downloadImagesAsZip(
          imagesToDownload.map((img) => ({
            url: img.url,
            name: img.image_name || `image-${img.id}`,
          })),
          `fotofunic-images-${new Date().getTime()}`
        );
        toast.success(`Downloaded ${imagesToDownload.length} images as ZIP!`);
      }

      setSelectedImages(new Set());
      setSelectMode(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to download images";
      toast.error(errorMessage);
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleFilterByTag = (tag: string) => {
    if (selectedTag === tag) {
      clearTagFilter();
    } else {
      loadImagesByTag(tag);
    }
  };

  const filteredImages = (showOnlyFavorites ? images.filter(img => img.is_favorite) : images).filter(
    (img) =>
      !debouncedSearchQuery ||
      img.prompt.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      img.image_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Images</h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize your generated images
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            onClick={() => toggleShowFavorites()}
          >
            <Heart className={`h-4 w-4 mr-2 ${showOnlyFavorites ? 'fill-current' : ''}`} />
            Favorites {showOnlyFavorites && `(${images.filter(img => img.is_favorite).length})`}
          </Button>
          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) {
                setSelectedImages(new Set());
              }
            }}
          >
            {selectMode ? "Exit Select Mode" : "Select Multiple"}
          </Button>
        </div>
      </div>

      {/* Bulk Selection Toolbar */}
      {selectMode && selectedImages.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedImages.size} selected
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkDownload()}
                disabled={bulkDownloading}
              >
                {bulkDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download as {selectedImages.size > 1 ? "ZIP" : "File"}
                  </>
                )}
              </Button>

              <Dialog
                open={showBulkTagDialog}
                onOpenChange={setShowBulkTagDialog}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBulkTagDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tag
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Add Tag to {selectedImages.size} Images
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      value={bulkTagValue}
                      onChange={(e) => setBulkTagValue(e.target.value)}
                      placeholder="e.g., portrait, landscape..."
                      autoFocus
                    />
                    <Button
                      onClick={() => handleBulkTag()}
                      className="w-full"
                      disabled={!bulkTagValue.trim() || bulkTagging}
                    >
                      {bulkTagging && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Add Tag to All
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog
                open={showBulkDeleteDialog}
                onOpenChange={setShowBulkDeleteDialog}
              >
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete All
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {selectedImages.size} Images?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All selected images will be
                      permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleBulkDelete()}
                      disabled={bulkDeleting}
                      className="bg-destructive text-destructive-foreground"
                    >
                      {bulkDeleting && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select All / Deselect All Bar (when in select mode) */}
      {selectMode && filteredImages.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSelectAll}
              className="gap-2"
            >
              {selectedImages.size === filteredImages.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedImages.size === filteredImages.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <p className="text-xs text-muted-foreground ml-auto">
              {selectedImages.size} of {filteredImages.length} selected
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        <Input
          placeholder="Search by prompt or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Filter by tags:</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleFilterByTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {selectedTag && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => clearTagFilter()}
                >
                  Clear Filter <X className="ml-1 h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredImages.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-2">
              {images.length === 0
                ? "No images yet. Generate your first image!"
                : "No images match your search."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gallery Grid */}
      {!loading && filteredImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className="overflow-hidden relative p-0 bg-transparent"
            >
              {/* Image Container */}
              <div
                className={`relative aspect-square overflow-hidden rounded-none cursor-pointer group ${
                  selectMode && selectedImages.has(image.id)
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
                onClick={() => selectMode && toggleSelectImage(image.id)}
              >
                <Image
                  src={image.url}
                  alt={image.image_name || "Generated image"}
                  fill
                  className={`object-cover hover:scale-105 transition-transform ${
                    selectMode && selectedImages.has(image.id)
                      ? "opacity-75"
                      : ""
                  }`}
                />

                {/* Checkbox overlay (floating over image when in select mode) */}
                {selectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    {selectedImages.has(image.id) ? (
                      <CheckSquare className="h-6 w-6 text-blue-500 fill-blue-500 drop-shadow-lg" />
                    ) : (
                      <Square className="h-6 w-6 text-white drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                )}
              </div>

              <CardContent className="pt-4 space-y-3">
                {/* Name */}
                <div>
                  {renamingId === image.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={renamingValue}
                        onChange={(e) => setRenamingValue(e.target.value)}
                        placeholder="Image name..."
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRename(image.id)}
                        disabled={loading}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex-1 transition-opacity ${
                          renamingImageId === image.id
                            ? "opacity-50"
                            : "opacity-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {image.image_name || "Untitled"}
                          </p>
                          {renamingImageId === image.id && (
                            <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(image.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Dialog
                        open={renamingId === image.id}
                        onOpenChange={(open) => {
                          if (!open) setRenamingId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRenamingId(image.id);
                              setRenamingValue(image.image_name || "");
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rename Image</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              value={renamingValue}
                              onChange={(e) => setRenamingValue(e.target.value)}
                              placeholder="New name..."
                              autoFocus
                            />
                            <Button
                              onClick={() => {
                                handleRename(image.id);
                              }}
                              className="w-full"
                              disabled={!renamingValue.trim()}
                            >
                              Rename
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Prompt:
                  </p>
                  <p className="text-xs line-clamp-2">{image.prompt}</p>
                </div>

                {/* Model Info */}
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Model:</span>{" "}
                    {image.model.split("/")[1]}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Format:</span>{" "}
                    {image.output_format} • {image.aspect_ratio}
                  </p>
                </div>

                {/* Tags */}
                <div
                  className={`space-y-2 transition-opacity ${
                    taggingImageId === image.id ? "opacity-50" : "opacity-100"
                  }`}
                >
                  {image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      {image.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => handleDeleteTag(image.id, tag)}
                            className="ml-1 hover:text-destructive disabled:opacity-50"
                            disabled={taggingImageId === image.id}
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </Badge>
                      ))}
                      {taggingImageId === image.id && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                    </div>
                  )}

                  {/* Add Tag */}
                  <Dialog
                    open={addingTagId === image.id}
                    onOpenChange={(open) => {
                      if (!open) setAddingTagId(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => setAddingTagId(image.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Tag
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Tag</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="e.g., portrait, landscape..."
                          autoFocus
                        />
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Suggested tags:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {allTags
                              .filter((t) => !image.tags.includes(t))
                              .slice(0, 5)
                              .map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="cursor-pointer text-xs"
                                  onClick={() => setNewTag(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddTag(image.id)}
                          className="w-full"
                          disabled={!newTag.trim()}
                        >
                          Add Tag
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Delete Button */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={image.is_favorite ? "default" : "outline"}
                    className="flex-1 text-xs"
                    onClick={() => toggleFavoriteImage(image.id)}
                  >
                    <Heart
                      className={`h-3 w-3 mr-1 ${
                        image.is_favorite ? "fill-current" : ""
                      }`}
                    />
                    {image.is_favorite ? "Favorited" : "Favorite"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleDownload(image)}
                    disabled={downloadingId === image.id}
                  >
                    {downloadingId === image.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </>
                    )}
                  </Button>

                  <AlertDialog
                    open={deletingId === image.id}
                    onOpenChange={(open) => {
                      if (!open) setDeletingId(null);
                    }}
                  >
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 text-xs"
                      onClick={() => setDeletingId(image.id)}
                      disabled={deletingImageId === image.id}
                    >
                      {deletingImageId === image.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-2 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(image.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && images.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {filteredImages.length} of {images.length} images
              {selectedTag && ` with tag "${selectedTag}"`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
