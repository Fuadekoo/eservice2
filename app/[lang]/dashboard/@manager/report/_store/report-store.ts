"use client";

import { create } from "zustand";
import { Report, PaginationInfo, Admin } from "../_types";

type ReportType = "received" | "sent";

interface ReportManagementState {
  reports: Report[];
  selectedReport: Report | null;
  admins: Admin[];
  isLoading: boolean;
  isDetailOpen: boolean;
  isFormOpen: boolean;
  reportType: ReportType;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  status: string;
  pagination: PaginationInfo | null;

  // Actions
  fetchReports: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  fetchReportById: (id: string) => Promise<void>;
  createReport: (data: {
    name: string;
    description: string;
    reportSentTo: string | string[]; // Can be single ID or array of IDs
    fileDataIds?: string[];
  }) => Promise<void>;
  updateReportStatus: (id: string, action: "approve" | "reject") => Promise<void>;
  setReportType: (type: ReportType) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setDetailOpen: (open: boolean) => void;
  setFormOpen: (open: boolean) => void;
  setSelectedReport: (report: Report | null) => void;
  reset: () => void;
}

const initialState = {
  reports: [],
  selectedReport: null,
  admins: [],
  isLoading: false,
  isDetailOpen: false,
  isFormOpen: false,
  reportType: "received" as ReportType,
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  search: "",
  status: "",
  pagination: null,
};

export const useManagerReportStore = create<ReportManagementState>(
  (set, get) => ({
    ...initialState,

    fetchReports: async () => {
      set({ isLoading: true });
      try {
        const { page, pageSize, search, status, reportType } = get();
        const params = new URLSearchParams({
          type: reportType,
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        if (search) params.append("search", search);
        if (status) params.append("status", status);

        const response = await fetch(
          `/api/manager/report?${params.toString()}`,
          {
            cache: "no-store",
          }
        );
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

    fetchAdmins: async () => {
      try {
        const response = await fetch("/api/admin/list", { cache: "no-store" });
        const result = await response.json();

        if (result.success) {
          const adminList = result.data || [];
          console.log("✅ Fetched admins:", adminList);
          set({ admins: adminList });
          return adminList;
        } else {
          console.error("❌ Failed to fetch admins:", result.error);
          throw new Error(result.error || "Failed to fetch admins");
        }
      } catch (error: any) {
        console.error("❌ Error fetching admins:", error);
        throw error;
      }
    },

    fetchReportById: async (id: string) => {
      set({ isLoading: true });
      try {
        const response = await fetch(`/api/manager/report/${id}`, {
          cache: "no-store",
        });
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

    createReport: async (data) => {
      set({ isLoading: true });
      try {
        const response = await fetch("/api/manager/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.success) {
          // Refresh reports list
          await get().fetchReports();
          set({ isLoading: false, isFormOpen: false });
          return result.data;
        } else {
          throw new Error(result.error || "Failed to create report");
        }
      } catch (error: any) {
        console.error("Error creating report:", error);
        set({ isLoading: false });
        throw error;
      }
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
          throw new Error(result.error || `Failed to ${action} report`);
        }
      } catch (error: any) {
        console.error(`Error ${action}ing report:`, error);
        throw error;
      }
    },

    setReportType: (type: ReportType) => {
      set({ reportType: type, page: 1, search: "", status: "" });
      get().fetchReports();
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
      get().fetchReports();
    },

    setStatus: (status: string) => {
      set({ status, page: 1 });
      get().fetchReports();
    },

    setDetailOpen: (open: boolean) => {
      set({ isDetailOpen: open });
      if (!open) {
        set({ selectedReport: null });
      }
    },

    setFormOpen: (open: boolean) => {
      set({ isFormOpen: open });
    },

    setSelectedReport: (report: Report | null) => {
      set({ selectedReport: report });
    },

    reset: () => {
      set(initialState);
    },
  })
);
