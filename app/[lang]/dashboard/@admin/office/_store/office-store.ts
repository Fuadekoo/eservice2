import { create } from "zustand";
import { toast } from "sonner";
import { Office } from "../_types";
import { OfficeFormValues } from "../_schema";

interface OfficeStore {
  // State
  offices: Office[];
  loading: boolean;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isDeleteDialogOpen: boolean;
  isStatusDialogOpen: boolean;
  selectedOffice: Office | null;

  // Pagination state
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  search: string;

  // Actions - Fetch
  fetchOffices: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (query: string) => void;

  // Actions - CRUD
  createOffice: (data: OfficeFormValues) => Promise<boolean>;
  updateOffice: (id: string, data: OfficeFormValues) => Promise<boolean>;
  deleteOffice: (id: string) => Promise<boolean>;
  toggleOfficeStatus: (id: string, newStatus: boolean) => Promise<boolean>;

  // Actions - UI State
  setFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setStatusDialogOpen: (open: boolean) => void;
  setSelectedOffice: (office: Office | null) => void;

  // Helpers
  getOfficeById: (id: string) => Office | undefined;
  updateOfficeInList: (updatedOffice: Office) => void;
  removeOfficeFromList: (id: string) => void;
}

export const useOfficeStore = create<OfficeStore>((set, get) => ({
  // Initial state
  offices: [],
  loading: false,
  isSubmitting: false,
  isFormOpen: false,
  isDeleteDialogOpen: false,
  isStatusDialogOpen: false,
  selectedOffice: null,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  total: 0,
  search: "",

  // Fetch offices from API with pagination
  fetchOffices: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    try {
      set({ loading: true });

      const currentState = get();
      const pageToFetch = params?.page ?? currentState.page;
      const limitToFetch = params?.pageSize ?? currentState.pageSize;
      const searchToFetch =
        params?.search !== undefined ? params.search : currentState.search;

      console.log("🔄 Fetching offices...", {
        page: pageToFetch,
        limit: limitToFetch,
        search: searchToFetch || "none",
      });

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: String(pageToFetch),
        limit: String(limitToFetch),
        includeStats: "true", // Include stats for the office list
      });

      if (searchToFetch && searchToFetch.trim()) {
        queryParams.append("search", searchToFetch.trim());
      }

      const response = await fetch(`/api/office?${queryParams.toString()}`, {
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
        const officesData = Array.isArray(result.data) ? result.data : [];
        // Prefer `pagination` per API, but support legacy `meta`
        const meta = result.pagination || result.meta || {};

        console.log(
          `✅ Loaded ${officesData.length} offices (page ${meta.page}/${
            meta.totalPages || 1
          })`
        );

        // Convert date strings back to Date objects and ensure all fields are present
        const officesWithDates = officesData.map((office: any) => {
          if (!office.id) {
            console.error("⚠️ Office missing ID:", office);
          }
          return {
            id: office.id,
            name: office.name,
            phoneNumber: office.phoneNumber,
            roomNumber: office.roomNumber,
            address: office.address,
            subdomain: office.subdomain,
            logo: office.logo,
            slogan: office.slogan,
            status: Boolean(office.status),
            startedAt: office.startedAt
              ? new Date(office.startedAt)
              : new Date(),
            createdAt: office.createdAt
              ? new Date(office.createdAt)
              : new Date(),
            updatedAt: office.updatedAt
              ? new Date(office.updatedAt)
              : new Date(),
            // Include statistics
            totalRequests: office.totalRequests ?? 0,
            totalAppointments: office.totalAppointments ?? 0,
            totalUsers: office.totalUsers ?? 0,
            totalServices: office.totalServices ?? 0,
          };
        });

        // Derive robust pagination meta when API does not provide totalPages
        const effectiveLimit = meta.limit || limitToFetch || 1;
        const effectiveTotal = meta.total ?? 0;
        const computedTotalPages = Math.max(
          1,
          Math.ceil(effectiveTotal / effectiveLimit)
        );
        const effectiveTotalPages =
          meta.totalPages && meta.totalPages > 0
            ? meta.totalPages
            : computedTotalPages;

        set({
          offices: officesWithDates,
          page: meta.page || pageToFetch,
          pageSize: effectiveLimit,
          totalPages: effectiveTotalPages,
          total: effectiveTotal,
          search: searchToFetch,
        });

        if (officesWithDates.length === 0) {
          console.log("ℹ️ No offices found");
        }
      } else {
        console.error("❌ API returned error:", result.error);
        toast.error(result.error || "Failed to fetch offices");
        set({ offices: [] });
      }
    } catch (error: any) {
      console.error("❌ Error fetching offices:", error);
      toast.error(
        error.message ||
          "Failed to fetch offices. Please check your connection and try again."
      );
      set({ offices: [] });
    } finally {
      set({ loading: false });
    }
  },

  // Set page
  setPage: (page: number) => {
    set({ page });
    const state = get();
    get().fetchOffices({
      page,
      pageSize: state.pageSize,
      search: state.search,
    });
  },

  // Set page size
  setPageSize: (size: number) => {
    set({ pageSize: size, page: 1 }); // Reset to page 1 when changing page size
    const state = get();
    get().fetchOffices({ page: 1, pageSize: size, search: state.search });
  },

  // Set search
  setSearch: (query: string) => {
    set({ search: query, page: 1 }); // Reset to page 1 when searching
  },

  // Create a new office
  createOffice: async (data: OfficeFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log("📤 Creating office:", data);

      // Prepare data for submission
      const submitData = {
        ...data,
        startedAt:
          data.startedAt instanceof Date
            ? data.startedAt.toISOString()
            : data.startedAt,
      };

      const response = await fetch("/api/office", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
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
        toast.success("Office created successfully");
        const state = get();
        await get().fetchOffices({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        });
        set({ isFormOpen: false, selectedOffice: null });
        return true;
      } else {
        toast.error(result.error || "Failed to create office");
        if (result.details) {
          console.error("Validation errors:", result.details);
        }
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error creating office:", error);
      toast.error(
        error.message || "Failed to create office. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Update an existing office
  updateOffice: async (id: string, data: OfficeFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log(`📤 Updating office ${id}:`, data);

      // Prepare data for submission
      const submitData = {
        ...data,
        startedAt:
          data.startedAt instanceof Date
            ? data.startedAt.toISOString()
            : data.startedAt,
      };

      const response = await fetch(`/api/office/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
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
        toast.success("Office updated successfully");
        const state = get();
        await get().fetchOffices({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        });
        set({ isFormOpen: false, selectedOffice: null });
        return true;
      } else {
        toast.error(result.error || "Failed to update office");
        if (result.details) {
          console.error("Validation errors:", result.details);
        }
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error updating office:", error);
      toast.error(
        error.message || "Failed to update office. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete an office
  deleteOffice: async (id: string) => {
    try {
      set({ isSubmitting: true });
      console.log("🗑️ Deleting office:", id);

      const response = await fetch(`/api/office/${id}`, {
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
        toast.success("Office deleted successfully");
        const state = get();
        await get().fetchOffices({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        });
        set({ isDeleteDialogOpen: false, selectedOffice: null });
        return true;
      } else {
        toast.error(result.error || "Failed to delete office");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error deleting office:", error);
      toast.error(
        error.message || "Failed to delete office. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Toggle office status
  toggleOfficeStatus: async (id: string, newStatus: boolean) => {
    try {
      set({ isSubmitting: true });
      console.log(`🔄 Toggling status for office ${id} to ${newStatus}`);

      const response = await fetch(`/api/office/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Toggle status result:", result);

      if (result.success) {
        toast.success(
          `Office ${newStatus ? "activated" : "deactivated"} successfully`
        );
        const state = get();
        await get().fetchOffices({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        });
        set({ isStatusDialogOpen: false, selectedOffice: null });
        return true;
      } else {
        toast.error(result.error || "Failed to update office status");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error toggling office status:", error);
      toast.error(
        error.message || "Failed to update office status. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // UI State Actions
  setFormOpen: (open: boolean) => set({ isFormOpen: open }),
  setDeleteDialogOpen: (open: boolean) => set({ isDeleteDialogOpen: open }),
  setStatusDialogOpen: (open: boolean) => set({ isStatusDialogOpen: open }),
  setSelectedOffice: (office: Office | null) => set({ selectedOffice: office }),

  // Helper functions
  getOfficeById: (id: string) => {
    return get().offices.find((office) => office.id === id);
  },

  updateOfficeInList: (updatedOffice: Office) => {
    set((state) => ({
      offices: state.offices.map((office) =>
        office.id === updatedOffice.id ? updatedOffice : office
      ),
    }));
  },

  removeOfficeFromList: (id: string) => {
    set((state) => ({
      offices: state.offices.filter((office) => office.id !== id),
    }));
  },
}));
