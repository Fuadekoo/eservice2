"use client";

import { useEffect, useState } from "react";
import { Service } from "./_types";
import { ServiceAssignmentDialog } from "./_components/service-assignment-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Loader2, RefreshCw, Search, X } from "lucide-react";
import { ServiceCard } from "./_components/service-card";
import { useServiceStore } from "./_store/service-store";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useRouter, useParams } from "next/navigation";
import useTranslation from "@/hooks/useTranslation";

interface UserInfo {
  id: string;
  role: string;
  officeId: string | null;
}

export default function ServicesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userOfficeId, setUserOfficeId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // Get state and actions from Zustand store
  const {
    services,
    isLoading,
    isSubmitting,
    isDeleteDialogOpen,
    isAssignmentDialogOpen,
    selectedService,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchTerm,
    fetchServices,
    refreshServices,
    deleteService,
    setDeleteDialogOpen,
    setAssignmentDialogOpen,
    setSelectedService,
    setPage,
    setPageSize,
    setSearchTerm,
  } = useServiceStore();

  // Fetch services on mount (API will automatically filter by user's office)
  useEffect(() => {
    // Fetch services without officeId - API will use authenticated user's office
    fetchServices(undefined, 1, pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract officeId from services once loaded
  useEffect(() => {
    if (services.length > 0 && !userOfficeId) {
      const firstService = services[0];
      if (firstService?.officeId) {
        setUserOfficeId(firstService.officeId);
      }
    }
  }, [services, userOfficeId]);

  // Debounce search input
  useEffect(() => {
    if (!userOfficeId) return; // Wait for officeId to be set

    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        fetchServices(userOfficeId, 1, pageSize, searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, userOfficeId, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle edit - redirect to edit page
  const handleEdit = (service: Service) => {
    router.push(`/${lang}/dashboard/services/${service.id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedService?.id) return;
    await deleteService(selectedService.id);
    // Refresh services after delete
    if (userOfficeId) {
      fetchServices(userOfficeId, currentPage, pageSize, searchTerm);
    }
  };

  // Handle create new - redirect to add page
  const handleCreateNew = () => {
    router.push(`/${lang}/dashboard/services/add`);
  };

  // Handle delete click
  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  // Handle assign staff
  const handleAssignStaff = (service: Service) => {
    setSelectedService(service);
    setAssignmentDialogOpen(true);
  };

  // Handle assignment success - refresh services
  const handleAssignmentSuccess = () => {
    if (userOfficeId) {
      fetchServices(userOfficeId, currentPage, pageSize, searchTerm);
    }
  };

  // Handle view details
  const handleViewDetails = (service: Service) => {
    router.push(`/${lang}/dashboard/services/${service.id}`);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }

      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      if (start > 2) {
        items.push("ellipsis-start");
      }

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (end < totalPages - 1) {
        items.push("ellipsis-end");
      }

      if (totalPages > 1) {
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div className="container mx-auto py-6 space-y-6 overflow-y-auto h-dvh">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("navigation.services")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.manageServicesAndAssignStaff")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("dashboard.searchByNameDescription")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (userOfficeId) {
                fetchServices(userOfficeId, currentPage, pageSize, searchTerm);
              }
            }}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            {t("dashboard.addService")}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("dashboard.show")}:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              if (userOfficeId) {
                fetchServices(userOfficeId, 1, parseInt(value), searchTerm);
              }
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            {t("dashboard.loadingServices")}
          </p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-lg border border-dashed">
          <FileText className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">
            {t("dashboard.noServicesFound")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchTerm
              ? t("dashboard.noServicesMatchSearch")
              : t("dashboard.getStartedCreateService")}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              {t("dashboard.addYourFirstService")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onAssignStaff={handleAssignStaff}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t("dashboard.showing")} {(currentPage - 1) * pageSize + 1}{" "}
                {t("dashboard.to")}{" "}
                {Math.min(currentPage * pageSize, totalItems)}{" "}
                {t("dashboard.of")} {totalItems} {t("dashboard.services")}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setPage(newPage);
                        if (userOfficeId) {
                          fetchServices(
                            userOfficeId,
                            newPage,
                            pageSize,
                            searchTerm
                          );
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {getPaginationItems().map((item, index) => {
                    if (item === "ellipsis-start" || item === "ellipsis-end") {
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
                          onClick={() => {
                            setPage(pageNum);
                            if (userOfficeId) {
                              fetchServices(
                                userOfficeId,
                                pageNum,
                                pageSize,
                                searchTerm
                              );
                            }
                          }}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setPage(newPage);
                        if (userOfficeId) {
                          fetchServices(
                            userOfficeId,
                            newPage,
                            pageSize,
                            searchTerm
                          );
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.deleteServiceConfirm").replace(
                "{name}",
                selectedService?.name || ""
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? t("dashboard.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Staff Assignment Dialog */}
      <ServiceAssignmentDialog
        service={selectedService}
        open={isAssignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
}
