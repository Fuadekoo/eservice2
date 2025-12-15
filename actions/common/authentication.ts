"use server";

import { auth, CustomError, signIn, signOut } from "@/auth";
import prisma from "@/lib/db";
import { MutationState } from "@/lib/definitions";
import { LoginSchema, PasswordSchema, UsernameSchema } from "@/lib/zodSchema";
import bcrypt from "bcryptjs";

export async function authenticate(data: LoginSchema): Promise<MutationState> {
  try {
    await signIn("credentials", { ...data, redirect: false });
    return { status: true, message: "successfully login" };
  } catch (error: any) {
    // Extract error message from CustomError or NextAuth error
    let errorMessage = "Invalid credentials. Please try again.";
    
    // Log error for debugging
    console.error("Authentication error:", error);
    
    // Check if it's a CustomError instance
    if (error instanceof CustomError) {
      errorMessage = error.message;
    } 
    // Check error message and cause
    else if (error?.message || error?.cause?.message) {
      const message = error.message || error.cause?.message || "";
      const errorString = String(message).toLowerCase();
      
      // Check for phone number errors
      if (
        errorString.includes("phone number is not found") ||
        errorString.includes("invalid phone number") ||
        errorString.includes("credentialsSignin") ||
        errorString.includes("phone number")
      ) {
        errorMessage = "Phone number is not found";
      } 
      // Check for password errors
      else if (
        errorString.includes("password is incorrect") ||
        errorString.includes("invalid password") ||
        errorString.includes("password")
      ) {
        errorMessage = "Password is incorrect";
      } 
      // Check for blocked/inactive account errors
      else if (
        errorString.includes("user is blocked") ||
        errorString.includes("account inactive") ||
        errorString.includes("blocked") ||
        errorString.includes("inactive")
      ) {
        errorMessage = "User is blocked - Your account is inactive. Please contact administrator to activate your account.";
      } 
      // Use the error message as-is if it's already user-friendly
      else if (message && message.length > 0 && !message.includes("Server Action")) {
        errorMessage = message;
      }
    }
    
    return {
      status: false,
      message: errorMessage,
    };
  }
}

export async function logout() {
  try {
    await signOut({
      redirect: false,
      redirectTo: "/en/login",
    });
    return { status: true, message: "successfully logout" };
  } catch {
    return { status: false, message: "failed to logout" };
  }
}

export async function changeUsername({ username }: UsernameSchema) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("");

  const otherUser = await prisma.user.findFirst({ where: { username } });
  if (!otherUser) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
    });
    return { status: true, message: "username successfully changed" };
  } else if (otherUser.id == session.user.id) {
    return { status: false, message: "this one is your username already" };
  } else return { status: false, message: "username is taken by other user" };
}

export async function changePassword({
  password,
  confirmPassword,
}: PasswordSchema) {
  if (password === confirmPassword) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: await bcrypt.hash(password, 12) },
    });
    return { status: true, message: "password successfully changed" };
  }
  return { status: false, message: "password didn't match" };
}
