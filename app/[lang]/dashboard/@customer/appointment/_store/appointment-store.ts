import { create } from "zustand";
import { Appointment, Request } from "../_types";

interface AppointmentStore {
  appointments: Appointment[];
  approvedRequests: Request[];
  selectedAppointment: Appointment | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isDetailOpen: boolean;
  isFormOpen: boolean;

  // Actions
  fetchAppointments: () => Promise<void>;
  fetchApprovedRequests: () => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<void>;
  createAppointment: (data: {
    requestId: string;
    date: string;
    time?: string;
    notes?: string;
  }) => Promise<void>;
  updateAppointment: (
    id: string,
    data: {
      date?: string;
      time?: string;
      notes?: string;
    }
  ) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  setDetailOpen: (open: boolean) => void;
  setFormOpen: (open: boolean) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  approvedRequests: [],
  selectedAppointment: null,
  isLoading: false,
  isSubmitting: false,
  isDetailOpen: false,
  isFormOpen: false,

  fetchAppointments: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/appointment");
      const result = await response.json();

      if (result.success) {
        set({ appointments: result.data, isLoading: false });
      } else {
        throw new Error(result.error || "Failed to fetch appointments");
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  fetchApprovedRequests: async () => {
    try {
      const response = await fetch("/api/request");
      const result = await response.json();

      if (result.success) {
        // Filter only approved requests
        const approved = result.data.filter(
          (req: any) =>
            req.statusbystaff === "approved" &&
            req.statusbyadmin === "approved"
        );
        set({ approvedRequests: approved });
      }
    } catch (error: any) {
      console.error("Error fetching approved requests:", error);
    }
  },

  fetchAppointmentById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/appointment/${id}`);
      const result = await response.json();

      if (result.success) {
        set({ selectedAppointment: result.data, isLoading: false });
      } else {
        throw new Error(result.error || "Failed to fetch appointment");
      }
    } catch (error: any) {
      console.error("Error fetching appointment:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  createAppointment: async (data) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh appointments
        await get().fetchAppointments();
        set({ isSubmitting: false, isFormOpen: false });
      } else {
        throw new Error(result.error || "Failed to create appointment");
      }
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      set({ isSubmitting: false });
      throw error;
    }
  },

  updateAppointment: async (id, data) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/appointment/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh appointments
        await get().fetchAppointments();
        // Update selected appointment if it's the one being updated
        if (get().selectedAppointment?.id === id) {
          set({ selectedAppointment: result.data });
        }
        set({ isSubmitting: false, isDetailOpen: false });
      } else {
        throw new Error(result.error || "Failed to update appointment");
      }
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      set({ isSubmitting: false });
      throw error;
    }
  },

  deleteAppointment: async (id: string) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/appointment/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove from list
        const appointments = get().appointments.filter((apt) => apt.id !== id);
        set({ appointments, isSubmitting: false, isDetailOpen: false });
      } else {
        throw new Error(result.error || "Failed to delete appointment");
      }
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      set({ isSubmitting: false });
      throw error;
    }
  },

  setDetailOpen: (open: boolean) => {
    set({ isDetailOpen: open });
    if (!open) {
      set({ selectedAppointment: null });
    }
  },

  setFormOpen: (open: boolean) => {
    set({ isFormOpen: open });
  },

  setSelectedAppointment: (appointment: Appointment | null) => {
    set({ selectedAppointment: appointment });
  },
}));

