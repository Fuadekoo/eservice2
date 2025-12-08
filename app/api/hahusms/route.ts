import { NextRequest, NextResponse } from "next/server";
import { sendHahuSMS } from "@/lib/utils/hahu-sms";

/**
 * POST - Send SMS using Hahu SMS API
 * Body: { phone: string, message: string }
 *
 * Environment variables required:
 * - API_SECRET: Hahu API secret
 * - API_MODE: Hahu API mode
 * - API_DEVICE: Hahu device ID
 *
 * Example usage:
 * ```typescript
 * const response = await fetch('/api/hahusms', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     phone: '+251912345678',
 *     message: 'Your message here'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    // Validate required fields
    if (!phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and message are required",
        },
        { status: 400 }
      );
    }

    // Send SMS using Hahu API
    const result = await sendHahuSMS(phone, message);

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error in Hahu SMS API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send SMS",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Send single SMS (for backward compatibility with PHP method signature)
 * Query params: phone, message
 *
 * Example usage:
 * /api/hahusms?phone=+251912345678&message=Hello
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const message = searchParams.get("message");

    if (!phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and message are required as query parameters",
        },
        { status: 400 }
      );
    }

    // Send SMS using Hahu API
    const result = await sendHahuSMS(phone, message);

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error in Hahu SMS API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send SMS",
      },
      { status: 500 }
    );
  }
}
