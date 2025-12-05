"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gallery,
  GalleryImage,
} from "@/app/admin/configuration/gallery/_types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GalleryDisplay() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const response = await fetch("/api/gallery", {
          cache: "no-store",
        });
        const result = await response.json();
        if (result.success) {
          setGalleries(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching galleries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleries();
  }, []);

  const handleGalleryClick = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setSelectedImageIndex(0);
    setIsViewOpen(true);
  };

  const handlePreviousImage = () => {
    if (selectedGallery && selectedGallery.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? selectedGallery.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (selectedGallery && selectedGallery.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === selectedGallery.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Gallery</h2>
          <div className="text-center text-muted-foreground">
            Loading galleries...
          </div>
        </div>
      </section>
    );
  }

  if (galleries.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleries.map((gallery) => {
              const firstImage = gallery.images?.[0];
              const imageUrl = firstImage
                ? `/api/filedata/${firstImage.filename}`
                : "/placeholder-image.png";
              const imageCount = gallery.images?.length || 0;

              return (
                <Card
                  key={gallery.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleGalleryClick(gallery)}
                >
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
                    {imageCount > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        +{imageCount - 1}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {gallery.name}
                    </h3>
                    {gallery.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {gallery.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedGallery?.name}</DialogTitle>
          </DialogHeader>
          {selectedGallery?.description && (
            <p className="text-sm text-muted-foreground px-6">
              {selectedGallery.description}
            </p>
          )}
          {selectedGallery && selectedGallery.images.length > 0 ? (
            <div className="flex-1 flex flex-col space-y-4 px-6 overflow-y-auto">
              {/* Main Image */}
              <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                <Image
                  src={`/api/filedata/${selectedGallery.images[selectedImageIndex].filename}`}
                  alt={`${selectedGallery.name} - Image ${
                    selectedImageIndex + 1
                  }`}
                  fill
                  className="object-contain"
                  unoptimized
                />
                {selectedGallery.images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={handlePreviousImage}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Image Counter */}
              <p className="text-center text-sm text-muted-foreground">
                Image {selectedImageIndex + 1} of{" "}
                {selectedGallery.images.length}
              </p>

              {/* Thumbnail Grid */}
              {selectedGallery.images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pb-4">
                  {selectedGallery.images.map((img, index) => (
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
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No images in this gallery
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
