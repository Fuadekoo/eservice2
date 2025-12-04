export interface Administration {
  id: string;
  name: string;
  description: string | null;
  image: string; // Filename stored in filedata folder
  createdAt: Date;
  updatedAt: Date;
}

export interface About {
  id: string;
  name: string;
  description: string | null;
  image: string; // Filename stored in filedata folder
  createdAt: Date;
  updatedAt: Date;
}

export interface AdministrationFormData {
  name: string;
  description?: string;
  image: string; // Filename
}

export interface AboutFormData {
  name: string;
  description?: string;
  image: string; // Filename
}

