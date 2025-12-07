"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { AdminOffice, Service, Request, Appointment } from "../_types";

interface MyOfficeStore {
  // Office state
  office: AdminOffice | null;
  isLoadingOffice: boolean;
  
  // Services state
  services: Service[];
  isLoadingServices: boolean;
  isSubmittingService: boolean;
  
  // Requests state
  requests: Request[];
  isLoadingRequests: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  statusFilter: string;
  
  // Appointments state
  appointments: Appointment[];
  isLoadingAppointments: boolean;
  appointmentPage: number;
  appointmentPageSize: number;
  appointmentTotal: number;
  appointmentTotalPages: number;
  appointmentSearch: string;
  appointmentStatusFilter: string;
  
  // Actions
  fetchOffice: () => Promise<void>;
  assignOffice: (officeId: string) => Promise<boolean>;
  removeOffice: () => Promise<void>;
  
  fetchServices: () => Promise<void>;
  createService: (data: any) => Promise<boolean>;
  
  fetchRequests: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  
  fetchAppointments: () => Promise<void>;
  setAppointmentPage: (page: number) => void;
  setAppointmentPageSize: (pageSize: number) => void;
  setAppointmentSearch: (search: string) => void;
  setAppointmentStatusFilter: (status: string) => void;
}

export const useMyOfficeStore = create<MyOfficeStore>((set, get) => ({
  // Initial state
  office: null,
  isLoadingOffice: false,
  services: [],
  isLoadingServices: false,
  isSubmittingService: false,
  requests: [],
  isLoadingRequests: false,
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  search: "",
  statusFilter: "all",
  appointments: [],
  isLoadingAppointments: false,
  appointmentPage: 1,
  appointmentPageSize: 10,
  appointmentTotal: 0,
  appointmentTotalPages: 0,
  appointmentSearch: "",
  appointmentStatusFilter: "all",
  
  // Fetch admin's office
  fetchOffice: async () => {
    try {
      set({ isLoadingOffice: true });
      const response = await fetch("/api/admin/office", { cache: "no-store" });
      const result = await response.json();
      
      if (result.success) {
        set({ office: result.data || null });
      } else {
        console.error("Error fetching office:", result.error);
      }
    } catch (error: any) {
      console.error("Error fetching office:", error);
      toast.error("Failed to fetch office");
    } finally {
      set({ isLoadingOffice: false });
    }
  },
  
  // Assign office to admin
  assignOffice: async (officeId: string) => {
    try {
      set({ isLoadingOffice: true });
      const response = await fetch("/api/admin/office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officeId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        set({ office: result.data });
        toast.success("Office assigned successfully");
        
        // Refresh services and requests
        get().fetchServices();
        get().fetchRequests();
        get().fetchAppointments();
        
        return true;
      } else {
        toast.error(result.error || "Failed to assign office");
        return false;
      }
    } catch (error: any) {
      console.error("Error assigning office:", error);
      toast.error("Failed to assign office");
      return false;
    } finally {
      set({ isLoadingOffice: false });
    }
  },
  
  // Remove office assignment
  removeOffice: async () => {
    try {
      set({ isLoadingOffice: true });
      const response = await fetch("/api/admin/office", {
        method: "DELETE",
      });
      
      const result = await response.json();
      
      if (result.success) {
        set({ office: null });
        set({ services: [] });
        set({ requests: [] });
        set({ appointments: [] });
        toast.success("Office assignment removed");
      } else {
        toast.error(result.error || "Failed to remove office");
      }
    } catch (error: any) {
      console.error("Error removing office:", error);
      toast.error("Failed to remove office");
    } finally {
      set({ isLoadingOffice: false });
    }
  },
  
  // Fetch services for the office
  fetchServices: async () => {
    const { office } = get();
    if (!office) return;
    
    try {
      set({ isLoadingServices: true });
      const response = await fetch(
        `/api/service?officeId=${office.id}&pageSize=100`,
        { cache: "no-store" }
      );
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        set({ services: result.data });
      }
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    } finally {
      set({ isLoadingServices: false });
    }
  },
  
  // Create service
  createService: async (data: any) => {
    try {
      set({ isSubmittingService: true });
      const response = await fetch("/api/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Service created successfully");
        get().fetchServices();
        return true;
      } else {
        toast.error(result.error || "Failed to create service");
        return false;
      }
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast.error("Failed to create service");
      return false;
    } finally {
      set({ isSubmittingService: false });
    }
  },
  
  // Fetch requests for the office
  fetchRequests: async () => {
    const { office, page, pageSize, search, statusFilter } = get();
    if (!office) return;
    
    try {
      set({ isLoadingRequests: true });
      
      let url = `/api/request?officeId=${office.id}&page=${page}&pageSize=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          url += `&statusbystaff=pending&statusbyadmin=pending`;
        } else if (statusFilter === "approved") {
          url += `&statusbystaff=approved&statusbyadmin=approved`;
        } else if (statusFilter === "rejected") {
          url += `&statusbystaff=rejected&statusbyadmin=rejected`;
        }
      }
      
      const response = await fetch(url, { cache: "no-store" });
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        set({
          requests: result.data,
          total: result.pagination?.total || 0,
          totalPages: result.pagination?.totalPages || 0,
        });
      }
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to fetch requests");
    } finally {
      set({ isLoadingRequests: false });
    }
  },
  
  // Request pagination and filters
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
  
  setStatusFilter: (status: string) => {
    set({ statusFilter: status, page: 1 });
    get().fetchRequests();
  },
  
  // Fetch appointments for the office
  fetchAppointments: async () => {
    const { office, appointmentPage, appointmentPageSize, appointmentSearch, appointmentStatusFilter } = get();
    if (!office) return;
    
    try {
      set({ isLoadingAppointments: true });
      
      // Fetch all appointments for requests belonging to this office
      // We'll need to filter by office through the request's service
      const response = await fetch("/api/appointment", { cache: "no-store" });
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        // Filter appointments by office
        let filtered = result.data.filter((apt: Appointment) => {
          return apt.request?.service?.officeId === office.id;
        });
        
        // Apply status filter
        if (appointmentStatusFilter !== "all") {
          filtered = filtered.filter((apt: Appointment) => apt.status === appointmentStatusFilter);
        }
        
        // Apply search filter
        if (appointmentSearch) {
          const searchLower = appointmentSearch.toLowerCase();
          filtered = filtered.filter((apt: Appointment) => {
            return (
              apt.request?.service?.name?.toLowerCase().includes(searchLower) ||
              apt.request?.user?.username?.toLowerCase().includes(searchLower) ||
              apt.request?.user?.phoneNumber?.includes(searchLower)
            );
          });
        }
        
        const total = filtered.length;
        const totalPages = Math.ceil(total / appointmentPageSize);
        const startIndex = (appointmentPage - 1) * appointmentPageSize;
        const paginated = filtered.slice(startIndex, startIndex + appointmentPageSize);
        
        set({
          appointments: paginated,
          appointmentTotal: total,
          appointmentTotalPages: totalPages,
        });
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      set({ isLoadingAppointments: false });
    }
  },
  
  // Appointment pagination and filters
  setAppointmentPage: (page: number) => {
    set({ appointmentPage: page });
    get().fetchAppointments();
  },
  
  setAppointmentPageSize: (pageSize: number) => {
    set({ appointmentPageSize: pageSize, appointmentPage: 1 });
    get().fetchAppointments();
  },
  
  setAppointmentSearch: (search: string) => {
    set({ appointmentSearch: search, appointmentPage: 1 });
    get().fetchAppointments();
  },
  
  setAppointmentStatusFilter: (status: string) => {
    set({ appointmentStatusFilter: status, appointmentPage: 1 });
    get().fetchAppointments();
  },
}));
