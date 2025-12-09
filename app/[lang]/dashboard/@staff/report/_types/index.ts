export type ReportStatus =
  | "pending"
  | "sent"
  | "received"
  | "read"
  | "archived";

export interface FileData {
  id: string;
  name: string;
  filepath: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  description: string;
  reportSentTo: string;
  reportSentBy: string;
  receiverStatus: ReportStatus;
  createdAt: string;
  updatedAt: string;
  fileData: FileData[];
  reportSentToUser?: {
    id: string;
    username: string;
    phoneNumber: string;
  } | null;
  reportSentByUser?: {
    id: string;
    username: string;
    phoneNumber: string;
  } | null;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Manager {
  id: string;
  username: string;
  phoneNumber: string;
}
