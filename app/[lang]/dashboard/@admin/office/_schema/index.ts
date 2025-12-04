import { z } from "zod";

export const officeSchema = z.object({
  name: z
    .string()
    .min(1, "Office name is required")
    .max(255, "Name is too long"),
  phoneNumber: z.string().optional(),
  roomNumber: z.string().min(1, "Room number is required"),
  address: z.string().min(1, "Address is required"),
  subdomain: z
    .string()
    .min(1, "Subdomain is required")
    .max(255, "Subdomain is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    )
    .transform((val) => val.toLowerCase().trim()),
  logo: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine(
      (val) => {
        if (!val || val === "") return true;

        // Allow relative paths (uploaded files) like /upload/logo/file.jpg
        if (val.startsWith("/")) {
          // Validate it's a valid path format
          return /^\/[^\/].*/.test(val);
        }

        // Allow absolute URLs (http/https)
        try {
          const url = new URL(val);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message:
          "Logo must be a valid file path (e.g., /upload/logo/file.jpg) or URL",
      }
    ),
  slogan: z.string().max(500, "Slogan is too long").optional(),
  status: z.boolean().optional().default(true),
  startedAt: z.preprocess((val) => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const date = new Date(val);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  }, z.date()),
});

export type OfficeFormValues = z.input<typeof officeSchema>;
