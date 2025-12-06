import { create } from "zustand";
import { toast } from "sonner";
import { Staff } from "../_types";
import {
  StaffFormValues,
  StaffCreateValues,
  StaffUpdateValues,
} from "../_schema";

interface StaffStore {
  // State
  staff: Staff[];
  isLoading: boolean;
  isSubmitting: boolean;
  isDeleteDialogOpen: boolean;
  selectedStaff: Staff | null;

  // Pagination state
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  searchTerm: string;

  // Actions - Fetch
  fetchStaff: (
    page?: number,
    pageSize?: number,
    search?: string
  ) => Promise<void>;
  refreshStaff: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchTerm: (search: string) => void;

  // Actions - CRUD
  createStaff: (data: StaffCreateValues) => Promise<boolean>;
  updateStaff: (id: string, data: StaffUpdateValues) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;

  // Actions - UI State
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedStaff: (staff: Staff | null) => void;

  // Helpers
  getStaffById: (id: string) => Staff | undefined;
  updateStaffInList: (updatedStaff: Staff) => void;
  removeStaffFromList: (id: string) => void;
}

export const useStaffStore = create<StaffStore>((set, get) => ({
  // Initial state
  staff: [],
  isLoading: false,
  isSubmitting: false,
  isDeleteDialogOpen: false,
  selectedStaff: null,

  // Pagination state
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  searchTerm: "",

  // Fetch staff from API with pagination and search
  fetchStaff: async (page?: number, pageSize?: number, search?: string) => {
    try {
      set({ isLoading: true });
      const currentPage = page ?? get().currentPage;
      const currentPageSize = pageSize ?? get().pageSize;
      const searchTerm = search ?? (get().searchTerm || "");

      console.log("🔄 Fetching staff...", {
        currentPage,
        currentPageSize,
        searchTerm,
      });

      // Build query string
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      params.append("page", currentPage.toString());
      params.append("pageSize", currentPageSize.toString());

      const response = await fetch(`/api/staff?${params.toString()}`, {
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
        const staffData = Array.isArray(result.data) ? result.data : [];
        const totalItems = result.total ?? staffData.length;
        const totalPages = Math.ceil(totalItems / currentPageSize);

        console.log(
          `✅ Loaded ${staffData.length} staff (page ${currentPage} of ${totalPages})`
        );

        const staffWithDates = staffData.map((staff: any) => ({
          ...staff,
          createdAt: staff.createdAt ? new Date(staff.createdAt) : new Date(),
          updatedAt: staff.updatedAt ? new Date(staff.updatedAt) : new Date(),
        }));

        set({
          staff: staffWithDates,
          currentPage,
          pageSize: currentPageSize,
          totalItems,
          totalPages,
        });

        if (staffWithDates.length === 0) {
          console.log("ℹ️ No staff found in database");
        }
      } else {
        console.error("❌ API returned error:", result.error);
        toast.error(result.error || "Failed to fetch staff");
        set({ staff: [], totalItems: 0, totalPages: 0 });
      }
    } catch (error: any) {
      console.error("❌ Error fetching staff:", error);
      toast.error(
        error.message ||
          "Failed to fetch staff. Please check your connection and try again."
      );
      set({ staff: [], totalItems: 0, totalPages: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh staff (alias for fetchStaff)
  refreshStaff: async () => {
    const { currentPage, pageSize, searchTerm } = get();
    await get().fetchStaff(currentPage, pageSize, searchTerm);
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

  // Create a new staff member
  createStaff: async (data: StaffCreateValues) => {
    try {
      set({ isSubmitting: true });
      console.log("📤 Creating staff:", data);

      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP error! status: ${response.status}`;
        // Show toast notification immediately with the error message
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("📦 Create result:", result);

      if (result.success) {
        toast.success("Staff created successfully");
        const state = get();
        await get().fetchStaff(
          state.currentPage,
          state.pageSize,
          state.searchTerm
        );
        return true;
      } else {
        toast.error(result.error || "Failed to create staff");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error creating staff:", error);
      // Only show toast if it wasn't already shown above
      if (!error.message || !error.message.includes("HTTP error")) {
        toast.error(error.message || "Failed to create staff. Please try again.");
      }
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Update an existing staff member
  updateStaff: async (id: string, data: StaffUpdateValues) => {
    try {
      set({ isSubmitting: true });
      console.log(`📤 Updating staff ${id}:`, data);

      const response = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP error! status: ${response.status}`;
        // Show toast notification immediately with the error message
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("📦 Update result:", result);

      if (result.success) {
        toast.success("Staff updated successfully");
        const state = get();
        await get().fetchStaff(
          state.currentPage,
          state.pageSize,
          state.searchTerm
        );
        return true;
      } else {
        toast.error(result.error || "Failed to update staff");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error updating staff:", error);
      // Only show toast if it wasn't already shown above
      if (!error.message || !error.message.includes("HTTP error")) {
        toast.error(error.message || "Failed to update staff. Please try again.");
      }
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete a staff member
  deleteStaff: async (id: string) => {
    try {
      set({ isSubmitting: true });
      console.log("🗑️ Deleting staff:", id);

      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP error! status: ${response.status}`;
        // Show toast notification immediately with the error message
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("📦 Delete result:", result);

      if (result.success) {
        toast.success("Staff deleted successfully");
        const state = get();
        await get().fetchStaff(
          state.currentPage,
          state.pageSize,
          state.searchTerm
        );
        set({ isDeleteDialogOpen: false, selectedStaff: null });
        return true;
      } else {
        toast.error(result.error || "Failed to delete staff");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error deleting staff:", error);
      // Only show toast if it wasn't already shown above
      if (!error.message || !error.message.includes("HTTP error")) {
        toast.error(error.message || "Failed to delete staff. Please try again.");
      }
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // UI State Actions
  setDeleteDialogOpen: (open: boolean) => set({ isDeleteDialogOpen: open }),
  setSelectedStaff: (staff: Staff | null) => set({ selectedStaff: staff }),

  // Helper functions
  getStaffById: (id: string) => {
    return get().staff.find((staff) => staff.id === id);
  },

  updateStaffInList: (updatedStaff: Staff) => {
    set((state) => ({
      staff: state.staff.map((staff) =>
        staff.id === updatedStaff.id ? updatedStaff : staff
      ),
    }));
  },

  removeStaffFromList: (id: string) => {
    set((state) => ({
      staff: state.staff.filter((staff) => staff.id !== id),
    }));
  },
}));
