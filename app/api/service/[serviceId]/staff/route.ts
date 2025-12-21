import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { randomUUID } from "crypto";

/**
 * GET - Get all staff assigned to a service (requires service:read permission)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;

    // Check permission
    const { response, userId } = await requirePermission(request, "service:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get service with assignments
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        office: true,
        staffAssignments: {
          include: {
            staff: {
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
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this service's office
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const roleName = dbUser?.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";
    const isManager = roleName === "manager" || roleName === "office_manager";

    // If user is admin or manager, verify they belong to the same office as the service
    if (isAdmin || isManager) {
      const userStaff = await prisma.staff.findFirst({
        where: { userId: userId },
        select: { officeId: true },
      });

      if (userStaff && service.officeId !== userStaff.officeId) {
        return NextResponse.json(
          { success: false, error: "Access denied. You can only view staff assignments for services from your office" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          officeId: service.officeId,
        },
        assignedStaff: service.staffAssignments.map((assignment: any) => ({
          id: assignment.staff.id,
          userId: assignment.staff.userId,
          userName: assignment.staff.user.username, // Use username as name
          userEmail: null, // User model doesn't have email
          userPhone: assignment.staff.user.phoneNumber,
          officeId: assignment.staff.officeId,
          assignedAt: assignment.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching service staff assignments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch service staff assignments",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Assign staff to a service (requires service:assign-staff permission)
 * Body: { staffIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;
    const body = await request.json();
    const { staffIds } = body;

    // Check permission
    const { response, userId } = await requirePermission(request, "service:assign-staff");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database (for office verification)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Check if user is admin or manager (for office verification)
    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";
    const isManager = roleName === "manager" || roleName === "office_manager";

    // Validate input
    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "staffIds array is required" },
        { status: 400 }
      );
    }

    // Get service and verify it exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { office: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // If user is manager (not admin), verify they belong to the same office
    if (!isAdmin) {
      const managerStaff = await prisma.staff.findFirst({
        where: { userId: userId },
      });

      if (!managerStaff || managerStaff.officeId !== service.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only assign services from your own office",
          },
          { status: 403 }
        );
      }
    }

    // Get all staff records and verify they belong to the same office as the service
    const staffRecords = await prisma.staff.findMany({
      where: {
        id: { in: staffIds },
      },
      include: {
        office: true,
        user: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Verify all staff belong to the same office as the service
    const invalidStaff = staffRecords.filter(
      (staff) => staff.officeId !== service.officeId
    );

    if (invalidStaff.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Staff must belong to the same office as the service. Service office: ${service.office.name}`,
          invalidStaffIds: invalidStaff.map((s) => s.id),
        },
        { status: 400 }
      );
    }

    // Allow staff, managers, and admins to be assigned to services
    // (Admin can assign anyone from their office to services)
    // No role restrictions needed

    // Remove existing assignments for this service
    await prisma.serviceStaffAssignment.deleteMany({
      where: { serviceId },
    });

    // Create new assignments
    const assignments = await Promise.all(
      staffIds.map((staffId: string) =>
        prisma.serviceStaffAssignment.create({
          data: {
            id: randomUUID(),
            serviceId,
            staffId,
          },
          include: {
            staff: {
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
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully assigned service to ${assignments.length} staff member(s)`,
      data: {
        serviceId,
        assignments: assignments.map((a: any) => ({
          id: a.id,
          staffId: a.staffId,
          staffName: a.staff.user.username, // Use username as name
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Error assigning staff to service:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assign staff to service",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove staff assignment from a service (requires service:assign-staff permission)
 * Query params: staffId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    // Check permission
    const { response, userId } = await requirePermission(request, "service:assign-staff");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database (for office verification)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Check if user is admin or manager (for office verification)
    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";
    const isManager = roleName === "manager" || roleName === "office_manager";

    // Validate input
    if (!staffId) {
      return NextResponse.json(
        { success: false, error: "staffId query parameter is required" },
        { status: 400 }
      );
    }

    // Get service and verify it exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { office: true },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // If user is manager (not admin), verify they belong to the same office
    if (!isAdmin) {
      const managerStaff = await prisma.staff.findFirst({
        where: { userId: userId },
      });

      if (!managerStaff || managerStaff.officeId !== service.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only manage services from your own office",
          },
          { status: 403 }
        );
      }
    }

    // Delete the assignment
    const deleted = await prisma.serviceStaffAssignment.deleteMany({
      where: {
        serviceId,
        staffId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully removed staff assignment from service",
    });
  } catch (error: any) {
    console.error("❌ Error removing staff assignment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to remove staff assignment",
      },
      { status: 500 }
    );
  }
}
