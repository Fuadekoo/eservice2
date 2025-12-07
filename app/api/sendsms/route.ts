import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendSMS } from "@/lib/utils/sms";

/**
 * POST - Send SMS
 * This endpoint requires user authentication (any role)
 * Body: { to: string, message: string }
 *
 * Example usage:
 * ```typescript
 * const response = await fetch('/api/sendsms', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     to: '+251912345678',
 *     message: 'Your message here'
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (any role)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please login to send SMS",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, message } = body;

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number (to) and message are required",
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (typeof to !== "string" || to.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Validate message
    if (typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Validate message length (SMS typically has a limit)
    if (message.length > 1600) {
      return NextResponse.json(
        { success: false, error: "Message is too long (max 1600 characters)" },
        { status: 400 }
      );
    }

    // Send SMS
    const result = await sendSMS(to.trim(), message.trim());

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error in sendSMS API:", error);

    // Handle specific error types
    if (error.message?.includes("SMS API not configured")) {
      return NextResponse.json(
        {
          success: false,
          error: "SMS service is not configured",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send SMS",
      },
      { status: 500 }
    );
  }
}
