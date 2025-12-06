import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

// POST - Create a new appointment for an approved request
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();
    const { requestId, date, time, notes, staffId } = body;

    // Validate required fields
    if (!requestId || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "Request ID and date are required",
        },
        { status: 400 }
      );
    }

    // Get the request and verify it's approved
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        service: {
          select: {
            officeId: true,
          },
        },
      },
    });

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Verify request is approved by both staff and manager
    if (
      requestData.statusbystaff !== "approved" ||
      requestData.statusbyadmin !== "approved"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Appointments can only be created for requests approved by both staff and manager",
        },
        { status: 400 }
      );
    }

    // Verify user is manager or staff
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const roleName = dbUser?.role?.name?.toLowerCase() || "";
    const isManager =
      roleName === "manager" || roleName === "office_manager";
    const isStaff = roleName === "staff";

    if (!isManager && !isStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Only managers and staff can create appointments",
        },
        { status: 403 }
      );
    }

    // Get staff record to verify office
    const userStaff = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { id: true, officeId: true },
    });

    if (!userStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff record not found",
        },
        { status: 403 }
      );
    }

    // Verify request belongs to the same office
    if (requestData.service.officeId !== userStaff.officeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Request does not belong to your office",
        },
        { status: 403 }
      );
    }

    // If staffId is provided, verify it exists and belongs to the same office
    let finalStaffId = staffId || userStaff.id;
    if (staffId && staffId !== userStaff.id) {
      const assignedStaff = await prisma.staff.findFirst({
        where: {
          id: staffId,
          officeId: userStaff.officeId,
        },
      });

      if (!assignedStaff) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid staff assignment",
          },
          { status: 400 }
        );
      }
      finalStaffId = assignedStaff.id;
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        id: randomUUID(),
        requestId: requestId,
        date: new Date(date),
        time: time || null,
        status: "pending",
        notes: notes || null,
        userId: requestData.userId,
        staffId: finalStaffId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        approveStaff: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
        request: {
          select: {
            id: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        date: appointment.date.toISOString(),
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      },
      message: "Appointment created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create appointment",
      },
      { status: 500 }
    );
  }
}

// GET - Fetch appointments (optional: filter by requestId)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    const where: any = {};
    if (requestId) {
      where.requestId = requestId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        approveStaff: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
        request: {
          select: {
            id: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: appointments.map((apt) => ({
        ...apt,
        date: apt.date.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("❌ Error fetching appointments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch appointments",
      },
      { status: 500 }
    );
  }
}

