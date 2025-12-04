import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api/api-permissions";
import { randomUUID } from "crypto";

/**
 * GET - Get all staff assigned to a service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;

    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
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
                    name: true,
                    email: true,
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

    return NextResponse.json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          officeId: service.officeId,
        },
        assignedStaff: service.staffAssignments.map((assignment) => ({
          id: assignment.staff.id,
          userId: assignment.staff.userId,
          userName: assignment.staff.user.name,
          userEmail: assignment.staff.user.email,
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
 * POST - Assign staff to a service
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

    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or manager
    const isAdmin =
      user.role?.name?.toLowerCase() === "admin" ||
      user.role?.name?.toLowerCase() === "administrator";
    const isManager =
      user.role?.name?.toLowerCase() === "manager" ||
      user.role?.name?.toLowerCase() === "office_manager";

    if (!isAdmin && !isManager) {
      return NextResponse.json(
        {
          success: false,
          error: "Only office managers and admins can assign services to staff",
        },
        { status: 403 }
      );
    }

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
        where: { userId: user.id },
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
                    name: true,
                    email: true,
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
        assignments: assignments.map((a) => ({
          id: a.id,
          staffId: a.staffId,
          staffName: a.staff.user.name,
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
 * DELETE - Remove staff assignment from a service
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

    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or manager
    const isAdmin =
      user.role?.name?.toLowerCase() === "admin" ||
      user.role?.name?.toLowerCase() === "administrator";
    const isManager =
      user.role?.name?.toLowerCase() === "manager" ||
      user.role?.name?.toLowerCase() === "office_manager";

    if (!isAdmin && !isManager) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only office managers and admins can remove service assignments",
        },
        { status: 403 }
      );
    }

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
        where: { userId: user.id },
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
