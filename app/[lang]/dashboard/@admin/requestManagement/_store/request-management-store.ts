import { create } from "zustand";
import { Request, Office, PaginationInfo } from "../_types";

interface RequestManagementState {
  requests: Request[];
  offices: Office[];
  selectedRequest: Request | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isDetailOpen: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  officeId: string;
  status: string;
  pagination: PaginationInfo | null;

  // Actions
  fetchRequests: () => Promise<void>;
  fetchOffices: () => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  approveRequest: (
    id: string,
    status: "approved" | "rejected",
    note?: string
  ) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setOfficeId: (officeId: string) => void;
  setStatus: (status: string) => void;
  setDetailOpen: (open: boolean) => void;
  setSelectedRequest: (request: Request | null) => void;
  reset: () => void;
}

const initialState = {
  requests: [],
  offices: [],
  selectedRequest: null,
  isLoading: false,
  isSubmitting: false,
  isDetailOpen: false,
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  search: "",
  officeId: "",
  status: "",
  pagination: null,
};

export const useRequestManagementStore = create<RequestManagementState>(
  (set, get) => ({
    ...initialState,

    fetchRequests: async () => {
      set({ isLoading: true });
      try {
        const { page, pageSize, search, officeId, status } = get();
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        if (search) params.append("search", search);
        if (officeId) params.append("officeId", officeId);
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

    fetchOffices: async () => {
      try {
        const response = await fetch("/api/office");
        const result = await response.json();

        if (result.success) {
          set({ offices: result.data || [] });
        }
      } catch (error: any) {
        console.error("Error fetching offices:", error);
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

    approveRequest: async (
      id: string,
      status: "approved" | "rejected",
      note?: string
    ) => {
      set({ isSubmitting: true });
      try {
        const response = await fetch(`/api/request/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, approveNote: note }),
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

    setOfficeId: (officeId: string) => {
      set({ officeId, page: 1 });
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
