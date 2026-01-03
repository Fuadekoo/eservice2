import { create } from "zustand";
import { toast } from "sonner";
import { Gallery } from "../_types";
import { GalleryFormValues } from "../_schema";

interface GalleryStore {
  // State
  galleries: Gallery[];
  isLoading: boolean;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedGallery: Gallery | null;
  // Pagination state
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;

  // Actions - Fetch
  fetchGalleries: (opts?: {
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  refreshGalleries: () => Promise<void>;

  // Actions - CRUD
  createGallery: (data: GalleryFormValues) => Promise<boolean>;
  updateGallery: (id: string, data: GalleryFormValues) => Promise<boolean>;
  deleteGallery: (id: string) => Promise<boolean>;

  // Actions - UI State
  setFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedGallery: (gallery: Gallery | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Helpers
  getGalleryById: (id: string) => Gallery | undefined;
  updateGalleryInList: (updatedGallery: Gallery) => void;
  removeGalleryFromList: (id: string) => void;
}

export const useGalleryStore = create<GalleryStore>((set, get) => ({
  // Initial state
  galleries: [],
  isLoading: false,
  isSubmitting: false,
  isFormOpen: false,
  isDeleteDialogOpen: false,
  selectedGallery: null,
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 1,

  // Fetch galleries from API
  fetchGalleries: async (opts) => {
    try {
      set({ isLoading: true });
      const currentPage = opts?.page ?? get().page;
      const currentPageSize = opts?.pageSize ?? get().pageSize;
      console.log("🔄 Fetching galleries...", {
        page: currentPage,
        limit: currentPageSize,
      });

      const response = await fetch(
        `/api/gallery?page=${currentPage}&limit=${currentPageSize}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Fetch result:", result);

      if (result.success) {
        const galleriesData = Array.isArray(result.data) ? result.data : [];
        console.log(`✅ Loaded ${galleriesData.length} galleries`);

        const galleriesWithDates = galleriesData.map((gallery: any) => ({
          ...gallery,
          createdAt: gallery.createdAt
            ? new Date(gallery.createdAt)
            : new Date(),
          updatedAt: gallery.updatedAt
            ? new Date(gallery.updatedAt)
            : new Date(),
          images: gallery.images || [],
        }));

        const pagination = result.pagination || {};
        const effectiveTotal =
          typeof pagination.total === "number"
            ? pagination.total
            : galleriesWithDates.length;
        const effectiveLimit =
          typeof pagination.limit === "number"
            ? pagination.limit
            : currentPageSize;
        const effectivePage =
          typeof pagination.page === "number" ? pagination.page : currentPage;
        const effectiveTotalPages = Math.max(
          1,
          Math.ceil(effectiveTotal / effectiveLimit)
        );

        set({
          galleries: galleriesWithDates,
          total: effectiveTotal,
          page: effectivePage,
          pageSize: effectiveLimit,
          totalPages: effectiveTotalPages,
        });

        if (galleriesWithDates.length === 0) {
          console.log("ℹ️ No galleries found in database");
        }
      } else {
        console.error("❌ API returned error:", result.error);
        toast.error(result.error || "Failed to fetch galleries");
        set({ galleries: [], total: 0, totalPages: 1 });
      }
    } catch (error: any) {
      console.error("❌ Error fetching galleries:", error);
      toast.error(error.message || "Failed to fetch galleries");
      set({ galleries: [], total: 0, totalPages: 1 });
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh galleries
  refreshGalleries: async () => {
    await get().fetchGalleries();
  },

  // Create gallery
  createGallery: async (data: GalleryFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log("🔄 Creating gallery...", data);

      const response = await fetch("/api/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create gallery");
      }

      console.log("✅ Gallery created:", result.data);
      toast.success("Gallery created successfully");

      // Add to list
      const newGallery: Gallery = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
        images: result.data.images || [],
      };

      set((state) => ({
        galleries: [newGallery, ...state.galleries],
      }));

      return true;
    } catch (error: any) {
      console.error("❌ Error creating gallery:", error);
      toast.error(error.message || "Failed to create gallery");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Update gallery
  updateGallery: async (id: string, data: GalleryFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log("🔄 Updating gallery...", { id, data });

      const response = await fetch(`/api/gallery/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update gallery");
      }

      console.log("✅ Gallery updated:", result.data);
      toast.success("Gallery updated successfully");

      // Update in list
      get().updateGalleryInList({
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
        images: result.data.images || [],
      });

      return true;
    } catch (error: any) {
      console.error("❌ Error updating gallery:", error);
      toast.error(error.message || "Failed to update gallery");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete gallery
  deleteGallery: async (id: string) => {
    try {
      set({ isSubmitting: true });
      console.log("🔄 Deleting gallery...", id);

      const response = await fetch(`/api/gallery/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete gallery");
      }

      console.log("✅ Gallery deleted:", id);
      toast.success("Gallery deleted successfully");

      // Remove from list
      get().removeGalleryFromList(id);

      return true;
    } catch (error: any) {
      console.error("❌ Error deleting gallery:", error);
      toast.error(error.message || "Failed to delete gallery");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // UI State actions
  setFormOpen: (open: boolean) => {
    set({ isFormOpen: open });
    if (!open) {
      set({ selectedGallery: null });
    }
  },

  setDeleteDialogOpen: (open: boolean) => {
    set({ isDeleteDialogOpen: open });
  },

  setSelectedGallery: (gallery: Gallery | null) => {
    set({ selectedGallery: gallery });
  },

  setPage: (page: number) => {
    set({ page });
    // Refetch with updated pagination
    get().fetchGalleries({ page, pageSize: get().pageSize });
  },

  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    // Reset to page 1 when page size changes and refetch
    get().fetchGalleries({ page: 1, pageSize });
  },

  // Helpers
  getGalleryById: (id: string) => {
    return get().galleries.find((g) => g.id === id);
  },

  updateGalleryInList: (updatedGallery: Gallery) => {
    set((state) => ({
      galleries: state.galleries.map((g) =>
        g.id === updatedGallery.id ? updatedGallery : g
      ),
    }));
  },

  removeGalleryFromList: (id: string) => {
    set((state) => ({
      galleries: state.galleries.filter((g) => g.id !== id),
    }));
  },
}));
