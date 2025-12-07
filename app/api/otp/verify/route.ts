import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";

// POST - Verify OTP code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, error: "Phone number and OTP code are required" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Find OTP record
    const otp = await prisma.otp.findFirst({
      where: { phoneNumber: normalizedPhone },
    });

    if (!otp) {
      return NextResponse.json(
        { success: false, error: "OTP not found. Please request a new OTP." },
        { status: 404 }
      );
    }

    // Verify OTP code
    if (otp.code !== parseInt(code)) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP code" },
        { status: 400 }
      );
    }

    // OTP verified successfully
    // Optionally delete the OTP after successful verification
    // await prisma.otp.delete({ where: { id: otp.id } });

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error: any) {
    console.error("❌ Error in verifyOTP:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to verify OTP",
      },
      { status: 500 }
    );
  }
}


