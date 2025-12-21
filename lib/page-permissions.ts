/**
 * Dashboard Page Permissions Mapping
 * 
 * Maps dashboard pages to their required permissions for access control.
 * Used to check if a user has permission to access a specific page.
 */

export interface PagePermission {
  role: string;
  path: string;
  permission: string | string[];
  description?: string;
}

/**
 * Complete mapping of dashboard pages to permissions
 */
export const PAGE_PERMISSIONS: PagePermission[] = [
  // Admin Pages
  { role: "admin", path: "", permission: "dashboard:admin", description: "Admin overview" },
  { role: "admin", path: "office", permission: "office:read", description: "Office management" },
  { role: "admin", path: "office/[id]", permission: "office:read", description: "Office details" },
  { role: "admin", path: "myoffice", permission: "office:read", description: "My office" },
  { role: "admin", path: "userManagement", permission: "user:read", description: "User management" },
  { role: "admin", path: "languages", permission: "language:read", description: "Language management" },
  { role: "admin", path: "configuration/gallery", permission: "gallery:read", description: "Gallery management" },
  { role: "admin", path: "configuration/about", permission: "about:read", description: "About page management" },
  { role: "admin", path: "report", permission: "report:view-all", description: "Report management" },
  { role: "admin", path: "requestManagement", permission: "request:view-all", description: "Request management" },
  { role: "admin", path: "profile", permission: "profile:read", description: "Profile" },
  { role: "admin", path: "pdf", permission: "file:download", description: "PDF viewer" },

  // Manager Pages
  { role: "manager", path: "", permission: "dashboard:manager", description: "Manager overview" },
  { role: "manager", path: "services", permission: "service:read", description: "Service management" },
  { role: "manager", path: "services/add", permission: "service:create", description: "Add service" },
  { role: "manager", path: "services/[serviceId]", permission: "service:read", description: "Service details" },
  { role: "manager", path: "services/[serviceId]/edit", permission: "service:update", description: "Edit service" },
  { role: "manager", path: "staff", permission: "staff:read", description: "Staff management" },
  { role: "manager", path: "staff/add", permission: "staff:create", description: "Add staff" },
  { role: "manager", path: "staff/[staffId]/edit", permission: "staff:update", description: "Edit staff" },
  { role: "manager", path: "requestmanagement", permission: "request:read", description: "Request management" },
  { role: "manager", path: "request", permission: "request:read", description: "Request details" },
  { role: "manager", path: "report", permission: "report:read", description: "Report management" },
  { role: "manager", path: "appointment", permission: "appointment:read", description: "Appointment management" },
  { role: "manager", path: "configuration/office", permission: "office:read", description: "Office configuration" },
  { role: "manager", path: "configuration/avaibility", permission: "office:configure", description: "Availability configuration" },
  { role: "manager", path: "profile", permission: "profile:read", description: "Profile" },

  // Staff Pages
  { role: "staff", path: "", permission: "dashboard:staff", description: "Staff overview" },
  { role: "staff", path: "requestManagement", permission: "request:read", description: "Request management" },
  { role: "staff", path: "appointment", permission: "appointment:read", description: "Appointment management" },
  { role: "staff", path: "serviceManagement", permission: "service:read", description: "Service management" },
  { role: "staff", path: "report", permission: "report:read", description: "Report management" },
  { role: "staff", path: "profile", permission: "profile:read", description: "Profile" },

  // Customer Pages
  { role: "customer", path: "", permission: "dashboard:customer", description: "Customer overview" },
  { role: "customer", path: "applyservice", permission: "request:create", description: "Apply for service" },
  { role: "customer", path: "request", permission: "request:read", description: "My requests" },
  { role: "customer", path: "appointment", permission: "appointment:read", description: "My appointments" },
  { role: "customer", path: "feedback", permission: "feedback:read", description: "Feedback" },
  { role: "customer", path: "profile", permission: "profile:read", description: "Profile" },
  { role: "customer", path: "settings", permission: "profile:update", description: "Settings" },
];

/**
 * Get permission for a specific page
 * @param role - User role
 * @param path - Page path (relative to role dashboard)
 * @returns Permission name(s) or undefined if not found
 */
export function getPagePermission(
  role: string,
  path: string
): string | string[] | undefined {
  const normalizedRole = role.toLowerCase();
  const normalizedPath = path.toLowerCase().replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes

  // Find exact match first
  const exactMatch = PAGE_PERMISSIONS.find(
    (p) =>
      p.role.toLowerCase() === normalizedRole &&
      p.path.toLowerCase() === normalizedPath
  );

  if (exactMatch) {
    return exactMatch.permission;
  }

  // Try to match dynamic routes (e.g., [id])
  const dynamicMatch = PAGE_PERMISSIONS.find((p) => {
    if (p.role.toLowerCase() !== normalizedRole) return false;

    // Convert path pattern to regex (e.g., "services/[serviceId]" -> /^services\/[^/]+$/)
    const pattern = p.path
      .toLowerCase()
      .replace(/\[.*?\]/g, "[^/]+")
      .replace(/\//g, "\\/");
    const regex = new RegExp(`^${pattern}$`);

    return regex.test(normalizedPath);
  });

  return dynamicMatch?.permission;
}

/**
 * Get all page permissions for a role
 * @param role - User role
 * @returns Array of page permissions for the role
 */
export function getRolePagePermissions(role: string): PagePermission[] {
  const normalizedRole = role.toLowerCase();
  return PAGE_PERMISSIONS.filter(
    (p) => p.role.toLowerCase() === normalizedRole
  );
}

/**
 * Check if a path matches a permission pattern
 */
export function pathMatchesPattern(path: string, pattern: string): boolean {
  const normalizedPath = path.toLowerCase().replace(/^\/+|\/+$/g, "");
  const normalizedPattern = pattern
    .toLowerCase()
    .replace(/\[.*?\]/g, "[^/]+")
    .replace(/\//g, "\\/");
  const regex = new RegExp(`^${normalizedPattern}$`);
  return regex.test(normalizedPath);
}

