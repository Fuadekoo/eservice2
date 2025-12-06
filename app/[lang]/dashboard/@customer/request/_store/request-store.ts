import { create } from "zustand";
import { Request, RequestStatus, Service, Office } from "../_types";

interface CustomerRequestStore {
  // State
  requests: Request[];
  services: Service[];
  offices: Office[];
  selectedRequest: Request | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isDetailOpen: boolean;
  isDeleteDialogOpen: boolean;
  currentUserId: string | null;

  // Actions
  fetchOffices: () => Promise<void>;
  fetchServices: (officeId?: string) => Promise<void>;
  fetchMyRequests: (userId: string) => Promise<void>;
  refreshRequests: (userId: string) => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  createRequest: (
    userId: string,
    data: {
      serviceId: string;
      currentAddress: string;
      date: Date;
    }
  ) => Promise<string>; // Returns the created request ID
  updateRequest: (
    id: string,
    data: {
      serviceId?: string;
      currentAddress?: string;
      date?: Date;
    }
  ) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  uploadFile: (
    requestId: string,
    file: File,
    description?: string
  ) => Promise<void>;
  setCurrentUserId: (userId: string | null) => void;
  setFormOpen: (open: boolean) => void;
  setDetailOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedRequest: (request: Request | null) => void;
}

