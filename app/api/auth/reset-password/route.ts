import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import bcryptjs from "bcryptjs";

// POST - Reset password using OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode, newPassword } = body;

    // Validate required fields
    if (!phoneNumber || !otpCode || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number, OTP code, and new password are required",
        },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Verify OTP
    const otp = await prisma.otp.findFirst({
      where: { phoneNumber: normalizedPhone },
    });

    if (!otp || otp.code !== parseInt(otpCode)) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found with this phone number" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Delete OTP after successful password reset
    await prisma.otp.deleteMany({
      where: { phoneNumber: normalizedPhone },
    });

    console.log("✅ Password reset successfully for user:", user.id);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("❌ Error in reset-password:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to reset password",
      },
      { status: 500 }
    );
  }
}
