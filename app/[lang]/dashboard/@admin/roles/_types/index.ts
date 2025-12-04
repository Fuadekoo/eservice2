export interface Role {
  id: string;
  name: string;
  officeId?: string | null;
  office?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
  userCount?: number;
  permissionCount?: number;
  isSystem?: boolean;
}

export interface Permission {
  id: string;
  name: string;
}

