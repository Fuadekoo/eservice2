import { create } from "zustand";
import { ServiceDetail, ServiceDetailResponse } from "../_types";

interface ServiceDetailStore {
  // State
  service: ServiceDetail | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchServiceDetail: (serviceId: string) => Promise<void>;
  setService: (service: ServiceDetail | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useServiceDetailStore = create<ServiceDetailStore>((set) => ({
  // Initial state
  service: null,
  isLoading: false,
  error: null,

  // Fetch service detail from API
  fetchServiceDetail: async (serviceId: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/service/${serviceId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch service");
      }

      const result: ServiceDetailResponse = await response.json();

      if (result.success && result.data) {
        set({ service: result.data, isLoading: false, error: null });
      } else {
        throw new Error(result.error || "Failed to load service");
      }
    } catch (err: any) {
      console.error("Error fetching service detail:", err);
      set({
        service: null,
        isLoading: false,
        error: err.message || "Failed to load service details",
      });
    }
  },

  // Set service directly
  setService: (service: ServiceDetail | null) => {
    set({ service });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error });
  },

  // Reset store to initial state
  reset: () => {
    set({
      service: null,
      isLoading: false,
      error: null,
    });
  },
}));
