import prisma from "@/lib/db";
import { getPagePermission } from "./page-permissions";

/**
 * Check if a user has permission to access a specific page
 * @param userId - User ID
 * @param role - User role
 * @param path - Page path (relative to role dashboard)
 * @returns Object with allowed status and error message if not allowed
 */
export async function checkPagePermission(
  userId: string,
  role: string,
  path: string
): Promise<{ allowed: boolean; error?: string; permission?: string | string[] }> {
  try {
    // Get required permission for the page
    const requiredPermission = getPagePermission(role, path);

    // If no permission required, allow access
    if (!requiredPermission) {
      return { allowed: true };
    }

    // Get user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { allowed: false, error: "User not found" };
    }

    if (!user.isActive) {
      return { allowed: false, error: "User account is inactive" };
    }

    if (!user.roleId || !user.role) {
      return { allowed: false, error: "User has no role assigned" };
    }

    // Get user's permission names
    const userPermissions = new Set(
      user.role.rolePermissions.map((rp) => rp.permission.name)
    );

    // Check if user has any of the required permissions
    const permissionsToCheck = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    const hasPermission = permissionsToCheck.some((perm) =>
      userPermissions.has(perm)
    );

    if (!hasPermission) {
      return {
        allowed: false,
        error: `Permission required: ${permissionsToCheck.join(" or ")}`,
        permission: requiredPermission,
      };
    }

    return { allowed: true, permission: requiredPermission };
  } catch (error: any) {
    console.error("Error checking page permission:", error);
    return {
      allowed: false,
      error: error.message || "Error checking permission",
    };
  }
}

