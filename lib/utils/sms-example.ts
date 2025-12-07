/**
 * Example usage of the SMS API endpoint
 * This file demonstrates how to use the /api/sendsms endpoint from anywhere in the system
 */

/**
 * Example 1: Send SMS from client-side (React component)
 */
export async function sendSMSFromClient(phoneNumber: string, message: string) {
  try {
    const response = await fetch("/api/sendsms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ SMS sent successfully:", result);
      return result;
    } else {
      console.error("❌ Failed to send SMS:", result.error);
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error("❌ Error sending SMS:", error);
    throw error;
  }
}

/**
 * Example 2: Send SMS from server-side API route
 * Import this: import { sendSMS } from '@/lib/utils/sms';
 */
// import { sendSMS } from '@/lib/utils/sms';
//
// export async function POST(request: NextRequest) {
//   try {
//     const { phoneNumber, message } = await request.json();
//     const result = await sendSMS(phoneNumber, message);
//     return NextResponse.json({ success: true, data: result });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }

/**
 * Example 3: Send SMS with error handling and toast notification
 */
export async function sendSMSWithToast(
  phoneNumber: string,
  message: string,
  toast: any
) {
  try {
    const response = await fetch("/api/sendsms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
      }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success("SMS sent successfully");
      return result;
    } else {
      toast.error(result.error || "Failed to send SMS");
      throw new Error(result.error);
    }
  } catch (error: any) {
    toast.error("Error sending SMS: " + error.message);
    throw error;
  }
}
