import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { canStaffApproveService } from "@/lib/service-staff-assignment";

// GET - Fetch appointments for services assigned to the logged-in staff
export async function GET(request: NextRequest) {
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

    // Get user role
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isStaff = dbUser?.role?.name?.toLowerCase() === "staff";

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Only staff can access this endpoint" },
        { status: 403 }
      );
    }

    // Get staff record
    const staffRecord = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { id: true, officeId: true },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 403 }
      );
    }

    const staffId = staffRecord.id;
    const officeId = staffRecord.officeId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      request: {
        service: {
          officeId: officeId,
          staffAssignments: {
            some: {
              staffId: staffId,
            },
          },
        },
      },
    };

    // Filter by status if provided
    if (status && status !== "all") {
      where.status = status;
    }

    // Get appointments with pagination
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
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
              date: true,
              statusbystaff: true,
              statusbyadmin: true,
              service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  office: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      roomNumber: true,
                    },
                  },
                },
              },
              user: {
                select: {
                  id: true,
                  username: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "asc",
        },
        skip,
        take: pageSize,
      }),
      prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: appointments.map((apt) => ({
        ...apt,
        date: apt.date.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
        request: {
          ...apt.request,
          date: apt.request.date.toISOString(),
        },
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Error fetching staff appointments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch appointments",
      },
      { status: 500 }
    );
  }
}

