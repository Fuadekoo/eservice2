import { z } from "zod";

export const administrationSchema = z.object({
  name: z
    .string()
    .min(1, "Administrator name is required")
    .max(255, "Name is too long"),
  description: z
    .string()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
  image: z.string().min(1, "Image is required"),
});

export const aboutSchema = z.object({
  name: z
    .string()
    .min(1, "About section name is required")
    .max(255, "Name is too long"),
  description: z
    .string()
    .max(5000, "Description is too long")
    .optional()
    .nullable(),
  image: z.string().min(1, "Image is required"),
});

export type AdministrationFormValues = z.infer<typeof administrationSchema>;
export type AboutFormValues = z.infer<typeof aboutSchema>;

