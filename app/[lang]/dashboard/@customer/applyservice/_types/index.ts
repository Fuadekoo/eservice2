export interface Office {
  id: string;
  name: string;
  roomNumber: string;
  address: string;
  status: boolean;
}

export interface Requirement {
  id: string;
  name: string;
  description: string | null;
}

export interface ServiceFor {
  id: string;
  name: string;
  description: string | null;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  officeId: string;
  office: Office;
  requirements: Requirement[];
  serviceFors: ServiceFor[];
}

export interface DaySchedule {
  start: string;
  end: string;
  available: boolean;
}

export interface OfficeAvailability {
  defaultSchedule: Record<string, DaySchedule>;
  slotDuration: number;
  unavailableDateRanges: any[];
  unavailableDates: string[];
  dateOverrides: Record<string, DaySchedule>;
}

export interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

export interface UploadedFile {
  name: string;
  filepath: string;
  description?: string;
}
