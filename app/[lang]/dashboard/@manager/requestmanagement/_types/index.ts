export type RequestStatus = "pending" | "approved" | "rejected";

export interface FileData {
  id: string;
  name: string;
  filepath: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  date: string;
  time?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
  staffId?: string | null;
  user?: {
    id: string;
    name?: string;
    username?: string;
    phoneNumber?: string;
  } | null;
  approveStaff?: {
    id: string;
    user: {
      id: string;
      username: string;
      phoneNumber?: string;
    };
  } | null;
}

export interface Request {
  id: string;
  userId: string;
  serviceId: string;
  currentAddress: string;
  date: string;
  statusbystaff: RequestStatus;
  statusbyadmin: RequestStatus;
  createdAt: string;
  updatedAt: string;
  approveStaffId?: string | null;
  approveManagerId?: string | null;
  approveNote?: string | null;
  user: {
    id: string;
    username: string;
    phoneNumber: string;
  };
  service: {
    id: string;
    name: string;
    description: string;
    office: {
      id: string;
      name: string;
      roomNumber: string;
      address: string;
    };
  };
  approveStaff?: {
    id: string;
    user: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  } | null;
  approveManager?: {
    id: string;
    user: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  } | null;
  appointments: Appointment[];
  fileData: FileData[];
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
