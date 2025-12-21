/**
 * Dashboard Page Permission Mapping
 * 
 * Maps dashboard page routes to their required permissions.
 * Used for RBAC (Role-Based Access Control) in dashboard pages.
 */

export const DASHBOARD_PAGE_PERMISSIONS: Record<string, string | string[]> = {
  // Admin Pages
  "admin/overview": "page:admin:overview",
  "admin/userManagement": "user:read",
  "admin/office": "office:read",
  "admin/myoffice": "office:read",
  "admin/requestManagement": "request:view-all",
  "admin/report": "report:view-all",
  "admin/languages": "language:read",
  "admin/configuration/gallery": "gallery:read",
  "admin/configuration/about": "about:read",
  "admin/profile": "profile:read",

  // Manager Pages
  "manager/overview": "page:manager:overview",
  "manager/services": "service:read",
  "manager/staff": "staff:read",
  "manager/requestmanagement": "request:read",
  "manager/report": "report:read",
  "manager/appointment": "appointment:read",
  "manager/configuration/office": "office:read",
  "manager/configuration/avaibility": "office:configure",

  // Staff Pages
  "staff/overview": "page:staff:overview",
  "staff/requestManagement": "request:read",
  "staff/appointment": "appointment:read",
  "staff/serviceManagement": "service:read",
  "staff/report": "report:read",
  "staff/profile": "profile:read",

  // Customer Pages
  "customer/overview": "page:customer:overview",
  "customer/applyservice": "request:create",
  "customer/request": "request:read",
  "customer/appointment": "appointment:read",
  "customer/feedback": "feedback:create",
  "customer/profile": "profile:read",
};

/**
 * Get required permission for a dashboard page
 * @param role - User role (admin, manager, staff, customer)
 * @param pagePath - Page path relative to role folder (e.g., "overview", "services", "request")
 * @returns Permission name(s) or undefined if page doesn't require permission
 */
export function getDashboardPagePermission(
  role: string,
  pagePath: string
): string | string[] | undefined {
  const normalizedRole = role.toLowerCase();
  const key = `${normalizedRole}/${pagePath}`;
  return DASHBOARD_PAGE_PERMISSIONS[key];
}

/**
 * Get all permissions for a role
 * @param role - User role
 * @returns Array of permission names for that role's pages
 */
export function getRolePagePermissions(role: string): string[] {
  const normalizedRole = role.toLowerCase();
  const permissions: string[] = [];

  for (const [key, permission] of Object.entries(DASHBOARD_PAGE_PERMISSIONS)) {
    if (key.startsWith(`${normalizedRole}/`)) {
      if (typeof permission === "string") {
        permissions.push(permission);
      } else {
        permissions.push(...permission);
      }
    }
  }

  return permissions;
}

