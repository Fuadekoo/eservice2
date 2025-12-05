"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface SingleImageUploadProps {
  value: string | null; // Filename
  onChange: (filename: string | null) => void;
  error?: string;
}

export function SingleImageUpload({
  value,
  onChange,
  error,
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value changes
  useEffect(() => {
    if (value) {
      setPreview(`/api/filedata/${value}`);
    } else {
      setPreview(null);
    }
  }, [value]);

  const uploadFile = async (
    file: File,
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
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const filename = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      onChange(filename);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
      setPreview(value ? `/api/filedata/${value}` : null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-input bg-muted">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
          {!uploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
              <Progress value={uploadProgress} className="w-3/4" />
              <p className="text-white text-sm mt-2">{uploadProgress}%</p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-input bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />
              <Progress value={uploadProgress} className="w-3/4" />
              <p className="text-muted-foreground text-sm mt-2">
                {uploadProgress}%
              </p>
            </>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground text-center px-4">
                Click to upload image
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

