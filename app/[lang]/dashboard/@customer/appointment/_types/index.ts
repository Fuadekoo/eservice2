export type AppointmentStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  requestId: string;
  date: string;
  time?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  userId?: string | null;
  staffId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    phoneNumber: string;
  } | null;
  approveStaff?: {
    id: string;
    user: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  } | null;
  request: {
    id: string;
    statusbystaff?: "pending" | "approved" | "rejected";
    statusbyadmin?: "pending" | "approved" | "rejected";
    service: {
      id: string;
      name: string;
      description: string;
      office: {
        id: string;
        name: string;
        address: string;
        roomNumber: string;
      };
    };
  };
}

export interface Request {
  id: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    description: string;
  };
  statusbystaff: "pending" | "approved" | "rejected";
  statusbyadmin: "pending" | "approved" | "rejected";
}

