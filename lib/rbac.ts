import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

/**
 * RBAC (Role-Based Access Control) Utility
 * 
 * This module provides functions to check user permissions based on their role.
 * Permissions are stored in the database and linked to roles through RolePermission.
 */

export interface PermissionCheckResult {
  allowed: boolean;
  user?: {
    id: string;
    roleId: string | null;
    roleName: string | null;
  };
  error?: string;
}

/**
 * Check if a user has a specific permission
 * @param userId - The user's ID
 * @param permissionName - The permission name (e.g., "user:create", "service:read")
 * @returns PermissionCheckResult with allowed status and user info
 */
export async function checkPermission(
  userId: string,
  permissionName: string
): Promise<PermissionCheckResult> {
  try {
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
        error: "User not found",
      };
    }

    if (!user.isActive) {
      return {
        allowed: false,
        user: {
          id: user.id,
          roleId: user.roleId,
          roleName: user.role?.name || null,
        },
        error: "User is inactive",
      };
    }

    if (!user.roleId || !user.role) {
      return {
        allowed: false,
        user: {
          id: user.id,
          roleId: user.roleId,
          roleName: null,
        },
        error: "User has no role assigned",
      };
    }

    // Check if the role has the required permission
    const hasPermission = user.role.rolePermissions.some(
      (rp) => rp.permission.name === permissionName
    );

    return {
      allowed: hasPermission,
      user: {
        id: user.id,
        roleId: user.roleId,
        roleName: user.role.name,
      },
      error: hasPermission ? undefined : `Permission '${permissionName}' required`,
    };
  } catch (error: any) {
    console.error("Error checking permission:", error);
    return {
      allowed: false,
      error: error.message || "Error checking permission",
    };
  }
}

/**
 * Check if a user has any of the specified permissions (OR logic)
 * @param userId - The user's ID
 * @param permissionNames - Array of permission names
 * @returns PermissionCheckResult with allowed status
 */
export async function checkAnyPermission(
  userId: string,
  permissionNames: string[]
): Promise<PermissionCheckResult> {
  for (const permissionName of permissionNames) {
    const result = await checkPermission(userId, permissionName);
    if (result.allowed) {
      return result;
    }
  }

  // If none matched, return the last result
  const lastResult = await checkPermission(userId, permissionNames[permissionNames.length - 1]);
  return {
    ...lastResult,
    allowed: false,
    error: `At least one of these permissions required: ${permissionNames.join(", ")}`,
  };
}

/**
 * Check if a user has all of the specified permissions (AND logic)
 * @param userId - The user's ID
 * @param permissionNames - Array of permission names
 * @returns PermissionCheckResult with allowed status
 */
export async function checkAllPermissions(
  userId: string,
  permissionNames: string[]
): Promise<PermissionCheckResult> {
  const results = await Promise.all(
    permissionNames.map((name) => checkPermission(userId, name))
  );

  const allAllowed = results.every((result) => result.allowed);
  const firstFailure = results.find((result) => !result.allowed);

  if (allAllowed) {
    return results[0]; // Return first result since all are allowed
  }

  return {
    allowed: false,
    user: firstFailure?.user,
    error: firstFailure?.error || `All permissions required: ${permissionNames.join(", ")}`,
  };
}

/**
 * Middleware function to check permission for API routes
 * Returns a NextResponse with error if permission check fails, or null if allowed
 * @param request - NextRequest object
 * @param permissionName - The required permission name
 * @returns NextResponse with error, or null if permission check passes
 */
export async function requirePermission(
  request: NextRequest,
  permissionName: string
): Promise<{ response: NextResponse | null; userId: string | null }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        response: NextResponse.json(
          { success: false, error: "Unauthorized - Authentication required" },
          { status: 401 }
        ),
        userId: null,
      };
    }

    const result = await checkPermission(session.user.id, permissionName);

    if (!result.allowed) {
      return {
        response: NextResponse.json(
          {
            success: false,
            error: result.error || "Forbidden - Permission required",
            permission: permissionName,
          },
          { status: 403 }
        ),
        userId: session.user.id,
      };
    }

    return {
      response: null,
      userId: session.user.id,
    };
  } catch (error: any) {
    console.error("Error in requirePermission:", error);
    return {
      response: NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
        },
        { status: 500 }
      ),
      userId: null,
    };
  }
}

/**
 * Middleware function to check any of the specified permissions (OR logic)
 * @param request - NextRequest object
 * @param permissionNames - Array of permission names (user needs at least one)
 * @returns NextResponse with error if all checks fail, or null if any check passes
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissionNames: string[]
): Promise<{ response: NextResponse | null; userId: string | null }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        response: NextResponse.json(
          { success: false, error: "Unauthorized - Authentication required" },
          { status: 401 }
        ),
        userId: null,
      };
    }

    const result = await checkAnyPermission(session.user.id, permissionNames);

    if (!result.allowed) {
      return {
        response: NextResponse.json(
          {
            success: false,
            error: result.error || "Forbidden - Permission required",
            permissions: permissionNames,
          },
          { status: 403 }
        ),
        userId: session.user.id,
      };
    }

    return {
      response: null,
      userId: session.user.id,
    };
  } catch (error: any) {
    console.error("Error in requireAnyPermission:", error);
    return {
      response: NextResponse.json(
        {
          success: false,
          error: error.message || "Internal server error",
        },
        { status: 500 }
      ),
      userId: null,
    };
  }
}

/**
 * Get the current authenticated user with role and permissions
 * @param request - NextRequest object
 * @returns User object with role and permissions, or null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    return user;
  } catch (error: any) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Check if user has permission and get user info in one call
 * Useful when you need both the permission check and user data
 */
export async function requirePermissionWithUser(
  request: NextRequest,
  permissionName: string
): Promise<{
  response: NextResponse | null;
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>;
}> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Unauthorized - Authentication required" },
        { status: 401 }
      ),
      user: null,
    };
  }

  if (!user.isActive) {
    return {
      response: NextResponse.json(
        { success: false, error: "User account is inactive" },
        { status: 403 }
      ),
      user,
    };
  }

  if (!user.roleId || !user.role) {
    return {
      response: NextResponse.json(
        { success: false, error: "User has no role assigned" },
        { status: 403 }
      ),
      user,
    };
  }

  const hasPermission = user.role.rolePermissions.some(
    (rp) => rp.permission.name === permissionName
  );

  if (!hasPermission) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: `Permission '${permissionName}' required`,
          permission: permissionName,
        },
        { status: 403 }
      ),
      user,
    };
  }

  return {
    response: null,
    user,
  };
}

