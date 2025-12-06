import { z } from "zod";

export const applyServiceSchema = z.object({
  officeId: z.string().min(1, "Office is required"),
  serviceId: z.string().min(1, "Service is required"),
  currentAddress: z.string().min(1, "Current address is required"),
  date: z.coerce.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    {
      message: "Date must be today or in the future",
    }
  ),
  notes: z.string().optional(),
});

// Type override for form compatibility
export type ApplyServiceFormValues = {
  officeId: string;
  serviceId: string;
  currentAddress: string;
  date: Date;
  notes?: string;
};
