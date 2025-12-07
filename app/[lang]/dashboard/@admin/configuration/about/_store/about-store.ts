import { create } from "zustand";
import { toast } from "sonner";
import { About } from "../_types";
import { AboutFormValues } from "../_schema";

interface AboutStore {
  // State
  aboutSections: About[];
  isLoading: boolean;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedAbout: About | null;

  // Actions - Fetch
  fetchAboutSections: () => Promise<void>;
  refreshAboutSections: () => Promise<void>;

  // Actions - CRUD
  createAbout: (data: AboutFormValues) => Promise<boolean>;
  updateAbout: (id: string, data: AboutFormValues) => Promise<boolean>;
  deleteAbout: (id: string) => Promise<boolean>;

  // Actions - UI State
  setFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedAbout: (about: About | null) => void;

  // Helpers
  getAboutById: (id: string) => About | undefined;
  updateAboutInList: (updated: About) => void;
  removeAboutFromList: (id: string) => void;
}

export const useAboutStore = create<AboutStore>((set, get) => ({
  // Initial state
  aboutSections: [],
  isLoading: false,
  isSubmitting: false,
  isFormOpen: false,
  isDeleteDialogOpen: false,
  selectedAbout: null,

  // Fetch about sections from API
  fetchAboutSections: async () => {
    try {
      set({ isLoading: true });
      console.log("🔄 Fetching about sections...");

      const response = await fetch("/api/about", {
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
        const aboutSectionsData = Array.isArray(result.data)
          ? result.data
          : [];
        console.log(`✅ Loaded ${aboutSectionsData.length} about sections`);

        const aboutSectionsWithDates = aboutSectionsData.map((about: any) => ({
          ...about,
          createdAt: about.createdAt ? new Date(about.createdAt) : new Date(),
          updatedAt: about.updatedAt ? new Date(about.updatedAt) : new Date(),
        }));

        set({ aboutSections: aboutSectionsWithDates });

        if (aboutSectionsWithDates.length === 0) {
          console.log("ℹ️ No about sections found in database");
        }
      } else {
        console.error("❌ API returned error:", result.error);
        toast.error(result.error || "Failed to fetch about sections");
        set({ aboutSections: [] });
      }
    } catch (error: any) {
      console.error("❌ Error fetching about sections:", error);
      toast.error(error.message || "Failed to fetch about sections");
      set({ aboutSections: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh about sections
  refreshAboutSections: async () => {
    await get().fetchAboutSections();
  },

  // Create about section
  createAbout: async (data: AboutFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log("🔄 Creating about section...", data);

      const response = await fetch("/api/about", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create about section");
      }

      console.log("✅ About section created:", result.data);
      toast.success("About section created successfully");

      // Add to list
      const newAbout: About = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };

      set((state) => ({
        aboutSections: [newAbout, ...state.aboutSections],
      }));

      return true;
    } catch (error: any) {
      console.error("❌ Error creating about section:", error);
      toast.error(error.message || "Failed to create about section");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Update about section
  updateAbout: async (id: string, data: AboutFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log("🔄 Updating about section...", { id, data });

      const response = await fetch(`/api/about/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update about section");
      }

      console.log("✅ About section updated:", result.data);
      toast.success("About section updated successfully");

      // Update in list
      get().updateAboutInList({
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      });

      return true;
    } catch (error: any) {
      console.error("❌ Error updating about section:", error);
      toast.error(error.message || "Failed to update about section");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete about section
  deleteAbout: async (id: string) => {
    try {
      set({ isSubmitting: true });
      console.log("🔄 Deleting about section...", id);

      const response = await fetch(`/api/about/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete about section");
      }

      console.log("✅ About section deleted:", id);
      toast.success("About section deleted successfully");

      // Remove from list
      get().removeAboutFromList(id);

      return true;
    } catch (error: any) {
      console.error("❌ Error deleting about section:", error);
      toast.error(error.message || "Failed to delete about section");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // UI State actions
  setFormOpen: (open: boolean) => {
    set({ isFormOpen: open });
    if (!open) {
      set({ selectedAbout: null });
    }
  },

  setDeleteDialogOpen: (open: boolean) => {
    set({ isDeleteDialogOpen: open });
  },

  setSelectedAbout: (about: About | null) => {
    set({ selectedAbout: about });
  },

  // Helpers
  getAboutById: (id: string) => {
    return get().aboutSections.find((a) => a.id === id);
  },

  updateAboutInList: (updated: About) => {
    set((state) => ({
      aboutSections: state.aboutSections.map((a) =>
        a.id === updated.id ? updated : a
      ),
    }));
  },

  removeAboutFromList: (id: string) => {
    set((state) => ({
      aboutSections: state.aboutSections.filter((a) => a.id !== id),
    }));
  },
}));

