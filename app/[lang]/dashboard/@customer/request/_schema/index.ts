import { z } from "zod";

export const customerRequestSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  currentAddress: z.string().min(1, "Current address is required"),
  date: z.coerce.date(),
});

// Type override for form compatibility
export type CustomerRequestFormValues = {
  serviceId: string;
  currentAddress: string;
  date: Date;
};
