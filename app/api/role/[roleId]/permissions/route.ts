import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { assignDefaultPermissionsToRole, getRolePermissions } from "@/lib/role-permissions-assignment";

/**
 * GET - Get permissions for a role (requires role:read permission)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> | { roleId: string } }
) {
  try {
    // Check permission
    const { response } = await requirePermission(request, "role:read");
    if (response) return response;

    const resolvedParams = await Promise.resolve(params);
    const roleId = resolvedParams.roleId;

    // Get role with permissions
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Get all permissions to show which ones are not assigned
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    const assignedPermissionIds = new Set(
      role.rolePermissions.map((rp) => rp.permissionId)
    );

    // Get expected permissions for this role type
    const expectedPermissions = getRolePermissions(role.name);
    const expectedPermissionNames = new Set(expectedPermissions);
    
    // Get all expected permissions from database
    const expectedPermissionRecords = allPermissions.filter((p) =>
      expectedPermissionNames.has(p.name)
    );

    // Check if role has full permissions (all expected permissions are assigned)
    const hasFullPermissions =
      expectedPermissionRecords.length > 0 &&
      expectedPermissionRecords.every((p) => assignedPermissionIds.has(p.id));

    return NextResponse.json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          officeId: role.officeId,
        },
        assignedPermissions: role.rolePermissions.map((rp) => rp.permission),
        allPermissions: allPermissions.map((perm) => ({
          ...perm,
          assigned: assignedPermissionIds.has(perm.id),
          expected: expectedPermissionNames.has(perm.name),
        })),
        hasFullPermissions,
        expectedPermissionCount: expectedPermissionRecords.length,
        assignedPermissionCount: role.rolePermissions.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching role permissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch role permissions",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Assign permissions to a role (requires role:assign-permissions permission)
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

    const body = await request.json();
    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { success: false, error: "permissionIds must be an array" },
        { status: 400 }
      );
    }

    // Get role to check if it's admin
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

    const roleName = role.name.toLowerCase().trim();
    const isAdminRole = roleName === "admin" || roleName === "administrator";

    // If admin role, don't allow removing permissions (should have all permissions)
    if (isAdminRole) {
      // Get all permissions
      const allPermissions = await prisma.permission.findMany({
        select: { id: true },
      });
      
      // Ensure admin has all permissions
      const allPermissionIds = allPermissions.map((p) => p.id);
      const finalPermissionIds = Array.from(
        new Set([...allPermissionIds, ...permissionIds])
      );

      // Validate permissions exist
      const permissions = await prisma.permission.findMany({
        where: { id: { in: finalPermissionIds } },
      });

      if (permissions.length !== finalPermissionIds.length) {
        return NextResponse.json(
          { success: false, error: "One or more permissions not found" },
          { status: 400 }
        );
      }

      // Delete all existing role permissions and create new ones
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      await prisma.rolePermission.createMany({
        data: permissions.map((perm) => ({
          roleId,
          permissionId: perm.id,
        })),
        skipDuplicates: true,
      });

      return NextResponse.json({
        success: true,
        message: "Admin role permissions updated (admin roles must have all permissions)",
        data: {
          roleId,
          permissionCount: permissions.length,
        },
      });
    }

    // For non-admin roles, update permissions normally
    // Validate permissions exist
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more permissions not found" },
        { status: 400 }
      );
    }

    // Delete all existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new role permissions
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((perm) => ({
          roleId,
          permissionId: perm.id,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
      data: {
        roleId,
        permissionCount: permissions.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Error assigning role permissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assign role permissions",
      },
      { status: 500 }
    );
  }
}

