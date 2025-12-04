"use client";

import { useEffect } from "react";
import { useGalleryStore } from "./_store/gallery-store";
import { GalleryForm } from "./_components/gallery-form";
import { GalleryCard } from "./_components/gallery-card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GalleryFormValues } from "./_schema";
import { toast } from "sonner";

export default function GalleryPage() {
  const {
    galleries,
    isLoading,
    isSubmitting,
    isFormOpen,
    isDeleteDialogOpen,
    selectedGallery,
    fetchGalleries,
    createGallery,
    updateGallery,
    deleteGallery,
    setFormOpen,
    setDeleteDialogOpen,
    setSelectedGallery,
  } = useGalleryStore();

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  const handleCreate = () => {
    setSelectedGallery(null);
    setFormOpen(true);
  };

  const handleEdit = (gallery: any) => {
    setSelectedGallery(gallery);
    setFormOpen(true);
  };

  const handleDelete = (gallery: any) => {
    setSelectedGallery(gallery);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: GalleryFormValues) => {
    const success = selectedGallery
      ? await updateGallery(selectedGallery.id, data)
      : await createGallery(data);

    if (success) {
      setFormOpen(false);
      setSelectedGallery(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedGallery) {
      const success = await deleteGallery(selectedGallery.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedGallery(null);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gallery Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your gallery collections and images
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Gallery
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : galleries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No galleries found</p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Gallery
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {galleries.map((gallery) => (
            <GalleryCard
              key={gallery.id}
              gallery={gallery}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedGallery ? "Edit Gallery" : "Create Gallery"}
            </DialogTitle>
          </DialogHeader>
          <GalleryForm
            gallery={selectedGallery}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setSelectedGallery(null);
            }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the gallery &quot;
              {selectedGallery?.name}&quot; and all its images. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
