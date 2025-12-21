import { auth } from "@/auth";
import prisma from "@/lib/db";
import { checkPermission } from "./rbac";
import { getDashboardPagePermission } from "./dashboard-permissions";

/**
 * Check if user has permission to access a dashboard page
 * @param role - User role (admin, manager, staff, customer)
 * @param pagePath - Page path relative to role folder
 * @returns Object with allowed status, user info, and error message
 */
export async function checkDashboardPageAccess(
  role: string,
  pagePath: string
): Promise<{
  allowed: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        allowed: false,
        error: "Unauthorized - Please log in",
      };
    }

    const userId = session.user.id;

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
      return {
        allowed: false,
        userId,
        error: "User not found",
      };
    }

    if (!user.isActive) {
      return {
        allowed: false,
        userId,
        error: "User account is inactive",
      };
    }

    if (!user.roleId || !user.role) {
      return {
        allowed: false,
        userId,
        error: "User has no role assigned",
      };
    }

    // Verify role matches
    const userRoleName = user.role.name.toLowerCase();
    if (userRoleName !== role.toLowerCase()) {
      return {
        allowed: false,
        userId,
        error: `Access denied - This page is for ${role} role only`,
      };
    }

    // Get required permission for this page
    const requiredPermission = getDashboardPagePermission(role, pagePath);

    // If no specific permission is required, allow access (basic role check passed)
    if (!requiredPermission) {
      return {
        allowed: true,
        userId,
      };
    }

    // Check if user has the required permission
    const permissionsToCheck = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    // Check if user has any of the required permissions (OR logic)
    const hasPermission = user.role.rolePermissions.some((rp) =>
      permissionsToCheck.includes(rp.permission.name)
    );

    if (!hasPermission) {
      return {
        allowed: false,
        userId,
        error: `Permission required: ${permissionsToCheck.join(" or ")}`,
      };
    }

    return {
      allowed: true,
      userId,
    };
  } catch (error: any) {
    console.error("Error checking dashboard page access:", error);
    return {
      allowed: false,
      error: error.message || "Error checking access",
    };
  }
}

/**
 * Check if user has permission using permission name directly
 * @param permissionName - Permission name to check
 * @returns Object with allowed status and error message
 */
export async function checkPagePermission(
  permissionName: string | string[]
): Promise<{
  allowed: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        allowed: false,
        error: "Unauthorized - Please log in",
      };
    }

    const userId = session.user.id;
    const permissionsToCheck = Array.isArray(permissionName)
      ? permissionName
      : [permissionName];

    // Check if user has any of the required permissions
    for (const permission of permissionsToCheck) {
      const result = await checkPermission(userId, permission);
      if (result.allowed) {
        return {
          allowed: true,
          userId,
        };
      }
    }

    return {
      allowed: false,
      userId,
      error: `Permission required: ${permissionsToCheck.join(" or ")}`,
    };
  } catch (error: any) {
    console.error("Error checking page permission:", error);
    return {
      allowed: false,
      error: error.message || "Error checking permission",
    };
  }
}