export const useCustomerRequestStore = create<CustomerRequestStore>(
  (set, get) => ({
    // Initial state
    requests: [],
    services: [],
    offices: [],
    selectedRequest: null,
    isLoading: false,
    isSubmitting: false,
    isFormOpen: false,
    isDetailOpen: false,
    isDeleteDialogOpen: false,
    currentUserId: null,

    // Fetch offices
    fetchOffices: async () => {
      try {
        const response = await fetch("/api/office?limit=100", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch offices");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch offices");
        }

        set({ offices: result.data.offices || result.data || [] });
      } catch (error: any) {
        console.error("Error fetching offices:", error);
        throw error;
      }
    },

    // Fetch services (optionally filtered by officeId)
    fetchServices: async (officeId?: string) => {
      try {
        const url = officeId 
          ? `/api/service?officeId=${officeId}` 
          : "/api/service";
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch services");
        }

        set({ services: result.data.services || result.data || [] });
      } catch (error: any) {
        console.error("Error fetching services:", error);
        throw error;
      }
    },

    // Fetch my requests (customer's own requests)
    fetchMyRequests: async (userId: string) => {
      try {
        set({ isLoading: true });
        const response = await fetch(`/api/request?userId=${userId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch requests");
        }

        // Convert date strings to Date objects
        const requests: Request[] = result.data.map((req: any) => ({
          ...req,
          date: new Date(req.date),
          createdAt: new Date(req.createdAt),
          updatedAt: new Date(req.updatedAt),
          user: req.user
            ? {
                id: req.user.id,
                name: req.user.username || req.user.name || "",
                phoneNumber: req.user.phoneNumber || "",
                email: req.user.email || null,
              }
            : {
                id: req.userId,
                name: "",
                phoneNumber: "",
              },
          appointments: (req.appointments || []).map((apt: any) => ({
            ...apt,
            date: new Date(apt.date),
            createdAt: new Date(apt.createdAt),
            updatedAt: new Date(apt.updatedAt),
          })),
          fileData: (req.fileData || []).map((file: any) => ({
            ...file,
            createdAt: new Date(file.createdAt),
            updatedAt: new Date(file.updatedAt),
          })),
        }));

        set({ requests, isLoading: false });
      } catch (error: any) {
        console.error("Error fetching requests:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    // Refresh requests
    refreshRequests: async (userId: string) => {
      await get().fetchMyRequests(userId);
    },

    // Fetch single request by ID
    fetchRequestById: async (id: string) => {
      try {
        set({ isLoading: true });
        const response = await fetch(`/api/request/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch request");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch request");
        }

        // Convert date strings to Date objects
        const request: Request = {
          ...result.data,
          date: new Date(result.data.date),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          user: result.data.user
            ? {
                id: result.data.user.id,
                name: result.data.user.username || result.data.user.name || "",
                phoneNumber: result.data.user.phoneNumber || "",
                email: result.data.user.email || null,
              }
            : {
                id: result.data.userId,
                name: "",
                phoneNumber: "",
              },
          appointments: (result.data.appointments || []).map((apt: any) => ({
            ...apt,
            date: new Date(apt.date),
            createdAt: new Date(apt.createdAt),
            updatedAt: new Date(apt.updatedAt),
          })),
          fileData: (result.data.fileData || []).map((file: any) => ({
            ...file,
            createdAt: new Date(file.createdAt),
            updatedAt: new Date(file.updatedAt),
          })),
        };

        set({ selectedRequest: request, isLoading: false });
      } catch (error: any) {
        console.error("Error fetching request:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    // Create request
    createRequest: async (userId: string, data) => {
      try {
        set({ isSubmitting: true });
        const response = await fetch("/api/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            ...data,
            status: "pending",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create request");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to create request");
        }

        // Convert date strings to Date objects
        const newRequest: Request = {
          ...result.data,
          date: new Date(result.data.date),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          user: result.data.user
            ? {
                id: result.data.user.id,
                name: result.data.user.username || result.data.user.name || "",
                phoneNumber: result.data.user.phoneNumber || "",
                email: result.data.user.email || null,
              }
            : {
                id: result.data.userId,
                name: "",
                phoneNumber: "",
              },
          appointments: (result.data.appointments || []).map((apt: any) => ({
            ...apt,
            date: new Date(apt.date),
            createdAt: new Date(apt.createdAt),
            updatedAt: new Date(apt.updatedAt),
          })),
          fileData: (result.data.fileData || []).map((file: any) => ({
            ...file,
            createdAt: new Date(file.createdAt),
            updatedAt: new Date(file.updatedAt),
          })),
        };

        // Add to requests list
        set((state) => ({
          requests: [newRequest, ...state.requests],
          isSubmitting: false,
          isFormOpen: false,
          selectedRequest: null,
        }));

        // Refresh requests
        await get().refreshRequests(userId);

        // Return the created request ID
        return newRequest.id;
      } catch (error: any) {
        console.error("Error creating request:", error);
        set({ isSubmitting: false });
        throw error;
      }
    },

    // Update request (only allowed for pending requests)
    updateRequest: async (id: string, data) => {
      try {
        set({ isSubmitting: true });
        const response = await fetch(`/api/request/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update request");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to update request");
        }

        // Convert date strings to Date objects
        const updatedRequest: Request = {
          ...result.data,
          date: new Date(result.data.date),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          appointments: result.data.appointments.map((apt: any) => ({
            ...apt,
            date: new Date(apt.date),
            createdAt: new Date(apt.createdAt),
            updatedAt: new Date(apt.updatedAt),
          })),
          fileData: result.data.fileData.map((file: any) => ({
            ...file,
            createdAt: new Date(file.createdAt),
            updatedAt: new Date(file.updatedAt),
          })),
        };

        // Update in requests list
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id ? updatedRequest : req
          ),
          selectedRequest:
            state.selectedRequest?.id === id
              ? updatedRequest
              : state.selectedRequest,
          isSubmitting: false,
          isFormOpen: false,
        }));

        // Refresh requests if userId is available
        const userId = get().currentUserId;
        if (userId) {
          await get().refreshRequests(userId);
        }
      } catch (error: any) {
        console.error("Error updating request:", error);
        set({ isSubmitting: false });
        throw error;
      }
    },

    // Delete request (only allowed for pending requests)
    deleteRequest: async (id: string) => {
      try {
        set({ isSubmitting: true });
        const response = await fetch(`/api/request/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete request");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to delete request");
        }

        // Remove from requests list
        set((state) => ({
          requests: state.requests.filter((req) => req.id !== id),
          selectedRequest: null,
          isSubmitting: false,
          isDeleteDialogOpen: false,
        }));
      } catch (error: any) {
        console.error("Error deleting request:", error);
        set({ isSubmitting: false });
        throw error;
      }
    },

    // Upload file
    uploadFile: async (requestId: string, file: File, description?: string) => {
      try {
        set({ isSubmitting: true });
        const formData = new FormData();
        formData.append("file", file);
        if (description) {
          formData.append("description", description);
        }

        const response = await fetch(`/api/request/${requestId}/files`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to upload file");
        }

        // Refresh the selected request to get updated files
        if (get().selectedRequest?.id === requestId) {
          await get().fetchRequestById(requestId);
        }

        // Refresh requests if userId is available
        const userId = get().currentUserId;
        if (userId) {
          await get().refreshRequests(userId);
        }

        set({ isSubmitting: false });
      } catch (error: any) {
        console.error("Error uploading file:", error);
        set({ isSubmitting: false });
        throw error;
      }
    },

    // UI state setters
    setCurrentUserId: (userId: string | null) => set({ currentUserId: userId }),
    setFormOpen: (open: boolean) => set({ isFormOpen: open }),
    setDetailOpen: (open: boolean) => set({ isDetailOpen: open }),
    setDeleteDialogOpen: (open: boolean) => set({ isDeleteDialogOpen: open }),
    setSelectedRequest: (request: Request | null) =>
      set({ selectedRequest: request }),
  })
);
