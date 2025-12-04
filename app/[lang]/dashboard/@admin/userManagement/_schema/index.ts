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

const emailField = z
  .string()
  .email("Please enter a valid email address")
  .optional()
  .or(z.literal(""));

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

const passwordOptionalField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  )
  .optional()
  .or(z.literal(""));

// Create user schema for creating new users
export const userSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    phoneNumber: phoneNumberField,
    email: emailField,
    password: passwordField,
    roleId: z.string().min(1, "Role is required"),
    officeId: z.string().optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      )
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // If email is provided, it must be valid
      if (data.email && data.email.trim() !== "") {
        return z.string().email().safeParse(data.email).success;
      }
      return true;
    },
    {
      message: "Please enter a valid email address",
      path: ["email"],
    }
  );

export type UserFormValues = z.infer<typeof userSchema>;

// Schema for updating user (all fields optional, password optional)
export const userUpdateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .optional(),
    phoneNumber: phoneNumberField.optional(),
    email: emailField,
    password: passwordOptionalField,
    roleId: z.string().min(1, "Role is required").optional(),
    officeId: z.string().optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      )
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // At least one field should be provided for update
      return Object.keys(data).length > 0;
    },
    {
      message: "At least one field must be provided for update",
    }
  )
  .refine(
    (data) => {
      // If email is provided, it must be valid
      if (data.email && data.email.trim() !== "") {
        return z.string().email().safeParse(data.email).success;
      }
      return true;
    },
    {
      message: "Please enter a valid email address",
      path: ["email"],
    }
  );

export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
