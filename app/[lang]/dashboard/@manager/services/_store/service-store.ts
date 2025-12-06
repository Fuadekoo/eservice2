import { create } from "zustand";
import { toast } from "sonner";
import { Service } from "../_types";
import { ServiceFormValues } from "../_schema";

interface ServiceStore {
  // State
  services: Service[];
  isLoading: boolean;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isDeleteDialogOpen: boolean;
  isAssignmentDialogOpen: boolean;
  selectedService: Service | null;

  // Pagination state
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  searchTerm: string;

  // Actions - Fetch
  fetchServices: (
    officeId?: string,
    page?: number,
    pageSize?: number,
    search?: string
  ) => Promise<void>;
  refreshServices: (officeId?: string) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchTerm: (search: string) => void;

  // Actions - CRUD
  createService: (data: ServiceFormValues) => Promise<boolean>;
  updateService: (id: string, data: ServiceFormValues) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;

  // Actions - UI State
  setFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setAssignmentDialogOpen: (open: boolean) => void;
  setSelectedService: (service: Service | null) => void;

  // Helpers
  getServiceById: (id: string) => Service | undefined;
  updateServiceInList: (updatedService: Service) => void;
  removeServiceFromList: (id: string) => void;
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  // Initial state
  services: [],
  isLoading: false,
  isSubmitting: false,
  isFormOpen: false,
  isDeleteDialogOpen: false,
  isAssignmentDialogOpen: false,
  selectedService: null,

  // Pagination state
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  searchTerm: "",

  // Fetch services from API with pagination and search
  fetchServices: async (
    officeId?: string,
    page?: number,
    pageSize?: number,
    search?: string
  ) => {
    try {
      set({ isLoading: true });
      const currentPage = page ?? get().currentPage;
      const currentPageSize = pageSize ?? get().pageSize;
      const searchTerm = search ?? (get().searchTerm || "");

      console.log("🔄 Fetching services...", {
        officeId,
        currentPage,
        currentPageSize,
        searchTerm,
      });

      // Build query string
      const params = new URLSearchParams();
      // Note: officeId is optional - API will use authenticated user's office automatically
      if (officeId) params.append("officeId", officeId);
      if (searchTerm && searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      params.append("page", currentPage.toString());
      params.append("pageSize", currentPageSize.toString());

      const response = await fetch(`/api/service?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Fetch result:", result);

      if (result.success) {
        const servicesData = Array.isArray(result.data) ? result.data : [];
        const totalItems = result.total ?? servicesData.length;
        const totalPages = Math.ceil(totalItems / currentPageSize);

        console.log(
          `✅ Loaded ${servicesData.length} services (page ${currentPage} of ${totalPages})`
        );

        const servicesWithDates = servicesData.map((service: any) => ({
          ...service,
          createdAt: service.createdAt
            ? new Date(service.createdAt)
            : new Date(),
          updatedAt: service.updatedAt
            ? new Date(service.updatedAt)
            : new Date(),
          assignedStaff: service.assignedStaff || [],
        }));

        set({
          services: servicesWithDates,
          currentPage,
          pageSize: currentPageSize,
          totalItems,
          totalPages,
        });

        if (servicesWithDates.length === 0) {
          console.log("ℹ️ No services found in database");
        }
      } else {
        console.error("❌ API returned error:", result.error);
        toast.error(result.error || "Failed to fetch services");
        set({ services: [], totalItems: 0, totalPages: 0 });
      }
    } catch (error: any) {
      console.error("❌ Error fetching services:", error);
      toast.error(
        error.message ||
          "Failed to fetch services. Please check your connection and try again."
      );
      set({ services: [], totalItems: 0, totalPages: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh services (alias for fetchServices)
  refreshServices: async (officeId?: string) => {
    const { currentPage, pageSize, searchTerm } = get();
    await get().fetchServices(officeId, currentPage, pageSize, searchTerm);
  },

  // Pagination actions
  setPage: (page: number) => {
    set({ currentPage: page });
  },

  setPageSize: (size: number) => {
    set({ pageSize: size, currentPage: 1 }); // Reset to first page when changing page size
  },

  setSearchTerm: (search: string) => {
    set({ searchTerm: search, currentPage: 1 }); // Reset to first page when searching
  },

  // Create a new service
  createService: async (data: ServiceFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log("📤 Creating service:", data);

      const response = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Create result:", result);

      if (result.success) {
        toast.success("Service created successfully");
        const state = get();
        await get().fetchServices(
          data.officeId,
          state.currentPage,
          state.pageSize,
          state.searchTerm
        );
        set({ isFormOpen: false, selectedService: null });
        return true;
      } else {
        toast.error(result.error || "Failed to create service");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error creating service:", error);
      toast.error(
        error.message || "Failed to create service. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Update an existing service
  updateService: async (id: string, data: ServiceFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log(`📤 Updating service ${id}:`, data);

      const response = await fetch(`/api/service/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Update result:", result);

      if (result.success) {
        toast.success("Service updated successfully");
        const state = get();
        await get().fetchServices(
          data.officeId,
          state.currentPage,
          state.pageSize,
          state.searchTerm
        );
        set({ isFormOpen: false, selectedService: null });
        return true;
      } else {
        toast.error(result.error || "Failed to update service");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error updating service:", error);
      toast.error(
        error.message || "Failed to update service. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete a service
  deleteService: async (id: string) => {
    try {
      set({ isSubmitting: true });
      console.log("🗑️ Deleting service:", id);

      const response = await fetch(`/api/service/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Delete result:", result);

      if (result.success) {
        toast.success("Service deleted successfully");
        const state = get();
        // Note: officeId should be passed from the component, but for now we'll refresh with current state
        // The component will handle the refresh with the correct officeId
        set({ isDeleteDialogOpen: false, selectedService: null });
        return true;
      } else {
        toast.error(result.error || "Failed to delete service");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error deleting service:", error);
      toast.error(
        error.message || "Failed to delete service. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // UI State Actions
  setFormOpen: (open: boolean) => set({ isFormOpen: open }),
  setDeleteDialogOpen: (open: boolean) => set({ isDeleteDialogOpen: open }),
  setAssignmentDialogOpen: (open: boolean) =>
    set({ isAssignmentDialogOpen: open }),
  setSelectedService: (service: Service | null) =>
    set({ selectedService: service }),

  // Helper functions
  getServiceById: (id: string) => {
    return get().services.find((service) => service.id === id);
  },

  updateServiceInList: (updatedService: Service) => {
    set((state) => ({
      services: state.services.map((service) =>
        service.id === updatedService.id ? updatedService : service
      ),
    }));
  },

  removeServiceFromList: (id: string) => {
    set((state) => ({
      services: state.services.filter((service) => service.id !== id),
    }));
  },
}));
