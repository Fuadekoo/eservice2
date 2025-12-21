import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission, requireAnyPermission } from "@/lib/rbac";

// GET - Fetch a single request by ID (requires request:read permission)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "request:read");
    if (response) return response;
    if (!userId) {
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
      where: { id: userId },
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
        where: { userId: userId },
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
        where: { userId: userId },
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
      if (requestData.userId !== userId) {
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

// PATCH - Update request (approve/reject by admin) (requires request:update permission)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "request:update");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

    const body = await request.json();
    const { approveNote, statusbyadmin, serviceId, currentAddress, date } = body;

    // Get the request
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Get user role to determine what can be updated
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const isAdmin =
      dbUser?.role?.name?.toLowerCase() === "admin" ||
      dbUser?.role?.name?.toLowerCase() === "administrator";
    const isCustomer =
      dbUser?.role?.name?.toLowerCase() === "customer";

    // Customers can only update their own requests and only certain fields
    if (isCustomer && requestData.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden - You can only update your own requests" },
        { status: 403 }
      );
    }

    // Build update data based on role
    const updateData: any = {};
    
    if (isAdmin) {
      // Admins can update approval status and note
      if (approveNote !== undefined) updateData.approveNote = approveNote || null;
      if (statusbyadmin && ["approved", "rejected", "pending"].includes(statusbyadmin)) {
        updateData.statusbyadmin = statusbyadmin;
      }
    } else if (isCustomer) {
      // Customers can update request details (serviceId, currentAddress, date) for pending requests
      if (requestData.statusbystaff !== "pending" || requestData.statusbyadmin !== "pending") {
        return NextResponse.json(
          { success: false, error: "Cannot update request that is no longer pending" },
          { status: 400 }
        );
      }
      if (serviceId) updateData.serviceId = serviceId;
      if (currentAddress) updateData.currentAddress = currentAddress;
      if (date) updateData.date = new Date(date);
    } else {
      // Other roles (manager, staff) - for now, only allow approveNote
      if (approveNote !== undefined) updateData.approveNote = approveNote || null;
    }
    
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
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
