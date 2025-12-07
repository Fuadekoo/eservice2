/**
 * Send SMS using the configured SMS API
 * This is a server-side utility function
 */
export async function sendSMS(to: string, message: string) {
  const smsApi = process.env.SMS_API;
  const smsToken = process.env.SMS_TOKEN;

  if (!smsApi) {
    console.error("❌ SMS_API is not configured in environment variables");
    throw new Error("SMS API not configured");
  }

  if (!smsToken) {
    console.error("❌ SMS_TOKEN is not configured in environment variables");
    throw new Error("SMS Token not configured");
  }

  console.log("📤 Sending SMS to:", to);
  console.log("📤 SMS API:", smsApi);

  try {
    const response = await fetch(smsApi, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${smsToken}`,
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.IDENTIFIER_ID,
        sender: process.env.SENDER_NAME || "E-Service",
        to,
        message,
        callback: process.env.CALLBACK,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ SMS API Error:", response.status, errorText);
      throw new Error(`SMS API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ SMS sent successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
    throw error;
  }
}

