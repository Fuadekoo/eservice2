export enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface FileData {
  id: string;
  name: string;
  filepath: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  requestId: string;
  date: Date;
  time?: string | null;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId?: string | null;
  staffId?: string | null;
  user?: {
    id: string;
    name: string;
    phoneNumber: string;
  } | null;
  approveStaff?: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  } | null;
}

export interface Request {
  id: string;
  userId: string;
  serviceId: string;
  currentAddress: string;
  date: Date;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string | null;
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
  appointments: Appointment[];
  fileData: FileData[];
}

export interface RequestFormData {
  serviceId: string;
  currentAddress: string;
  date: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  office: {
    id: string;
    name: string;
    roomNumber: string;
    address: string;
  };
}

