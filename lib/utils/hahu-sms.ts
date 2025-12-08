/**
 * Send SMS using Hahu SMS API
 * This is a server-side utility function
 */
export async function sendHahuSMS(phone: string, message: string) {
  const apiSecret = process.env.API_SECRET;
  const apiMode = process.env.API_MODE;
  const apiDevice = process.env.API_DEVICE;

  if (!apiSecret || !apiMode || !apiDevice) {
    console.error("❌ Missing required environment variables for Hahu SMS API");
    throw new Error("Hahu SMS API not configured");
  }

  // Prepare request data
  const formData = new URLSearchParams();
  formData.append("secret", apiSecret);
  formData.append("mode", apiMode);
  formData.append("device", apiDevice);
  formData.append("sim", "2");
  formData.append("priority", "1");
  formData.append("phone", phone);
  formData.append("message", message);

  // Send SMS request to Hahu API
  const response = await fetch("https://hahu.io/api/send/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Hahu SMS API Error:", response.status, errorText);
    throw new Error(`Hahu SMS API returned ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ SMS sent successfully via Hahu API:", result);
  return result;
}

/**
 * Send OTP using Hahu OTP API
 * This endpoint generates and sends OTP automatically
 * @param phone - Phone number to send OTP to
 * @param message - Message template with {{otp}} placeholder (optional)
 * @param sim - SIM slot number (default: 1)
 * @param mode - API mode: "sms" or "devices" (default: from env or "sms")
 * @returns Response from Hahu API containing the generated OTP
 */
export async function sendHahuOTP(
  phone: string,
  message?: string,
  sim: number = 1,
  mode?: string
) {
  const apiSecret = process.env.API_SECRET;
  const apiDevice = process.env.API_DEVICE;
  const apiMode = mode || process.env.API_MODE || "devices";

  if (!apiSecret || !apiDevice) {
    console.error("❌ Missing required environment variables for Hahu OTP API");
    throw new Error("Hahu OTP API not configured");
  }

  // Default OTP message template if not provided
  const otpMessage = message || "Your OTP is {{otp}}";

  // Prepare request data
  const formData = new URLSearchParams();
  formData.append("secret", apiSecret);
  formData.append("type", "sms");
  formData.append("mode", apiMode);
  formData.append("device", apiDevice);
  formData.append("sim", sim.toString());
  formData.append("phone", phone);
  formData.append("expire", "60");
  formData.append("message", otpMessage);

  // Send OTP request to Hahu API
  const response = await fetch("https://hahu.io/api/send/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Hahu OTP API Error:", response.status, errorText);
    throw new Error(`Hahu OTP API returned ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ OTP sent successfully via Hahu API:", result);
  return result;
}

/**
 * Verify OTP using Hahu OTP Verification API
 * @param otp - OTP code to verify
 * @returns Response from Hahu API indicating if OTP is valid
 */
export async function verifyHahuOTP(otp: string | number) {
  const apiSecret = process.env.API_SECRET;

  if (!apiSecret) {
    console.error("❌ Missing API_SECRET for Hahu OTP verification");
    throw new Error("Hahu OTP API not configured");
  }

  // Convert OTP to string if it's a number
  const otpString = otp.toString();

  // Build URL with query parameters
  const url = new URL("https://hahu.io/api/get/otp");
  url.searchParams.append("secret", apiSecret);
  url.searchParams.append("otp", otpString);

  // Send GET request to Hahu OTP verification API
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Hahu OTP Verification API Error:", response.status, errorText);
    throw new Error(`Hahu OTP Verification API returned ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ OTP verification response from Hahu API:", result);
  return result;
}

