import { NextRequest, NextResponse } from "next/server";
import { signIn, CustomError } from "@/auth";
import { loginSchema } from "@/lib/zodSchema";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate a user with phone number and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - password
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User phone number (Ethiopian format)
 *                 example: "0912345678"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully logged in"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials. Please try again."
 *                 error:
 *                   type: string
 *                   example: "Invalid credentials. Please try again."
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = await loginSchema.parseAsync(body);

    // Attempt to sign in
    await signIn("credentials", { ...validatedData, redirect: false });

    return NextResponse.json(
      {
        success: true,
        status: true,
        message: "Successfully logged in",
      },
      { status: 200 }
    );
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
        errorMessage =
          "User is blocked - Your account is inactive. Please contact administrator to activate your account.";
      }
      // Use the error message as-is if it's already user-friendly
      else if (
        message &&
        message.length > 0 &&
        !message.includes("Server Action")
      ) {
        errorMessage = message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        status: false,
        message: errorMessage,
        error: errorMessage,
      },
      { status: 401 }
    );
  }
}
