import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/rbac";
import { randomUUID } from "crypto";

/**
 * GET - Get a single service by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;

    // Authenticate user (optional for public access)
    const session = await auth();

    // If user is authenticated, check permission and verify office access
    if (session?.user) {
      // Check permission for authenticated users
      const { response, userId } = await requirePermission(request, "service:read");
      if (response) return response;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Get user with role from database
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      const roleName = dbUser?.role?.name?.toLowerCase() || "";
      const isAdmin = roleName === "admin" || roleName === "administrator";
      const isManager = roleName === "manager" || roleName === "office_manager";

      // If user is admin or manager, verify they belong to the same office as the service
      if (isAdmin || isManager) {
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
          select: { officeId: true },
        });

        if (service) {
          const userStaff = await prisma.staff.findFirst({
            where: { userId: userId },
            select: { officeId: true },
          });

          if (userStaff && service.officeId !== userStaff.officeId) {
            return NextResponse.json(
              { success: false, error: "Access denied. You can only view services from your office" },
              { status: 403 }
            );
          }
        }
      }
    }

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
                    username: true,
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

    // Only allow access to active offices
    if (!service.office.status) {
      return NextResponse.json(
        { success: false, error: "Service office is not active" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...service,
        assignedStaff: service.staffAssignments.map((assignment: any) => ({
          id: assignment.staff.id,
          userId: assignment.staff.userId,
          name: assignment.staff.user.username, // Use username as name
          email: null, // User model doesn't have email
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
 * PATCH - Update a service (requires service:update permission)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;

    // Check permission
    const { response, userId } = await requirePermission(request, "service:update");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database
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

    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";

    const body = await request.json();
    const {
      name,
      description,
      timeToTake,
      officeId,
      requirements,
      serviceFors,
    } = body;

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
        where: { userId: userId },
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

    // Handle requirements update
    if (requirements !== undefined && Array.isArray(requirements)) {
      // Delete existing requirements
      await prisma.requirement.deleteMany({
        where: { serviceId: serviceId },
      });
      // Create new requirements
      if (requirements.length > 0) {
        updateData.requirements = {
          create: requirements.map((req: any) => ({
            id: randomUUID(),
            name: req.name,
            description: req.description || null,
          })),
        };
      }
    }

    // Handle serviceFors update
    if (serviceFors !== undefined && Array.isArray(serviceFors)) {
      // Delete existing serviceFors
      await prisma.serviceFor.deleteMany({
        where: { serviceId: serviceId },
      });
      // Create new serviceFors
      if (serviceFors.length > 0) {
        updateData.serviceFors = {
          create: serviceFors.map((sf: any) => ({
            id: randomUUID(),
            name: sf.name,
            description: sf.description || null,
          })),
        };
      }
    }

    const service = await prisma.service.update({
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
        requirements: true,
        serviceFors: true,
      },
    });

    console.log(`✅ Updated service: ${service.id}`);

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error("❌ Error updating service:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }
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
 * DELETE - Delete a service (requires service:delete permission)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> | { serviceId: string } }
) {
  try {
    // Handle params as Promise or object
    const resolvedParams = await Promise.resolve(params);
    const { serviceId } = resolvedParams;

    // Check permission
    const { response, userId } = await requirePermission(request, "service:delete");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with role from database
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

    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isAdmin = roleName === "admin" || roleName === "administrator";

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
        where: { userId: userId },
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
    await prisma.service.delete({ where: { id: serviceId } });

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

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
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
