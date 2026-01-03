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
import useTranslation from "@/hooks/useTranslation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GalleryPage() {
  const { t } = useTranslation();
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
    // pagination
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
  } = useGalleryStore();

  useEffect(() => {
    fetchGalleries({ page, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="h-dvh overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t("dashboard.galleryManagement")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.manageGalleryCollections")}
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t("dashboard.createGallery")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : galleries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {t("dashboard.noGalleriesFound")}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.createYourFirstGallery")}
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

        {/* Pagination */}
        {(() => {
          const derivedTotalPages = Math.max(1, Math.ceil(total / pageSize));
          return derivedTotalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 px-3 py-2 sticky bottom-0 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                {t("dashboard.showing")}{" "}
                {Math.min((page - 1) * pageSize + 1, total)} {t("dashboard.to")}{" "}
                {Math.min(page * pageSize, total)} {t("dashboard.of")} {total}{" "}
                {t("dashboard.galleries")}
              </div>
              <div className="flex items-center gap-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={
                          page === 1 || isLoading
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {(() => {
                      const items: (number | string)[] = [];
                      const maxVisible = 5;
                      if (derivedTotalPages <= maxVisible) {
                        for (let i = 1; i <= derivedTotalPages; i++)
                          items.push(i);
                      } else {
                        items.push(1);
                        let start = Math.max(2, page - 1);
                        let end = Math.min(derivedTotalPages - 1, page + 1);
                        if (page <= 3) end = Math.min(4, derivedTotalPages - 1);
                        if (page >= derivedTotalPages - 2)
                          start = Math.max(2, derivedTotalPages - 3);
                        if (start > 2) items.push("ellipsis-start");
                        for (let i = start; i <= end; i++) items.push(i);
                        if (end < derivedTotalPages - 1)
                          items.push("ellipsis-end");
                        if (derivedTotalPages > 1)
                          items.push(derivedTotalPages);
                      }
                      return items.map((item, index) => {
                        if (
                          item === "ellipsis-start" ||
                          item === "ellipsis-end"
                        ) {
                          return (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        const pageNum = item as number;
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      });
                    })()}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          page < derivedTotalPages && setPage(page + 1)
                        }
                        className={
                          page === derivedTotalPages || isLoading
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("dashboard.perPage")}
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => setPageSize(parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="96">96</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Create/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedGallery
                  ? t("dashboard.editGallery")
                  : t("dashboard.createGallery")}
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
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("dashboard.areYouSure")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("dashboard.deleteGalleryConfirm").replace(
                  "{name}",
                  selectedGallery?.name || ""
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? t("dashboard.deleting") : t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
