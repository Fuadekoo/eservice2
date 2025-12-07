"use client";

import { create } from "zustand";
import { Report, PaginationInfo } from "../_types";

interface ReportManagementState {
  reports: Report[];
  selectedReport: Report | null;
  isLoading: boolean;
  isDetailOpen: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  status: string;
  officeId: string;
  pagination: PaginationInfo | null;

  // Actions
  fetchReports: () => Promise<void>;
  fetchReportById: (id: string) => Promise<void>;
  updateReportStatus: (
    id: string,
    action: "approve" | "reject"
  ) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setOfficeId: (officeId: string) => void;
  setDetailOpen: (open: boolean) => void;
  setSelectedReport: (report: Report | null) => void;
  reset: () => void;
}

const initialState = {
  reports: [],
  selectedReport: null,
  isLoading: false,
  isDetailOpen: false,
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  search: "",
  status: "",
  officeId: "",
  pagination: null,
};

export const useReportStore = create<ReportManagementState>((set, get) => ({
  ...initialState,

  fetchReports: async () => {
    set({ isLoading: true });
    try {
      const { page, pageSize, search, status, officeId } = get();
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (officeId && officeId !== "all") params.append("officeId", officeId);

      const response = await fetch(`/api/report?${params.toString()}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (result.success) {
        set({
          reports: result.data || [],
          pagination: result.pagination,
          total: result.pagination?.total || 0,
          totalPages: result.pagination?.totalPages || 0,
          isLoading: false,
        });
      } else {
        throw new Error(result.error || "Failed to fetch reports");
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  fetchReportById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/report/${id}`, { cache: "no-store" });
      const result = await response.json();

      if (result.success) {
        set({
          selectedReport: result.data,
          isLoading: false,
        });
      } else {
        throw new Error(result.error || "Failed to fetch report");
      }
    } catch (error: any) {
      console.error("Error fetching report:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchReports();
  },

  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().fetchReports();
  },

  setSearch: (search: string) => {
    set({ search, page: 1 });
    // Note: Debouncing should be handled in the component
    get().fetchReports();
  },

  setStatus: (status: string) => {
    set({ status, page: 1 });
    get().fetchReports();
  },

  setOfficeId: (officeId: string) => {
    set({ officeId, page: 1 });
    get().fetchReports();
  },

  updateReportStatus: async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/report/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
        cache: "no-store",
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the reports list
        await get().fetchReports();
        // Update selected report if it's the one being updated
        const currentSelected = get().selectedReport;
        if (currentSelected?.id === id) {
          await get().fetchReportById(id);
        }
        return result.data;
      } else {
        throw new Error(result.error || "Failed to update report status");
      }
    } catch (error: any) {
      console.error("Error updating report status:", error);
      throw error;
    }
  },

  setDetailOpen: (open: boolean) => {
    set({ isDetailOpen: open });
    if (!open) {
      set({ selectedReport: null });
    }
  },

  setSelectedReport: (report: Report | null) => {
    set({ selectedReport: report });
  },

  reset: () => {
    set(initialState);
  },
}));
