import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch a single request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

    // Fetch request with all related data
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        service: {
          include: {
            office: {
              select: {
                id: true,
                name: true,
                roomNumber: true,
                address: true,
                status: true,
              },
            },
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
        approveManager: {
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
        fileData: true,
        appointments: {
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
                  },
                },
              },
            },
          },
        },
        customerSatisfaction: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
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

    // Check if user has access to this request
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const isAdmin =
      dbUser?.role?.name?.toLowerCase() === "admin" ||
      dbUser?.role?.name?.toLowerCase() === "administrator";
    
    const isManager = dbUser?.role?.name?.toLowerCase() === "manager";
    const isStaff = dbUser?.role?.name?.toLowerCase() === "staff";

    // Check access permissions
    if (isAdmin) {
      // Admins can view any request
    } else if (isManager) {
      // Managers can view requests from their office
      const managerStaff = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { officeId: true },
      });

      if (!managerStaff?.officeId) {
        return NextResponse.json(
          { success: false, error: "Manager office not found" },
          { status: 403 }
        );
      }

      if (requestData.service.officeId !== managerStaff.officeId) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    } else if (isStaff) {
      // Staff can view requests for services they're assigned to
      const staffRecord = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!staffRecord) {
        return NextResponse.json(
          { success: false, error: "Staff record not found" },
          { status: 403 }
        );
      }

      // Check if staff is assigned to this service
      const assignment = await prisma.serviceStaffAssignment.findUnique({
        where: {
          serviceId_staffId: {
            serviceId: requestData.serviceId,
            staffId: staffRecord.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    } else {
      // Regular users can only view their own requests
      if (requestData.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Serialize dates
    return NextResponse.json({
      success: true,
      data: {
        ...requestData,
        date: requestData.date.toISOString(),
        createdAt: requestData.createdAt.toISOString(),
        updatedAt: requestData.updatedAt.toISOString(),
        fileData: requestData.fileData.map((file) => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        })),
        appointments: requestData.appointments.map((apt) => ({
          ...apt,
          date: apt.date.toISOString(),
          createdAt: apt.createdAt.toISOString(),
          updatedAt: apt.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch request",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update request (approve/reject by admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const isAdmin =
      dbUser?.role?.name?.toLowerCase() === "admin" ||
      dbUser?.role?.name?.toLowerCase() === "administrator";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only admins can approve requests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { approveNote } = body;

    // Get the request
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Note: Admins can only view requests, not approve/reject them
    // This endpoint is kept for backward compatibility but doesn't update status
    // Status is managed by staff (statusbystaff) and managers (statusbyadmin)
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        approveNote: approveNote || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        service: {
          include: {
            office: {
              select: {
                id: true,
                name: true,
                roomNumber: true,
                address: true,
                status: true,
              },
            },
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
        approveManager: {
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
        fileData: true,
        appointments: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRequest,
        date: updatedRequest.date.toISOString(),
        createdAt: updatedRequest.createdAt.toISOString(),
        updatedAt: updatedRequest.updatedAt.toISOString(),
        fileData: updatedRequest.fileData.map((file) => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        })),
        appointments: updatedRequest.appointments.map((apt) => ({
          ...apt,
          date: apt.date.toISOString(),
          createdAt: apt.createdAt.toISOString(),
          updatedAt: apt.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Error updating request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update request",
      },
      { status: 500 }
    );
  }
}
