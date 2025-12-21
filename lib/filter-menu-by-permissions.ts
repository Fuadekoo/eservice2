import prisma from "@/lib/db";
import { getMenuPermissions, MenuItemPermission } from "./dashboard-menu-permissions";

/**
 * Filter menu items based on user permissions
 * @param userId - User ID
 * @param role - User role
 * @param menuItems - Array of menu items with key, url, and Icon
 * @returns Filtered menu items that user has permission to access
 */
export async function filterMenuByPermissions(
  userId: string,
  role: string,
  menuItems: Array<{ key: string; url: string; Icon: React.ReactNode }>[]
): Promise<Array<{ key: string; url: string; Icon: React.ReactNode }>[]> {
  // Get user with permissions
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

  if (!user || !user.role || !user.isActive) {
    return [];
  }

  // Get user's permission names
  const userPermissions = new Set(
    user.role.rolePermissions.map((rp) => rp.permission.name)
  );

  // Get menu permissions for this role
  const menuPermissions = getMenuPermissions(role);

  // Create a map of key -> permission for quick lookup
  const keyToPermission = new Map<string, string | string[]>();
  menuPermissions.forEach((item) => {
    keyToPermission.set(item.key, item.permission);
  });

  // Filter menu items based on permissions
  return menuItems.map((group) =>
    group.filter((item) => {
      const requiredPermission = keyToPermission.get(item.key);
      
      // If no permission is required, allow access
      if (!requiredPermission) {
        return true;
      }

      // Check if user has any of the required permissions (OR logic)
      const permissionsToCheck = Array.isArray(requiredPermission)
        ? requiredPermission
        : [requiredPermission];

      return permissionsToCheck.some((perm) => userPermissions.has(perm));
    })
  );
}

