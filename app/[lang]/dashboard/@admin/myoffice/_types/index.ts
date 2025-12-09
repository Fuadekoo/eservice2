export interface AdminOffice extends Office {
  // Extended office interface
}

export interface Office {
  id: string;
  name: string;
  phoneNumber: string | null;
  roomNumber: string;
  address: string;
  subdomain: string;
  logo: string | null;
  slogan: string | null;
  status: boolean;
  startedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  officeId: string;
  office?: {
    id: string;
    name: string;
    roomNumber: string;
    address: string;
    status: boolean;
  };
  requirements?: Requirement[];
  serviceFors?: ServiceFor[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Requirement {
  id?: string;
  name: string;
  description?: string | null;
}

export interface ServiceFor {
  id?: string;
  name: string;
  description?: string | null;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface FileData {
  id: string;
  name: string;
  filepath: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Request {
  id: string;
  userId: string;
  serviceId: string;
  currentAddress: string;
  date: Date | string;
  statusbystaff: "pending" | "approved" | "rejected";
  statusbyadmin: "pending" | "approved" | "rejected";
  approveStaffId?: string | null;
  approveManagerId?: string | null;
  approveNote?: string | null;
  user?: {
    id: string;
    username: string;
    phoneNumber: string;
  };
  service?: {
    id: string;
    name: string;
    description: string;
    officeId: string;
    office?: {
      id: string;
      name: string;
      roomNumber: string;
      address: string;
    };
  };
  fileData?: FileData[];
  appointments?: Appointment[];
  approveStaff?: {
    id: string;
    user?: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  } | null;
  approveManager?: {
    id: string;
    user?: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Appointment {
  id: string;
  requestId: string;
  date: Date | string;
  time?: string | null;
  status: "pending" | "approved" | "completed" | "cancelled" | "rejected";
  notes?: string | null;
  userId?: string | null;
  staffId?: string | null;
  request?: {
    id: string;
    userId: string;
    serviceId: string;
    service?: {
      id: string;
      name: string;
      officeId: string;
      office?: {
        id: string;
        name: string;
        roomNumber: string;
        address: string;
      };
    };
    user?: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  };
  user?: {
    id: string;
    username: string;
    phoneNumber: string;
  };
  approveStaff?: {
    id: string;
    user?: {
      id: string;
      username: string;
      phoneNumber: string;
    };
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}
