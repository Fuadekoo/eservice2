export interface Office {
  id: string;
  name: string;
  roomNumber: string;
  address: string;
  status: boolean;
  logo?: string | null;
  slogan?: string | null;
}

export interface Requirement {
  id: string;
  name: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceFor {
  id: string;
  name: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssignedStaff {
  id: string;
  userId?: string;
  name: string;
  email?: string | null;
  phoneNumber: string;
}

export interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  officeId: string;
  office?: Office;
  requirements?: Requirement[];
  serviceFors?: ServiceFor[];
  assignedStaff?: AssignedStaff[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceDetailResponse {
  success: boolean;
  data?: ServiceDetail;
  error?: string;
}
