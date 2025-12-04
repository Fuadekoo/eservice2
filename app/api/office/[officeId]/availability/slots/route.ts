import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  getAvailableTimeSlots,
  formatDate,
  type OfficeAvailabilityConfig,
} from "@/lib/office-availability";

/**
 * GET - Get available time slots for a specific date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Get availability configuration
    let availability = await prisma.officeAvailability.findUnique({
      where: { officeId },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Office availability not configured" },
        { status: 404 }
      );
    }

    const config: OfficeAvailabilityConfig = {
      defaultSchedule: availability.defaultSchedule as Record<string, any>,
      slotDuration: availability.slotDuration,
      unavailableDateRanges: availability.unavailableDateRanges as any[],
      unavailableDates: availability.unavailableDates as string[],
      dateOverrides: availability.dateOverrides as Record<string, any>,
    };

    // Get booked appointments for this date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        request: {
          service: {
            officeId,
          },
        },
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: "cancelled",
        },
      },
      select: {
        time: true,
        id: true,
      },
    });

    const bookedSlots = appointments
      .map((apt: { time: string | null; id: string }) => apt.time)
      .filter((time: string | null): time is string => time !== null);

    const availableTimeSlots = getAvailableTimeSlots(
      targetDate,
      config,
      bookedSlots
    );

    // Convert TimeSlot[] to string[] for backward compatibility
    const availableSlots = availableTimeSlots.map((slot) => slot.start);

    return NextResponse.json({
      date: formatDate(targetDate),
      availableSlots,
      bookedSlots,
      totalSlots: availableSlots.length,
    });
  } catch (error: any) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
