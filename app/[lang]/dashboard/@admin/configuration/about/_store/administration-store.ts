import { create } from "zustand";
import { toast } from "sonner";
import { Administration } from "../_types";
import { AdministrationFormValues } from "../_schema";

interface AdministrationStore {
  // State
  administrators: Administration[];
  isLoading: boolean;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedAdministration: Administration | null;

  // Actions - Fetch
  fetchAdministrators: () => Promise<void>;
  refreshAdministrators: () => Promise<void>;

  // Actions - CRUD
  createAdministration: (data: AdministrationFormValues) => Promise<boolean>;
  updateAdministration: (
    id: string,
    data: AdministrationFormValues
  ) => Promise<boolean>;
  deleteAdministration: (id: string) => Promise<boolean>;

  // Actions - UI State
  setFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedAdministration: (administration: Administration | null) => void;

  // Helpers
  getAdministrationById: (id: string) => Administration | undefined;
  updateAdministrationInList: (updated: Administration) => void;
  removeAdministrationFromList: (id: string) => void;
}

export const useAdministrationStore = create<AdministrationStore>(
  (set, get) => ({
    // Initial state
    administrators: [],
    isLoading: false,
    isSubmitting: false,
    isFormOpen: false,
    isDeleteDialogOpen: false,
    selectedAdministration: null,

    // Fetch administrators from API
    fetchAdministrators: async () => {
      try {
        set({ isLoading: true });
        console.log("🔄 Fetching administrators...");

        const response = await fetch("/api/administration", {
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
          const administratorsData = Array.isArray(result.data)
            ? result.data
            : [];
          console.log(`✅ Loaded ${administratorsData.length} administrators`);

          const administratorsWithDates = administratorsData.map(
            (admin: any) => ({
              ...admin,
              createdAt: admin.createdAt
                ? new Date(admin.createdAt)
                : new Date(),
              updatedAt: admin.updatedAt
                ? new Date(admin.updatedAt)
                : new Date(),
            })
          );

          set({ administrators: administratorsWithDates });

          if (administratorsWithDates.length === 0) {
            console.log("ℹ️ No administrators found in database");
          }
        } else {
          console.error("❌ API returned error:", result.error);
          toast.error(result.error || "Failed to fetch administrators");
          set({ administrators: [] });
        }
      } catch (error: any) {
        console.error("❌ Error fetching administrators:", error);
        toast.error(error.message || "Failed to fetch administrators");
        set({ administrators: [] });
      } finally {
        set({ isLoading: false });
      }
    },

    // Refresh administrators
    refreshAdministrators: async () => {
      await get().fetchAdministrators();
    },

    // Create administration
    createAdministration: async (data: AdministrationFormValues) => {
      try {
        set({ isSubmitting: true });
        console.log("🔄 Creating administrator...", data);

        const response = await fetch("/api/administration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create administrator");
        }

        console.log("✅ Administrator created:", result.data);
        toast.success("Administrator created successfully");

        // Add to list
        const newAdministration: Administration = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };

        set((state) => ({
          administrators: [newAdministration, ...state.administrators],
        }));

        return true;
      } catch (error: any) {
        console.error("❌ Error creating administrator:", error);
        toast.error(error.message || "Failed to create administrator");
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // Update administration
    updateAdministration: async (id: string, data: AdministrationFormValues) => {
      try {
        set({ isSubmitting: true });
        console.log("🔄 Updating administrator...", { id, data });

        const response = await fetch(`/api/administration/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update administrator");
        }

        console.log("✅ Administrator updated:", result.data);
        toast.success("Administrator updated successfully");

        // Update in list
        get().updateAdministrationInList({
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        });

        return true;
      } catch (error: any) {
        console.error("❌ Error updating administrator:", error);
        toast.error(error.message || "Failed to update administrator");
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // Delete administration
    deleteAdministration: async (id: string) => {
      try {
        set({ isSubmitting: true });
        console.log("🔄 Deleting administrator...", id);

        const response = await fetch(`/api/administration/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to delete administrator");
        }

        console.log("✅ Administrator deleted:", id);
        toast.success("Administrator deleted successfully");

        // Remove from list
        get().removeAdministrationFromList(id);

        return true;
      } catch (error: any) {
        console.error("❌ Error deleting administrator:", error);
        toast.error(error.message || "Failed to delete administrator");
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // UI State actions
    setFormOpen: (open: boolean) => {
      set({ isFormOpen: open });
      if (!open) {
        set({ selectedAdministration: null });
      }
    },

    setDeleteDialogOpen: (open: boolean) => {
      set({ isDeleteDialogOpen: open });
    },

    setSelectedAdministration: (administration: Administration | null) => {
      set({ selectedAdministration: administration });
    },

    // Helpers
    getAdministrationById: (id: string) => {
      return get().administrators.find((a) => a.id === id);
    },

    updateAdministrationInList: (updated: Administration) => {
      set((state) => ({
        administrators: state.administrators.map((a) =>
          a.id === updated.id ? updated : a
        ),
      }));
    },

    removeAdministrationFromList: (id: string) => {
      set((state) => ({
        administrators: state.administrators.filter((a) => a.id !== id),
      }));
    },
  })
);

