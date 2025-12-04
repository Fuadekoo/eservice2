import { NextRequest, NextResponse } from "next/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api/api-permissions";

/**
 * GET - Get a single service by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user's office ID
    const userStaff = await prisma.staff.findFirst({
      where: { userId: authUser.id },
      select: { officeId: true },
    });

    if (!userStaff) {
      return NextResponse.json(
        { success: false, error: "User office not found" },
        { status: 403 }
      );
    }

    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
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
        requirements: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        serviceFors: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "asc",
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

    // Verify service belongs to user's office
    if (service.officeId !== userStaff.officeId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...service,
        assignedStaff: service.staffAssignments.map((assignment) => ({
          id: assignment.staff.id,
          userId: assignment.staff.userId,
          name: assignment.staff.user.name,
          email: assignment.staff.user.email,
          phoneNumber: assignment.staff.user.phoneNumber,
        })),
        requirements: service.requirements,
        serviceFors: service.serviceFors,
        staffAssignments: undefined,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching service:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch service",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a service
 */
export async function PATCH(
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
          error: "Only office managers and admins can update services",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, timeToTake, officeId } = body;

    // Get existing service
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { office: true },
    });

    if (!existingService) {
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

      if (!managerStaff || managerStaff.officeId !== existingService.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only update services from your own office",
          },
          { status: 403 }
        );
      }

      // Manager cannot change officeId
      if (officeId && officeId !== existingService.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You cannot change the office of a service",
          },
          { status: 403 }
        );
      }
    }

    // Update service
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (timeToTake !== undefined) updateData.timeToTake = timeToTake;
    if (officeId !== undefined && isAdmin) updateData.officeId = officeId;

    const service = await executeWithRetry(
      () =>
        prisma.service.update({
          where: { id: serviceId },
          data: updateData,
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
        }),
      1,
      10000
    );

    console.log(`✅ Updated service: ${service.id}`);

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error("❌ Error updating service:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update service",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a service
 */
export async function DELETE(
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
          error: "Only office managers and admins can delete services",
        },
        { status: 403 }
      );
    }

    // Get existing service
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { office: true },
    });

    if (!existingService) {
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

      if (!managerStaff || managerStaff.officeId !== existingService.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only delete services from your own office",
          },
          { status: 403 }
        );
      }
    }

    // Delete service (cascade will delete assignments)
    await executeWithRetry(
      () => prisma.service.delete({ where: { id: serviceId } }),
      1,
      10000
    );

    console.log(`✅ Deleted service: ${serviceId}`);

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting service:", error);

    // Check for foreign key constraint (service has requests)
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete service. It has associated requests. Please remove all requests first.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete service",
      },
      { status: 500 }
    );
  }
}
