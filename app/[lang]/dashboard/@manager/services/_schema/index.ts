import { z } from "zod";

export const requirementSchema = z.object({
  name: z.string().min(1, "Requirement name is required"),
  description: z.string().optional(),
});

export const serviceForSchema = z.object({
  name: z.string().min(1, "Service for name is required"),
  description: z.string().optional(),
});

export const serviceSchema = z.object({
  name: z
    .string()
    .min(1, "Service name is required")
    .max(255, "Service name is too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description is too long"),
  timeToTake: z
    .string()
    .min(1, "Time to take is required")
    .max(255, "Time to take is too long"),
  officeId: z.string().min(1, "Office is required"),
  requirements: z.array(requirementSchema).optional().default([]),
  serviceFors: z.array(serviceForSchema).optional().default([]),
});

export type RequirementFormValues = z.infer<typeof requirementSchema>;
export type ServiceForFormValues = z.infer<typeof serviceForSchema>;
export type ServiceFormValues = z.infer<typeof serviceSchema>;
