"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  value: string[]; // Array of filenames
  onChange: (filenames: string[]) => void;
  error?: string;
  maxImages?: number;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  filename?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  error,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<{ filename: string; url: string }[]>(
    []
  );
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, UploadProgress>
  >(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update previews when value changes
  useEffect(() => {
    const updatePreviews = async () => {
      const newPreviews = value.map((filename) => ({
        filename,
        url: `/api/filedata/${filename}`,
      }));
      setPreviews(newPreviews);
    };
    updatePreviews();
  }, [value]);

  const uploadFile = async (
    file: File,
    fileId: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit.");
    }

    // Upload using chunked upload with progress tracking
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("filename", filename);
      formData.append("chunkIndex", chunkIndex.toString());
      formData.append("totalChunks", totalChunks.toString());

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Upload failed");
      }

      // Update progress
      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      onProgress(progress);

      // Last chunk returns the filename
      if (chunkIndex === totalChunks - 1) {
        const result = await response.json();
        return result.filename || filename;
      }
    }

    return filename;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newFilenames: string[] = [];
    const progressMap = new Map<string, UploadProgress>();

    // Initialize progress for all files
    Array.from(files).forEach((file, index) => {
      const fileId = `file-${Date.now()}-${index}`;
      progressMap.set(fileId, {
        fileId,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      });
    });

    setUploadProgress(new Map(progressMap));

    // Upload all files in parallel
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const fileId = `file-${Date.now()}-${index}`;

      try {
        const filename = await uploadFile(
          file,
          fileId,
          (progress) => {
            setUploadProgress((prev) => {
              const newMap = new Map(prev);
              const current = newMap.get(fileId);
              if (current) {
                newMap.set(fileId, {
                  ...current,
                  progress,
                });
              }
              return newMap;
            });
          }
        );

        // Mark as completed
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(fileId);
          if (current) {
            newMap.set(fileId, {
              ...current,
              progress: 100,
              status: "completed",
              filename,
            });
          }
          return newMap;
        });

        return filename;
      } catch (error: any) {
        // Mark as error
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(fileId);
          if (current) {
            newMap.set(fileId, {
              ...current,
              status: "error",
              error: error.message || "Upload failed",
            });
          }
          return newMap;
        });

        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        throw error;
      }
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<string>).value);

      if (successfulUploads.length > 0) {
        onChange([...value, ...successfulUploads]);
        toast.success(
          `${successfulUploads.length} image(s) uploaded successfully`
        );
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(new Map());
      }, 2000);
    } catch (error: any) {
      console.error("Error uploading images:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (filename: string) => {
    onChange(value.filter((f) => f !== filename));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const uploadingFiles = Array.from(uploadProgress.values());

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {previews.map((preview, index) => (
          <div
            key={preview.filename}
            className="relative aspect-square rounded-lg overflow-hidden border border-input bg-muted group"
          >
            <Image
              src={preview.url}
              alt={`Gallery image ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(preview.filename)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {/* Upload progress items */}
        {uploadingFiles.map((upload) => (
          <div
            key={upload.fileId}
            className="relative aspect-square rounded-lg overflow-hidden border border-input bg-muted"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-background/80">
              {upload.status === "uploading" && (
                <>
                  <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                  <Progress value={upload.progress} className="w-full mb-1" />
                  <p className="text-xs text-muted-foreground text-center truncate w-full">
                    {upload.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {upload.progress}%
                  </p>
                </>
              )}
              {upload.status === "completed" && (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500 mb-1" />
                  <p className="text-xs text-green-500 text-center truncate w-full">
                    Uploaded
                  </p>
                </>
              )}
              {upload.status === "error" && (
                <>
                  <AlertCircle className="w-6 h-6 text-destructive mb-1" />
                  <p className="text-xs text-destructive text-center truncate w-full">
                    Failed
                  </p>
                </>
              )}
            </div>
          </div>
        ))}

        {value.length + uploadingFiles.length < maxImages && (
          <div
            onClick={handleClick}
            className="aspect-square rounded-lg border-2 border-dashed border-input bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />
                <span className="text-xs text-muted-foreground text-center px-2">
                  Uploading...
                </span>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground text-center px-2">
                  Add Images
                </span>
                <span className="text-xs text-muted-foreground/70 text-center px-2 mt-1">
                  (Multiple)
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload progress list */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Upload Progress:</p>
          {uploadingFiles.map((upload) => (
            <div key={upload.fileId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{upload.fileName}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {upload.progress}%
                </span>
              </div>
              <Progress value={upload.progress} className="h-1.5" />
              {upload.status === "error" && upload.error && (
                <p className="text-xs text-destructive">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || value.length >= maxImages}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        {value.length} / {maxImages} images uploaded
        {uploadingFiles.length > 0 &&
          ` (${uploadingFiles.length} uploading...)`}
      </p>
    </div>
  );
}

