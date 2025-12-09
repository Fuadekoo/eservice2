"use client";

import { useEffect, useState } from "react";
import { Request, RequestStatus } from "./_types";
import { RequestCard } from "./_components/request-card";
import { RequestDetail } from "./_components/request-detail";
import { RequestForm } from "./_components/request-form";
import { MultiStepRequestForm } from "./_components/multi-step-request-form";
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
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { useCustomerRequestStore } from "./_store";
import { CustomerRequestFormValues } from "./_schema";
import { toast } from "sonner";
import { calculateOverallStatus } from "@/lib/request-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useTranslation from "@/hooks/useTranslation";

export default function CustomerRequestPage() {
  const { t } = useTranslation();
  const {
    requests,
    services,
    offices,
    isLoading,
    isSubmitting,
    isDeleteDialogOpen,
    isDetailOpen,
    isFormOpen,
    selectedRequest,
    currentUserId,
    fetchServices,
    fetchOffices,
    fetchMyRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    uploadFile,
    setCurrentUserId,
    setDeleteDialogOpen,
    setDetailOpen,
    setFormOpen,
    setSelectedRequest,
  } = useCustomerRequestStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Get current user ID from session
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/user/me", { cache: "no-store" });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.id) {
            setCurrentUserId(result.data.id);
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, [setCurrentUserId]);

  // Fetch offices on mount
  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  // Fetch requests when userId is available
  useEffect(() => {
    if (currentUserId) {
      fetchMyRequests(currentUserId);
    }
  }, [currentUserId, fetchMyRequests]);

  // Filter requests by status (client-side filtering)
  // Note: The API already filters by userId, so we do status filtering client-side

  // Handle view details
  const handleViewDetails = async (request: Request) => {
    setSelectedRequest(request);
    setDetailOpen(true);
    // Refresh the request to get latest data
    await useCustomerRequestStore.getState().fetchRequestById(request.id);
  };

  // Handle edit
  const handleEdit = (request: Request) => {
    const overallStatus = calculateOverallStatus(
      request.statusbystaff,
      request.statusbyadmin
    );
    if (overallStatus !== RequestStatus.PENDING) {
      toast.error(t("dashboard.canOnlyEditPendingRequests"));
      return;
    }
    setSelectedRequest(request);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedRequest?.id) return;
    const overallStatus = calculateOverallStatus(
      selectedRequest.statusbystaff,
      selectedRequest.statusbyadmin
    );
    if (overallStatus !== RequestStatus.PENDING) {
      toast.error("You can only delete pending requests");
      return;
    }
    try {
      await deleteRequest(selectedRequest.id);
      toast.success(t("dashboard.requestDeletedSuccessfully"));
    } catch (error: any) {
      toast.error(error.message || t("dashboard.failedToDeleteRequest"));
    }
  };

  // Handle delete click
  const handleDeleteClick = (request: Request) => {
    const overallStatus = calculateOverallStatus(
      request.statusbystaff,
      request.statusbyadmin
    );
    if (overallStatus !== RequestStatus.PENDING) {
      toast.error("You can only delete pending requests");
      return;
    }
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  // Handle multi-step form submit (for new requests)
  const handleMultiStepSubmit = async (
    data: CustomerRequestFormValues & { files: File[] }
  ) => {
    if (!currentUserId) {
      toast.error(t("dashboard.pleaseLoginToCreateRequest"));
      return;
    }

    try {
      // Create the request first
      const requestId = await createRequest(currentUserId, {
        serviceId: data.serviceId,
        currentAddress: data.currentAddress,
        date: data.date,
      });

      // Upload files if any
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          await uploadFile(requestId, file);
        }
      }

      toast.success(t("dashboard.requestCreatedSuccessfully"));
      setFormOpen(false);
      setSelectedOffice(null);
      setSelectedService(null);
      if (currentUserId) {
        await fetchMyRequests(currentUserId);
      }
    } catch (error: any) {
      toast.error(error.message || t("dashboard.failedToSaveRequest"));
    }
  };

  // Handle form submit (for editing)
  const handleFormSubmit = async (data: CustomerRequestFormValues) => {
    if (!currentUserId) {
      toast.error(t("dashboard.pleaseLoginToCreateRequest"));
      return;
    }

    try {
      if (selectedRequest) {
        // Update existing request
        const overallStatus = calculateOverallStatus(
          selectedRequest.statusbystaff,
          selectedRequest.statusbyadmin
        );
        if (overallStatus !== RequestStatus.PENDING) {
          toast.error(t("dashboard.canOnlyEditPendingRequests"));
          return;
        }
        await updateRequest(selectedRequest.id, data);
        toast.success(t("dashboard.requestUpdatedSuccessfully"));
      }
    } catch (error: any) {
      toast.error(error.message || t("dashboard.failedToSaveRequest"));
    }
  };

  // Filter requests by status
  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter(
          (req) =>
            calculateOverallStatus(req.statusbystaff, req.statusbyadmin) ===
            statusFilter
        );

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 h-dvh overflow-y-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("dashboard.myRequests")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t("dashboard.createAndManageRequests")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("dashboard.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allRequests")}</SelectItem>
              <SelectItem value={RequestStatus.PENDING}>
                {t("dashboard.pending")}
              </SelectItem>
              <SelectItem value={RequestStatus.APPROVED}>
                {t("dashboard.approved")}
              </SelectItem>
              <SelectItem value={RequestStatus.REJECTED}>
                {t("dashboard.rejected")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentUserId) {
                fetchMyRequests(currentUserId);
              }
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            {t("dashboard.loadingRequests")}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">
            {t("dashboard.noRequestsFound")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {statusFilter !== "all"
              ? t("dashboard.noRequestsForStatus").replace(
                  "{status}",
                  statusFilter
                )
              : t("dashboard.noRequestsCreatedYet")}
          </p>
        </div>
      )}

      {/* Requests Grid */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Multi-Step Request Form (for new requests) */}
      {!selectedRequest && (
        <MultiStepRequestForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) {
              setSelectedOffice(null);
              setSelectedService(null);
            }
          }}
          onSubmit={handleMultiStepSubmit}
          offices={offices}
          services={services}
          selectedOffice={selectedOffice}
          selectedService={selectedService}
          onOfficeChange={setSelectedOffice}
          onServiceChange={setSelectedService}
          fetchServices={fetchServices}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Request Form Dialog (for editing) */}
      {selectedRequest && (
        <RequestForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) {
              setSelectedRequest(null);
            }
          }}
          onSubmit={handleFormSubmit}
          services={services}
          selectedRequest={selectedRequest}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Request Detail Dialog */}
      <RequestDetail
        request={selectedRequest}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedRequest(null);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deleteRequest")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.deleteRequestConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("dashboard.deleting")}
                </>
              ) : (
                t("common.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
