/**
 * Utility functions for managing office availability and time slots
 */

export interface TimeSlot {
  start: string; // Format: "HH:MM" (e.g., "09:00")
  end: string; // Format: "HH:MM" (e.g., "09:30")
  available: boolean;
}

export interface DaySchedule {
  start: string; // Format: "HH:MM"
  end: string; // Format: "HH:MM"
  available: boolean;
}

export interface UnavailableDateRange {
  start: string; // Format: "YYYY-MM-DD"
  end: string; // Format: "YYYY-MM-DD"
  reason?: string;
}

export interface OfficeAvailabilityConfig {
  defaultSchedule: Record<string, DaySchedule>; // Day of week (0-6) -> schedule
  slotDuration: number; // Minutes
  unavailableDateRanges: UnavailableDateRange[];
  unavailableDates: string[]; // Format: "YYYY-MM-DD"
  dateOverrides: Record<string, DaySchedule>; // Date -> schedule
}

/**
 * Generate time slots for a given day based on schedule
 */
export function generateTimeSlots(
  schedule: DaySchedule,
  slotDuration: number
): TimeSlot[] {
  if (!schedule.available) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const [startHour, startMinute] = schedule.start.split(":").map(Number);
  const [endHour, endMinute] = schedule.end.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  let currentMinutes = startMinutes;

  while (currentMinutes + slotDuration <= endMinutes) {
    const slotStart = formatTime(currentMinutes);
    const slotEnd = formatTime(currentMinutes + slotDuration);
    slots.push({
      start: slotStart,
      end: slotEnd,
      available: true,
    });
    currentMinutes += slotDuration;
  }

  return slots;
}

/**
 * Format minutes since midnight to "HH:MM" format
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Check if a date is in an unavailable date range
 */
export function isDateInUnavailableRange(
  date: Date,
  ranges: UnavailableDateRange[]
): boolean {
  const dateStr = formatDate(date);
  return ranges.some((range) => {
    return dateStr >= range.start && dateStr <= range.end;
  });
}

/**
 * Check if a date is in the unavailable dates list
 */
export function isDateUnavailable(
  date: Date,
  unavailableDates: string[]
): boolean {
  const dateStr = formatDate(date);
  return unavailableDates.includes(dateStr);
}

/**
 * Format date to "YYYY-MM-DD" format
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get available time slots for a specific date
 */
export function getAvailableTimeSlots(
  date: Date,
  config: OfficeAvailabilityConfig,
  bookedSlots: string[] = [] // Array of booked time slots in "HH:MM" format
): TimeSlot[] {
  const dateStr = formatDate(date);

  // Check if date is in unavailable range
  if (isDateInUnavailableRange(date, config.unavailableDateRanges)) {
    return [];
  }

  // Check if date is specifically unavailable
  if (isDateUnavailable(date, config.unavailableDates)) {
    return [];
  }

  // Get schedule for this date
  let schedule: DaySchedule | null = null;

  // Check for date override first
  if (config.dateOverrides[dateStr]) {
    schedule = config.dateOverrides[dateStr];
  } else {
    // Use default schedule for day of week
    const dayOfWeek = getDayOfWeek(date).toString();
    schedule = config.defaultSchedule[dayOfWeek] || null;
  }

  if (!schedule || !schedule.available) {
    return [];
  }

  // Generate all possible slots
  const allSlots = generateTimeSlots(schedule, config.slotDuration);

  // Filter out booked slots
  return allSlots.filter(
    (slot) => !bookedSlots.includes(slot.start)
  );
}

/**
 * Get default schedule (Monday-Friday, 9am-5pm)
 */
export function getDefaultSchedule(): Record<string, DaySchedule> {
  return {
    "1": { start: "09:00", end: "17:00", available: true }, // Monday
    "2": { start: "09:00", end: "17:00", available: true }, // Tuesday
    "3": { start: "09:00", end: "17:00", available: true }, // Wednesday
    "4": { start: "09:00", end: "17:00", available: true }, // Thursday
    "5": { start: "09:00", end: "17:00", available: true }, // Friday
    "0": { start: "09:00", end: "17:00", available: false }, // Sunday
    "6": { start: "09:00", end: "17:00", available: false }, // Saturday
  };
}

/**
 * Validate time slot format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

