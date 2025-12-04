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
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Statistics
  totalRequests?: number;
  totalAppointments?: number;
  totalUsers?: number;
  totalServices?: number;
}

export interface OfficeFormData {
  name: string;
  phoneNumber?: string;
  roomNumber: string;
  address: string;
  subdomain: string;
  logo?: string;
  slogan?: string;
  status: boolean;
  startedAt: Date;
}
