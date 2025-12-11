import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import { sendSMS } from "@/lib/utils/sms";

// POST - Send OTP to phone number
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log("📱 Generating OTP for:", normalizedPhone);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // Find or create OTP record
    let otp = await prisma.otp.findFirst({
      where: { phoneNumber: normalizedPhone },
    });

    if (otp) {
      otp = await prisma.otp.update({
        where: { id: otp.id },
        data: { code: otpCode },
      });
      console.log("✅ OTP updated in database");
    } else {
      otp = await prisma.otp.create({
        data: {
          phoneNumber: normalizedPhone,
          code: otpCode,
        },
      });
      console.log("✅ OTP created in database");
    }

    // Try to send SMS
    try {
      await sendSMS(
        normalizedPhone,
        `Your one-time OTP code is: ${otp.code}\n\nDo not share your OTP with anyone\n\nThank you for choosing US!`
      );
      console.log("✅ OTP SMS sent successfully to:", normalizedPhone);
      console.log("🔑 OTP Code:", otp.code);
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (smsError) {
      console.error("❌ Failed to send SMS:", smsError);
      // Still return success because OTP is generated and saved
      // The user can still verify with the OTP code
      console.log("⚠️ SMS failed but OTP is saved. OTP Code:", otp.code);
      return NextResponse.json({
        success: true,
        message:
          "OTP generated (SMS may not have been sent - check console for code)",
        otpCode: otp.code, // Include OTP in response for development
      });
    }
  } catch (error: any) {
    console.error("❌ Error in sendOTP:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send OTP",
      },
      { status: 500 }
    );
  }
}
