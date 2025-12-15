import { create } from "zustand";
import { Request, PaginationInfo } from "../_types";

interface RequestManagementState {
  requests: Request[];
  selectedRequest: Request | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isDetailOpen: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  status: string;
  pagination: PaginationInfo | null;

  // Actions
  fetchRequests: () => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  approveRequest: (id: string, note?: string) => Promise<void>;
  rejectRequest: (id: string, note?: string) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setDetailOpen: (open: boolean) => void;
  setSelectedRequest: (request: Request | null) => void;
  reset: () => void;
}

const initialState = {
  requests: [],
  selectedRequest: null,
  isLoading: false,
  isSubmitting: false,
  isDetailOpen: false,
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  search: "",
  status: "",
  pagination: null,
};

export const useRequestManagementStore = create<RequestManagementState>(
  (set, get) => ({
    ...initialState,

    fetchRequests: async () => {
      set({ isLoading: true });
      try {
        const { page, pageSize, search, status } = get();
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        if (search) params.append("search", search);
        if (status) params.append("status", status);

        const response = await fetch(`/api/request?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          set({
            requests: result.data,
            pagination: result.pagination,
            total: result.pagination?.total || 0,
            totalPages: result.pagination?.totalPages || 0,
            isLoading: false,
          });
        } else {
          throw new Error(result.error || "Failed to fetch requests");
        }
      } catch (error: any) {
        console.error("Error fetching requests:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    fetchRequestById: async (id: string) => {
      set({ isLoading: true });
      try {
        const response = await fetch(`/api/request/${id}`);
        const result = await response.json();

        if (result.success) {
          set({
            selectedRequest: result.data,
            isLoading: false,
          });
        } else {
          throw new Error(result.error || "Failed to fetch request");
        }
      } catch (error: any) {
        console.error("Error fetching request:", error);
        set({ isLoading: false });
        throw error;
      }
    },

    approveRequest: async (id: string, note?: string) => {
      set({ isSubmitting: true });
      try {
        const response = await fetch(`/api/request/${id}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note, action: "approve" }),
        });

        const result = await response.json();

        if (result.success) {
          // Update the request in the list
          const requests = get().requests;
          const updatedRequests = requests.map((req) =>
            req.id === id ? result.data : req
          );
          set({
            requests: updatedRequests,
            selectedRequest: result.data,
            isSubmitting: false,
          });
        } else {
          throw new Error(result.error || "Failed to approve request");
        }
      } catch (error: any) {
        console.error("Error approving request:", error);
        set({ isSubmitting: false });
        throw error;
      }
    },

    rejectRequest: async (id: string, note?: string) => {
      set({ isSubmitting: true });
      try {
        const response = await fetch(`/api/request/${id}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note, action: "reject" }),
        });

        const result = await response.json();

        if (result.success) {
          // Update the request in the list
          const requests = get().requests;
          const updatedRequests = requests.map((req) =>
            req.id === id ? result.data : req
          );
          set({
            requests: updatedRequests,
            selectedRequest: result.data,
            isSubmitting: false,
          });
        } else {
          throw new Error(result.error || "Failed to reject request");
        }
      } catch (error: any) {
        console.error("Error rejecting request:", error);
        set({ isSubmitting: false });
        throw error;
      }
    },

    setPage: (page: number) => {
      set({ page });
      get().fetchRequests();
    },

    setPageSize: (pageSize: number) => {
      set({ pageSize, page: 1 });
      get().fetchRequests();
    },

    setSearch: (search: string) => {
      set({ search, page: 1 });
      get().fetchRequests();
    },

    setStatus: (status: string) => {
      set({ status, page: 1 });
      get().fetchRequests();
    },

    setDetailOpen: (open: boolean) => {
      set({ isDetailOpen: open });
      if (!open) {
        set({ selectedRequest: null });
      }
    },

    setSelectedRequest: (request: Request | null) => {
      set({ selectedRequest: request });
    },

    reset: () => {
      set(initialState);
    },
  })
);
