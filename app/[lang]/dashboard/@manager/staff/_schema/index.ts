import { z } from "zod";
import {
  normalizePhoneNumber,
  isValidEthiopianPhone,
} from "@/lib/utils/phone-number";

// Common field definitions
const phoneNumberField = z
  .string()
  .min(1, "Phone number is required")
  .refine(
    (phone) => {
      const normalized = normalizePhoneNumber(phone);
      return isValidEthiopianPhone(normalized);
    },
    {
      message:
        "Please enter a valid Ethiopian phone number (e.g., 0912345678 or +251912345678)",
    }
  );

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters");

const passwordOptionalField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .optional()
  .or(z.literal(""));

// Schema for creating staff with user
export const staffCreateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  phoneNumber: phoneNumberField,
  password: passwordField,
  roleId: z.string().optional().or(z.literal("")), // Optional - will be auto-assigned to "staff" role by API
  officeId: z.string().min(1, "Office is required"),
});

// Schema for updating staff/user
export const staffUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  phoneNumber: phoneNumberField.optional(),
  password: passwordOptionalField,
  roleId: z.string().min(1, "Role is required").optional(),
  officeId: z.string().min(1, "Office is required"),
});

// Legacy schema for backward compatibility (selecting existing user)
export const staffSchema = z.object({
  userId: z.string().min(1, "User is required"),
  officeId: z.string().min(1, "Office is required"),
});

export type StaffFormValues =
  | z.infer<typeof staffCreateSchema>
  | z.infer<typeof staffUpdateSchema>
  | z.infer<typeof staffSchema>;
export type StaffCreateValues = z.infer<typeof staffCreateSchema>;
export type StaffUpdateValues = z.infer<typeof staffUpdateSchema>;
