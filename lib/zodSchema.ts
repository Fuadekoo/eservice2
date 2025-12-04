import { z } from "zod";

export const loginSchema = z.object({
  username: z.string({}).nonempty("username is required").default(""),
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
