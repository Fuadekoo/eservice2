"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Office } from "./_types";
import { OfficeFormValues } from "./_schema";
import { OfficeCard } from "./_components/office-card";
import { OfficeForm } from "./_components/office-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building2, Loader2, Trash2 } from "lucide-react";
import { useOfficeStore } from "./_store/office-store";
import { useRouter, useParams } from "next/navigation";
import useTranslation from "@/hooks/useTranslation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function OfficePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";

  // Zustand store
  const {
    offices: data,
    loading,
    isSubmitting,
    isFormOpen,
    isDeleteDialogOpen,
    isStatusDialogOpen,
    selectedOffice,
    page,
    pageSize,
    total,
    totalPages,
    search,
    setSearch,
    setPage,
    setPageSize,
    fetchOffices,
    createOffice,
    updateOffice,
    deleteOffice: deleteOfficeAction,
    toggleOfficeStatus,
    setFormOpen,
    setDeleteDialogOpen,
    setStatusDialogOpen,
    setSelectedOffice,
  } = useOfficeStore();

  // Track if this is the initial mount
  const isInitialMount = React.useRef(true);

  // Fetch offices on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchOffices({ search, page, pageSize });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search with debounce
  // Note: setPage and setPageSize already call fetchOffices internally
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      return;
    }

    const timer = setTimeout(() => {
      fetchOffices({ search, page: 1, pageSize });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Handle form submission
  const handleSubmit = async (data: OfficeFormValues) => {
    if (selectedOffice) {
      await updateOffice(selectedOffice.id, data);
    } else {
      await createOffice(data);
    }
  };

  // Handle edit
  const handleEdit = (office: Office) => {
    setSelectedOffice(office);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedOffice?.id) return;
    const success = await deleteOfficeAction(selectedOffice.id);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedOffice(null);
    }
  };

  // Handle create new
  const handleCreateNew = () => {
    setSelectedOffice(null);
    setFormOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (office: Office) => {
    setSelectedOffice(office);
    setDeleteDialogOpen(true);
  };

  // Handle toggle status click
  const handleToggleStatusClick = (office: Office) => {
    if (!office.id) {
      console.error("❌ Office ID is missing:", office);
      return;
    }
    setSelectedOffice(office);
    setStatusDialogOpen(true);
  };

  // Handle toggle status confirmation
  const handleToggleStatusConfirm = async () => {
    if (!selectedOffice?.id) {
      setStatusDialogOpen(false);
      return;
    }

    const newStatus = !selectedOffice.status;
    await toggleOfficeStatus(selectedOffice.id, newStatus);
    if (selectedOffice) {
      setStatusDialogOpen(false);
      setSelectedOffice(null);
    }
  };

  // Handle view details
  const handleViewDetails = (office: Office) => {
    router.push(`/${lang}/dashboard/office/${office.id}`);
  };

  const PaginationComponent = () => {
    if (total === 0) return null;

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 mt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {t("dashboard.showing")} {start}-{end} {t("dashboard.of")} {total} {t("dashboard.offices")}
        </div>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                    }
                  }}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-accent"
                  }
                  aria-disabled={page === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={pageNum === page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNum === page - 2 ||
                    pageNum === page + 2
                  ) {
                    // Show ellipsis
                    return (
                      <PaginationItem key={`ellipsis-${pageNum}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (page < totalPages) {
                      setPage(page + 1);
                    }
                  }}
                  className={
                    page === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-accent"
                  }
                  aria-disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-full h-dvh overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
        {loading && data.length === 0 && (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {t("dashboard.loadingOffices")}
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border rounded-lg">
            <Building2 className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t("dashboard.noOfficesYet")}</p>
            <p className="text-sm">
              {t("dashboard.clickNewOfficeToCreate")}
            </p>
          </div>
        )}

        {/* Header: description + create button */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {t("dashboard.createAndManageOffices")}
          </div>
          <div>
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("dashboard.newOffice")}
            </Button>
          </div>
        </div>

        {/* Filters card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder={t("dashboard.searchOffices")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-[260px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("dashboard.perPage")}</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    const newPageSize = Number(v);
                    setPageSize(newPageSize);
                    // Reset to page 1 when changing page size
                    if (page !== 1) {
                      setPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards grid */}
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((office) => (
              <OfficeCard
                key={office.id}
                office={office}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onToggleStatus={handleToggleStatusClick}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>

        {/* Pagination at bottom */}
        {data.length > 0 && <PaginationComponent />}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOffice ? t("dashboard.editOffice") : t("dashboard.createNewOffice")}
            </DialogTitle>
            <DialogDescription>
              {selectedOffice
                ? t("dashboard.updateOfficeInfo")
                : t("dashboard.fillDetailsToCreateOffice")}
            </DialogDescription>
          </DialogHeader>
          <OfficeForm
            office={selectedOffice}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setSelectedOffice(null);
            }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl">
                  {t("dashboard.deleteOffice")}
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="pt-3 text-base">
              {t("dashboard.deleteOfficeConfirm").replace("{name}", selectedOffice?.name || "")}
              <br />
              <br />
              <span className="text-muted-foreground">
                {t("dashboard.deleteOfficeWarning")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isSubmitting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isSubmitting ? t("dashboard.deleting") : t("dashboard.yesDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOffice && (
                <>
                  {selectedOffice.status
                    ? t("dashboard.deactivateOfficeConfirm").replace("{name}", selectedOffice.name)
                    : t("dashboard.activateOfficeConfirm").replace("{name}", selectedOffice.name)}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              onClick={() => setSelectedOffice(null)}
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatusConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? selectedOffice?.status
                  ? t("dashboard.deactivating")
                  : t("dashboard.activating")
                : selectedOffice?.status
                ? t("dashboard.deactivate")
                : t("dashboard.activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
