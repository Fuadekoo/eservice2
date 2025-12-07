import { z } from "zod";
import {
  normalizePhoneNumber,
  isValidEthiopianPhone,
} from "@/lib/utils/phone-number";

export const forgotPasswordSchema = z
  .object({
    phoneNumber: z
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
      ),
    otpCode: z
      .string()
      .length(6, "OTP code must be 6 digits")
      .regex(/^\d+$/, "OTP code must contain only numbers")
      .optional(),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
