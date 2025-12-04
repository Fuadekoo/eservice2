import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  getAvailableTimeSlots,
  getDefaultSchedule,
  formatDate,
  type OfficeAvailabilityConfig,
} from "@/lib/office-availability";

/**
 * GET - Get availability configuration and available slots for a date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    // Get or create availability configuration
    let availability = await prisma.officeAvailability.findUnique({
      where: { officeId },
    });

    if (!availability) {
      // Create default availability
      availability = await prisma.officeAvailability.create({
        data: {
          officeId,
          defaultSchedule: getDefaultSchedule(),
          slotDuration: 30,
          unavailableDateRanges: [],
          unavailableDates: [],
          dateOverrides: {},
        },
      });
    }

    const config: OfficeAvailabilityConfig = {
      defaultSchedule: availability.defaultSchedule as Record<string, any>,
      slotDuration: availability.slotDuration,
      unavailableDateRanges: availability.unavailableDateRanges as any[],
      unavailableDates: availability.unavailableDates as string[],
      dateOverrides: availability.dateOverrides as Record<string, any>,
    };

    // If date is provided, get available slots for that date
    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }

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
        },
      });

      const bookedSlots = appointments
        .map((apt: { time: string | null }) => apt.time)
        .filter((time: string | null): time is string => time !== null);

      const availableSlots = getAvailableTimeSlots(
        targetDate,
        config,
        bookedSlots
      );

      return NextResponse.json({
        config,
        date: formatDate(targetDate),
        availableSlots,
        bookedSlots,
      });
    }

    // Return just the configuration
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update availability configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const body = await request.json();

    const {
      defaultSchedule,
      slotDuration,
      unavailableDateRanges,
      unavailableDates,
      dateOverrides,
    } = body;

    // Validate office exists
    const office = await prisma.office.findUnique({
      where: { id: officeId },
    });

    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    // Update or create availability
    const availability = await prisma.officeAvailability.upsert({
      where: { officeId },
      create: {
        officeId,
        defaultSchedule: defaultSchedule || getDefaultSchedule(),
        slotDuration: slotDuration || 30,
        unavailableDateRanges: unavailableDateRanges || [],
        unavailableDates: unavailableDates || [],
        dateOverrides: dateOverrides || {},
      },
      update: {
        ...(defaultSchedule !== undefined && { defaultSchedule }),
        ...(slotDuration !== undefined && { slotDuration }),
        ...(unavailableDateRanges !== undefined && {
          unavailableDateRanges,
        }),
        ...(unavailableDates !== undefined && { unavailableDates }),
        ...(dateOverrides !== undefined && { dateOverrides }),
      },
    });

    return NextResponse.json({
      success: true,
      availability,
    });
  } catch (error: any) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update availability" },
      { status: 500 }
    );
  }
}
