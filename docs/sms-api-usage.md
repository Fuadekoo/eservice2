# SMS API Usage Guide

## Endpoint

`POST /api/sendsms`

## Description

This endpoint allows you to send SMS messages from anywhere in the system. **Authentication is required** - users must be logged in (any role: admin, manager, staff, or customer) to use this endpoint. It can be called from both client-side and server-side code.

## Request Body

```json
{
  "to": "+251912345678",
  "message": "Your message here"
}
```

### Parameters

- `to` (string, required): Phone number in international format (e.g., +251912345678)
- `message` (string, required): SMS message content (max 1600 characters)

## Response

### Success Response (200)

```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": { ... }
}
```

### Error Response (400/500/503)

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Usage Examples

### Client-Side (React/Next.js)

```typescript
const sendSMS = async (phoneNumber: string, message: string) => {
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
      console.log("SMS sent successfully!");
      return result;
    } else {
      console.error("Failed to send SMS:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

// Usage
await sendSMS("+251912345678", "Hello, this is a test message!");
```

### Server-Side (API Route)

```typescript
import { sendSMS } from "@/lib/utils/sms";

// Direct utility function usage
try {
  const result = await sendSMS("+251912345678", "Hello from server!");
  console.log("SMS sent:", result);
} catch (error) {
  console.error("Failed to send SMS:", error);
}
```

### Server-Side (API Route - Using API endpoint)

```typescript
// If you need to call the API endpoint from server-side
const response = await fetch(
  `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/sendsms`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "+251912345678",
      message: "Hello from server API!",
    }),
  }
);

const result = await response.json();
```

## Error Codes

- `401`: Unauthorized - User is not logged in
- `400`: Bad Request - Invalid input (missing fields, invalid format, etc.)
- `500`: Internal Server Error - SMS service error
- `503`: Service Unavailable - SMS service not configured

## Notes

- **Authentication required**: Users must be logged in (any role) to use this endpoint
- Phone numbers should be in international format (e.g., +251912345678)
- Message length is limited to 1600 characters
- For server-side code, prefer using the utility function `sendSMS` from `@/lib/utils/sms` directly
- If you get a 401 error, make sure the user is logged in before calling this endpoint
