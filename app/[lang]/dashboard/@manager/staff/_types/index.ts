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
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StaffFormData {
  userId: string;
  officeId: string;
}
