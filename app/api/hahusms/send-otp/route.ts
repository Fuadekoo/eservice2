import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import { sendHahuOTP } from "@/lib/utils/hahu-sms";

/**
 * POST - Send OTP using Hahu OTP API
 * Body: { phoneNumber: string, message?: string, sim?: number, mode?: string }
 *
 * This endpoint uses Hahu's OTP API which automatically generates and sends OTP.
 * The OTP is then saved to the database for verification.
 *
 * Example usage:
 * ```typescript
 * const response = await fetch('/api/hahusms/send-otp', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     phoneNumber: '+251912345678',
 *     message: 'Your OTP is {{otp}}', // optional, default: "Your OTP is {{otp}}"
 *     sim: 1, // optional, default: 1
 *     mode: 'sms' // optional, default: from env or 'sms'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message, sim, mode } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log("📱 Sending OTP to:", normalizedPhone);

    // Send OTP via Hahu OTP API
    // Hahu will generate the OTP automatically
    const result = await sendHahuOTP(normalizedPhone, message, sim || 1, mode);

    // Extract OTP from response (Hahu API returns the generated OTP)
    // The response structure may vary, but typically contains 'otp' or 'code' field
    const otpCode =
      result.otp ||
      result.code ||
      result.data?.otp ||
      result.data?.code ||
      null;

    if (otpCode) {
      // Save OTP to database for verification
      const existingOtp = await prisma.otp.findFirst({
        where: { phoneNumber: normalizedPhone },
      });

      if (existingOtp) {
        await prisma.otp.update({
          where: { id: existingOtp.id },
          data: { code: parseInt(otpCode.toString()) },
        });
        console.log("✅ OTP updated in database");
      } else {
        await prisma.otp.create({
          data: {
            phoneNumber: normalizedPhone,
            code: parseInt(otpCode.toString()),
          },
        });
        console.log("✅ OTP saved to database");
      }
    } else {
      console.warn(
        "⚠️ OTP code not found in Hahu API response. Response:",
        result
      );
    }

    console.log("✅ OTP sent successfully to:", normalizedPhone);
    if (otpCode) {
      console.log("🔑 OTP Code:", otpCode);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      data: result,
    });
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
