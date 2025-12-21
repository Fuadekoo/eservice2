import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { assignDefaultPermissionsToRole } from "@/lib/role-permissions-assignment";

/**
 * POST - Assign full permissions to a role based on its type (requires role:assign-permissions permission)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> | { roleId: string } }
) {
  try {
    // Check permission
    const { response } = await requirePermission(request, "role:assign-permissions");
    if (response) return response;

    const resolvedParams = await Promise.resolve(params);
    const roleId = resolvedParams.roleId;

    // Get role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Assign default permissions based on role type
    const result = await assignDefaultPermissionsToRole(roleId, role.name);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to assign permissions",
        },
        { status: 500 }
      );
    }

    // Fetch updated role permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
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
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${result.assignedCount} permissions to role`,
      data: {
        roleId,
        roleName: role.name,
        assignedCount: result.assignedCount,
        totalPermissions: updatedRole?.rolePermissions.length || 0,
      },
    });
  } catch (error: any) {
    console.error("❌ Error assigning full permissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assign full permissions",
      },
      { status: 500 }
    );
  }
}

