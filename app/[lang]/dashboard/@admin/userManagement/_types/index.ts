export interface User {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  displayUsername: string | null;
  roleId: string;
  role?: Role;
  officeId?: string | null; // From staff relation
  office?: Office | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  officeId: string | null;
  office?: Office | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Office {
  id: string;
  name: string;
  phoneNumber: string | null;
  roomNumber: string;
  address: string;
  logo: string | null;
  slogan: string | null;
  status: boolean;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFormData {
  name: string;
  phoneNumber: string;
  email?: string;
  password: string;
  roleId: string;
  officeId?: string;
  username?: string;
}
