import { z } from "zod";

export const gallerySchema = z.object({
  name: z
    .string()
    .min(1, "Gallery name is required")
    .max(255, "Gallery name is too long"),
  description: z
    .string()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
  images: z
    .array(z.string().min(1, "Image filename is required"))
    .min(1, "At least one image is required"),
});

export type GalleryFormValues = z.infer<typeof gallerySchema>;

