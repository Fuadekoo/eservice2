"use client";

import { useEffect, useState } from "react";
import { Request, RequestStatus } from "./_types";
import { RequestCard } from "./_components/request-card";
import { RequestDetail } from "./_components/request-detail";
import { RequestForm } from "./_components/request-form";
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
import { FileText, Loader2, RefreshCw, Plus } from "lucide-react";
import { useCustomerRequestStore } from "./_store";
import { CustomerRequestFormValues } from "./_schema";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerRequestPage() {
  const {
    requests,
    services,
    isLoading,
    isSubmitting,
    isDeleteDialogOpen,
    isDetailOpen,
    isFormOpen,
    selectedRequest,
    currentUserId,
    fetchServices,
    fetchMyRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    setCurrentUserId,
    setDeleteDialogOpen,
    setDetailOpen,
    setFormOpen,
    setSelectedRequest,
  } = useCustomerRequestStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get current user ID (mock - replace with actual auth)
  useEffect(() => {
    // TODO: Replace with actual authentication
    // For now, get from localStorage or session
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.id) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }
  }, [setCurrentUserId]);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

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
    if (request.status !== RequestStatus.PENDING) {
      toast.error("You can only edit pending requests");
      return;
    }
    setSelectedRequest(request);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedRequest?.id) return;
    if (selectedRequest.status !== RequestStatus.PENDING) {
      toast.error("You can only delete pending requests");
      return;
    }
    try {
      await deleteRequest(selectedRequest.id);
      toast.success("Request deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete request");
    }
  };

  // Handle delete click
  const handleDeleteClick = (request: Request) => {
    if (request.status !== RequestStatus.PENDING) {
      toast.error("You can only delete pending requests");
      return;
    }
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
  };

  // Handle create new
  const handleCreateNew = () => {
    if (!currentUserId) {
      toast.error("Please log in to create a request");
      return;
    }
    setSelectedRequest(null);
    setFormOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = async (data: CustomerRequestFormValues) => {
    if (!currentUserId) {
      toast.error("Please log in to create a request");
      return;
    }

    try {
      if (selectedRequest) {
        // Update existing request
        if (selectedRequest.status !== RequestStatus.PENDING) {
          toast.error("You can only edit pending requests");
          return;
        }
        await updateRequest(selectedRequest.id, data);
        toast.success("Request updated successfully");
      } else {
        // Create new request
        await createRequest(currentUserId, data);
        toast.success("Request created successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save request");
    }
  };

  // Filter requests by status
  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((req) => req.status === statusFilter);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your service requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value={RequestStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={RequestStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={RequestStatus.REJECTED}>Rejected</SelectItem>
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
            Refresh
          </Button>
          <Button onClick={handleCreateNew} disabled={!currentUserId}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">No requests found</h3>
          <p className="text-muted-foreground mb-6">
            {statusFilter !== "all"
              ? `No ${statusFilter} requests available.`
              : "You haven't created any requests yet."}
          </p>
          <Button onClick={handleCreateNew} disabled={!currentUserId}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Request
          </Button>
        </div>
      )}

      {/* Requests Grid */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Request Form Dialog */}
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
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot
              be undone. You can only delete pending requests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
