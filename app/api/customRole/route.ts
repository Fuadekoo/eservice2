import { NextRequest, NextResponse } from "next/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api/api-permissions";

// POST - Create a custom role for an office
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is manager
    const isManager =
      authUser.role?.name?.toLowerCase() === "manager" ||
      authUser.role?.name?.toLowerCase() === "office_manager";
    const isAdmin =
      authUser.role?.name?.toLowerCase() === "admin" ||
      authUser.role?.name?.toLowerCase() === "administrator";

    const body = await request.json();
    const { name, officeId, permissionIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Role name is required" },
        { status: 400 }
      );
    }

    if (!officeId) {
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    // Validate office exists
    const office = await executeWithRetry(
      () => prisma.office.findUnique({ where: { id: officeId } }),
      2,
      10000
    );

    if (!office) {
      return NextResponse.json(
        { success: false, error: "Office not found" },
        { status: 404 }
      );
    }

    // Check if trying to create a manager role (only admins can do this)
    const roleNameUpper = name.toUpperCase().trim();
    if (
      roleNameUpper === "MANAGER" ||
      roleNameUpper === "OFFICE_MANAGER" ||
      roleNameUpper === "OFFICEMANAGER" ||
      roleNameUpper === "OFFICE MANAGER" ||
      roleNameUpper === "ADMIN" ||
      roleNameUpper === "ADMINISTRATOR"
    ) {
      if (isManager && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "Manager and Admin roles can only be created by administrators",
          },
          { status: 403 }
        );
      }
    }

    // If manager, ensure they can only create roles for their office
    if (isManager && !isAdmin) {
      // Get manager's office ID
      const managerStaff = await prisma.staff.findFirst({
        where: { userId: authUser.id },
        select: { officeId: true },
      });

      if (!managerStaff?.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Manager must be assigned to an office",
          },
          { status: 403 }
        );
      }

      // Managers can only create roles for their own office
      if (officeId !== managerStaff.officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Managers can only create roles for their own office",
          },
          { status: 403 }
        );
      }
    }

    // Check if role with same name already exists for this office
    const existingRole = await executeWithRetry(
      () =>
        prisma.role.findFirst({
          where: {
            name: roleNameUpper,
            officeId: officeId,
          },
        }),
      2,
      10000
    );

    if (existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: `Role "${name}" already exists for this office`,
        },
        { status: 400 }
      );
    }

    // Create role with permissions in a transaction
    const role = await executeWithRetry(
      async () => {
        return await prisma.$transaction(async (tx) => {
          // Create the role
          const newRole = await tx.role.create({
            data: {
              name: roleNameUpper,
              officeId: officeId,
            },
          });

          // Add permissions if provided
          if (
            permissionIds &&
            Array.isArray(permissionIds) &&
            permissionIds.length > 0
          ) {
            // Validate all permissions exist
            const permissions = await tx.permission.findMany({
              where: {
                id: { in: permissionIds },
              },
            });

            if (permissions.length !== permissionIds.length) {
              throw new Error("One or more permissions not found");
            }

            // Create role-permission relationships
            await tx.rolePermission.createMany({
              data: permissionIds.map((permissionId: string) => ({
                roleId: newRole.id,
                permissionId,
              })),
            });
          }

          return newRole;
        });
      },
      2,
      10000
    );

    console.log(`✅ Successfully created custom role: ${role.id}`);

    // Fetch the created role with all relations
    const createdRole = await executeWithRetry(
      () =>
        prisma.role.findUnique({
          where: { id: role.id },
          include: {
            office: {
              select: {
                id: true,
                name: true,
              },
            },
            rolePermissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            users: {
              select: {
                id: true,
              },
            },
          },
        }),
      2,
      10000
    );

    if (!createdRole) {
      throw new Error("Failed to fetch created role");
    }

    // Serialize and format
    const serializedRole = {
      id: createdRole.id,
      name: createdRole.name,
      officeId: createdRole.officeId,
      office: createdRole.office,
      createdAt: createdRole.createdAt.toISOString(),
      updatedAt: createdRole.updatedAt.toISOString(),
      permissions: createdRole.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
      })),
      permissionCount: createdRole.rolePermissions.length,
      userCount: createdRole.users.length,
    };

    return NextResponse.json({ success: true, data: serializedRole });
  } catch (error: any) {
    console.error("❌ Error creating custom role:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create custom role",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET - Get all permissions (for the custom role form)
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all permissions
    const permissions = await executeWithRetry(
      () =>
        prisma.permission.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
          },
        }),
      1,
      5000
    );

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error("❌ Error fetching permissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch permissions",
      },
      { status: 500 }
    );
  }
}

