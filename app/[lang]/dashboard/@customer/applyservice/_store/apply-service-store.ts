import { create } from "zustand";
import { toast } from "sonner";
import {
  Office,
  Service,
  OfficeAvailability,
  FilePreview,
  UploadedFile,
} from "../_types";
import { ApplyServiceFormValues } from "../_schema";

interface ApplyServiceStore {
  // State
  offices: Office[];
  services: Service[];
  selectedService: Service | null;
  officeAvailability: OfficeAvailability | null;
  files: FilePreview[];
  isLoadingOffices: boolean;
  isLoadingServices: boolean;
  isLoadingAvailability: boolean;
  isSubmitting: boolean;

  // Actions - Fetch
  fetchOffices: () => Promise<void>;
  fetchServices: (officeId: string) => Promise<void>;
  fetchServiceDetails: (serviceId: string) => Promise<void>;
  fetchOfficeAvailability: (officeId: string) => Promise<void>;

  // Actions - Files
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;

  // Actions - Submit
  submitApplication: (data: ApplyServiceFormValues) => Promise<boolean>;

  // Actions - UI State
  setSelectedService: (service: Service | null) => void;
  reset: () => void;
}

export const useApplyServiceStore = create<ApplyServiceStore>((set, get) => ({
  // Initial state
  offices: [],
  services: [],
  selectedService: null,
  officeAvailability: null,
  files: [],
  isLoadingOffices: false,
  isLoadingServices: false,
  isLoadingAvailability: false,
  isSubmitting: false,

  // Fetch offices
  fetchOffices: async () => {
    try {
      set({ isLoadingOffices: true });
      const response = await fetch("/api/office?page=1&limit=1000");
      const result = await response.json();

      if (result.success) {
        const activeOffices = result.data.filter(
          (office: Office) => office.status
        );
        set({ offices: activeOffices });
      } else {
        toast.error(result.error || "Failed to load offices");
        set({ offices: [] });
      }
    } catch (error: any) {
      console.error("Error fetching offices:", error);
      toast.error("Failed to load offices");
      set({ offices: [] });
    } finally {
      set({ isLoadingOffices: false });
    }
  },

  // Fetch services for an office
  fetchServices: async (officeId: string) => {
    if (!officeId) {
      set({ services: [], selectedService: null });
      return;
    }

    try {
      set({ isLoadingServices: true });
      const response = await fetch(
        `/api/service?officeId=${officeId}&page=1&pageSize=100`
      );
      const result = await response.json();

      if (result.success) {
        set({ services: result.data });
      } else {
        toast.error(result.error || "Failed to load services");
        set({ services: [] });
      }
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
      set({ services: [] });
    } finally {
      set({ isLoadingServices: false });
    }
  },

  // Fetch service details
  fetchServiceDetails: async (serviceId: string) => {
    if (!serviceId) {
      set({ selectedService: null });
      return;
    }

    try {
      set({ isLoadingAvailability: true });
      const response = await fetch(`/api/service/${serviceId}`);
      const result = await response.json();

      if (result.success) {
        set({ selectedService: result.data });
      } else {
        toast.error(result.error || "Failed to load service details");
        set({ selectedService: null });
      }
    } catch (error: any) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to load service details");
      set({ selectedService: null });
    } finally {
      set({ isLoadingAvailability: false });
    }
  },

  // Fetch office availability
  fetchOfficeAvailability: async (officeId: string) => {
    if (!officeId) {
      set({ officeAvailability: null });
      return;
    }

    try {
      set({ isLoadingAvailability: true });
      const response = await fetch(`/api/office/${officeId}/availability`);
      const result = await response.json();

      if (result.config) {
        set({ officeAvailability: result.config });
      } else {
        set({ officeAvailability: null });
      }
    } catch (error: any) {
      console.error("Error fetching office availability:", error);
      set({ officeAvailability: null });
    } finally {
      set({ isLoadingAvailability: false });
    }
  },

  // Add files
  addFiles: (newFiles: File[]) => {
    const validFiles: FilePreview[] = [];

    newFiles.forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";

      if (!isImage && !isPDF) {
        toast.error(
          `${file.name} is not a valid file. Only images and PDFs are allowed.`
        );
        return;
      }

      // Validate file size
      // Images: 10MB (keeps UI snappy)
      // PDFs: allow larger via chunked upload (up to 50MB)
      const maxImageSize = 10 * 1024 * 1024;
      const maxPdfSize = 50 * 1024 * 1024;
      if (isImage && file.size > maxImageSize) {
        toast.error(`${file.name} exceeds 10MB image limit.`);
        return;
      }
      if (isPDF && file.size > maxPdfSize) {
        toast.error(`${file.name} exceeds 50MB PDF limit.`);
        return;
      }

      const id = Math.random().toString(36).substring(7);
      let preview = "";

      if (isImage) {
        preview = URL.createObjectURL(file);
      } else {
        preview = "/pdf-icon.png"; // You can add a PDF icon
      }

      validFiles.push({ file, preview, id });
    });

    set((state) => ({ files: [...state.files, ...validFiles] }));
  },

  // Remove file
  removeFile: (id: string) => {
    set((state) => {
      const fileToRemove = state.files.find((f) => f.id === id);
      if (fileToRemove && fileToRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return { files: state.files.filter((f) => f.id !== id) };
    });
  },

  // Clear all files
  clearFiles: () => {
    const { files } = get();
    files.forEach((file) => {
      if (file.preview.startsWith("blob:")) {
        URL.revokeObjectURL(file.preview);
      }
    });
    set({ files: [] });
  },

  // Submit application
  submitApplication: async (data: ApplyServiceFormValues) => {
    try {
      set({ isSubmitting: true });

      // Upload files first
      const uploadedFiles: UploadedFile[] = [];

      const uploadSmallFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload/request-file", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult?.success) {
          return uploadResult.data?.filepath as string;
        }

        const message =
          uploadResult?.error ||
          `Failed to upload file (${uploadResponse.status})`;
        throw new Error(message);
      };

      const uploadChunkedFile = async (file: File) => {
        const chunkSize = 2 * 1024 * 1024; // 2MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        const ext = file.name.includes(".")
          ? `.${file.name.split(".").pop()}`
          : "";
        const uniqueName = `req-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}${ext}`;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunkBlob = file.slice(start, end);

          const formData = new FormData();
          formData.append("chunk", chunkBlob, uniqueName);
          formData.append("filename", uniqueName);
          formData.append("chunkIndex", String(chunkIndex));
          formData.append("totalChunks", String(totalChunks));
          formData.append("totalSize", String(file.size));

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const json = await res.json();
          if (!res.ok || !json?.success) {
            const message =
              json?.error || `Chunk upload failed (${res.status})`;
            throw new Error(message);
          }

          // Final chunk returns the filename
          if (chunkIndex + 1 === totalChunks) {
            const finalName = (json.filename as string) || uniqueName;
            return `filedata/${finalName}`;
          }
        }

        throw new Error("Chunk upload failed");
      };

      for (const filePreview of get().files) {
        const file = filePreview.file;

        // Use chunked upload for larger files to avoid slow failures/timeouts
        const useChunked = file.size > 10 * 1024 * 1024;
        const filepath = useChunked
          ? await uploadChunkedFile(file)
          : await uploadSmallFile(file);

        if (filepath) {
          uploadedFiles.push({
            name: file.name,
            filepath,
            description: data.notes || undefined,
          });
        } else {
          throw new Error("Failed to upload file");
        }
      }

      // Create request
      const response = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: data.serviceId,
          currentAddress: data.currentAddress,
          date: data.date.toISOString(),
          status: "pending",
          files: uploadedFiles,
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Service application submitted successfully!");
        get().reset();
        return true;
      } else {
        toast.error(result.error || "Failed to submit application");
        return false;
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Set selected service
  setSelectedService: (service: Service | null) => {
    set({ selectedService: service });
  },

  // Reset all state
  reset: () => {
    get().clearFiles();
    set({
      services: [],
      selectedService: null,
      officeAvailability: null,
    });
  },
}));
