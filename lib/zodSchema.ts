import { z } from "zod";
import {
  normalizePhoneNumber,
  isValidEthiopianPhone,
} from "@/lib/utils/phone-number";

export const loginSchema = z.object({
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
  password: z.string({}).nonempty("password is required").default(""),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const passwordSchema = z.object({
  password: z.string().nonempty("password is required"),
  confirmPassword: z.string().nonempty("password didn't match"),
});
export type PasswordSchema = z.infer<typeof passwordSchema>;

export const usernameSchema = z.object({
  username: z.string().nonempty("username is required"),
});
export type UsernameSchema = z.infer<typeof usernameSchema>;
