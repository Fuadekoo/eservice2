export interface UserProfile {
  id: string;
  username: string;
  phoneNumber: string;
  role: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileUpdateData {
  username: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

