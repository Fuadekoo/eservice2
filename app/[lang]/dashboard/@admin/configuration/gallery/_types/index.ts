export interface GalleryImage {
  id: string;
  galleryId: string;
  filename: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Gallery {
  id: string;
  name: string;
  description: string | null;
  images: GalleryImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryFormData {
  name: string;
  description?: string;
  images: string[]; // Array of filenames
}

