import { z } from "zod";
import {
  normalizePhoneNumber,
  isValidEthiopianPhone,
} from "@/lib/utils/phone-number";

export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
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
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    otpCode: z
      .string()
      .length(6, "OTP code must be 6 digits")
      .regex(/^\d+$/, "OTP code must contain only numbers")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpSchema = z.infer<typeof signUpSchema>;


