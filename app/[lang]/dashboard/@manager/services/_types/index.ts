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
  assignedStaff?: AssignedStaff[];
  requirements?: Requirement[];
  serviceFors?: ServiceFor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignedStaff {
  id: string;
  userId: string;
  name: string; // Changed from userName to match API response
  email: string | null; // Changed from userEmail
  phoneNumber: string; // Changed from userPhone
}

export interface Staff {
  id: string;
  userId: string;
  username: string;
  phoneNumber: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
  } | null;
  officeId: string;
  office?: {
    id: string;
    name: string;
    roomNumber: string;
    address: string;
    status: boolean;
  };
}

export interface ServiceFormData {
  name: string;
  description: string;
  timeToTake: string;
  officeId: string;
  requirements?: Requirement[];
  serviceFors?: ServiceFor[];
}
