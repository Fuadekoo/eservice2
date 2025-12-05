/**
 * Normalize phone number to Ethiopian format (+251XXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If starts with country code 251, keep it; otherwise assume it's local
  if (cleaned.startsWith("251")) {
    return `+${cleaned}`;
  }
  
  // If starts with 0, remove it and add country code
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  return `+251${cleaned}`;
}

/**
 * Validate Ethiopian phone number
 */
export function isValidEthiopianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Ethiopian phone numbers: +251XXXXXXXXX (10 digits after country code)
  const phoneRegex = /^\+251\d{9}$/;
  return phoneRegex.test(normalized);
}

