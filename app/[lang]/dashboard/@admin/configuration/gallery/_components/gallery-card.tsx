"use client";

import { Gallery } from "../_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface GalleryCardProps {
  gallery: Gallery;
  onEdit: (gallery: Gallery) => void;
  onDelete: (gallery: Gallery) => void;
}

export function GalleryCard({ gallery, onEdit, onDelete }: GalleryCardProps) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = gallery.images || [];
  const firstImage = images[0];
  const imageUrl = firstImage
    ? `/api/filedata/${firstImage.filename}`
    : "/placeholder-image.png";

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative aspect-video w-full bg-muted">
          {firstImage ? (
            <Image
              src={imageUrl}
              alt={gallery.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No images
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              +{images.length - 1} more
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1">{gallery.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {gallery.description || "No description"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setIsViewOpen(true)}
                title="View Gallery"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onEdit(gallery)}
                title="Edit Gallery"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => onDelete(gallery)}
                title="Delete Gallery"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Gallery Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{gallery.name}</DialogTitle>
          </DialogHeader>
          {gallery.description && (
            <p className="text-sm text-muted-foreground">
              {gallery.description}
            </p>
          )}
          {images.length > 0 ? (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                <Image
                  src={`/api/filedata/${images[selectedImageIndex].filename}`}
                  alt={`${gallery.name} - Image ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      }`}
                    >
                      <Image
                        src={`/api/filedata/${img.filename}`}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Image {selectedImageIndex + 1} of {images.length}
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No images in this gallery
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

