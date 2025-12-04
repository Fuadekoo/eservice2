"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface LogoUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  error?: string;
}

export function LogoUpload({ value, onChange, error }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value changes (e.g., when editing)
  useEffect(() => {
    if (value) {
      // If it's a relative path or absolute URL, use it directly
      // If it's a data URL (from FileReader), use that
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.data.url);
      } else {
        alert(result.error || "Failed to upload file");
        setPreview(null);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Field>
      <FieldLabel>Logo</FieldLabel>
      <div className="space-y-3">
        {preview ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-input bg-muted">
            <Image
              src={preview}
              alt="Logo preview"
              fill
              className="object-cover"
              unoptimized
            />
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="absolute top-1 right-1"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className="w-32 h-32 rounded-lg border-2 border-dashed border-input bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground text-center px-2">
              Click to upload
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {preview ? "Change Logo" : "Upload Logo"}
              </>
            )}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
        </p>
      </div>
    </Field>
  );
}

