import { NextRequest, NextResponse } from "next/server";
import { verifyHahuOTP } from "@/lib/utils/hahu-sms";

/**
 * POST - Verify OTP code using Hahu OTP Verification API
 * Body: { code: string | number }
 *
 * This endpoint verifies the OTP code using Hahu's verification API.
 * Note: phoneNumber is optional since Hahu verifies OTP directly.
 *
 * Example usage:
 * ```typescript
 * const response = await fetch('/api/hahusms/verify-otp', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     code: '123456'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "OTP code is required" },
        { status: 400 }
      );
    }

    // Verify OTP using Hahu API
    const result = await verifyHahuOTP(code);

    // Check if verification was successful
    // Hahu API returns: { status: 200, message: 'OTP has been verified!', data: false }
    // We check for status 200 and success message
    const isValid =
      result.status === 200 ||
      result.status === "200" ||
      result.valid === true ||
      result.success === true ||
      result.status === "valid" ||
      result.status === "success" ||
      (result.message &&
        (result.message.toLowerCase().includes("verified") ||
          result.message.toLowerCase().includes("success"))) ||
      (result.data &&
        (result.data.valid === true || result.data.success === true));

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Invalid or expired OTP code",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error in verifyOTP:", error);

    // Handle specific error cases
    if (error.message?.includes("not configured")) {
      return NextResponse.json(
        {
          success: false,
          error: "OTP verification service is not configured",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to verify OTP",
      },
      { status: 500 }
    );
  }
}
