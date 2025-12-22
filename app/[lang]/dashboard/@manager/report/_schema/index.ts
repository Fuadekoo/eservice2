import { z } from "zod";

export const reportSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  description: z.string().min(1, "Description is required"),
  reportSentTo: z.array(z.string()).min(1, "At least one recipient is required"),
  fileDataIds: z.array(z.string()).optional(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;
