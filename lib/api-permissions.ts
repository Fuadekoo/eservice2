/**
 * API Route Permission Mapping
 *
 * This file maps API routes to their required permissions.
 * Used for RBAC (Role-Based Access Control) implementation.
 *
 * Format: "HTTP_METHOD /api/path" -> "permission:action"
 */

export const API_PERMISSIONS: Record<string, string | string[] | undefined> = {
  // User Management
  "GET /api/allUser": "user:read",
  "POST /api/allUser": "user:create",
  "GET /api/allUser/[id]": "user:read",
  "PATCH /api/allUser/[id]": "user:update",
  "DELETE /api/allUser/[id]": "user:delete",
  "GET /api/user/me": "profile:read",
  "GET /api/user/profile": "profile:read",
  "PUT /api/user/profile": "profile:update",
  "POST /api/user/change-password": "profile:change-password",

  // Office Management
  "GET /api/office": ["office:read", "office:manage"], // Allow read for public/authenticated users
  "POST /api/office": "office:create",
  "GET /api/office/[officeId]": "office:read",
  "PATCH /api/office/[officeId]": "office:update",
  "DELETE /api/office/[officeId]": "office:delete",
  "GET /api/office/[officeId]/availability": "office:read",
  "PUT /api/office/[officeId]/availability": "office:configure",
  "GET /api/office/[officeId]/availability/slots": "office:read",
  "GET /api/office/[officeId]/stats": "office:read",
  "GET /api/office/[officeId]/manager": "office:read",
  "GET /api/admin/office": "office:read",
  "POST /api/admin/office": "office:manage",
  "DELETE /api/admin/office": "office:manage",

  // Service Management
  "GET /api/service": ["service:read"], // Public read access
  "POST /api/service": "service:create",
  "GET /api/service/[serviceId]": "service:read",
  "PATCH /api/service/[serviceId]": "service:update",
  "DELETE /api/service/[serviceId]": "service:delete",
  "GET /api/service/[serviceId]/stats": "service:read",
  "GET /api/service/[serviceId]/staff": "service:read",
  "POST /api/service/[serviceId]/staff": "service:assign-staff",
  "DELETE /api/service/[serviceId]/staff": "service:assign-staff",

  // Request Management
  "GET /api/request": ["request:read", "request:view-all"],
  "POST /api/request": "request:create",
  "GET /api/request/[id]": "request:read",
  "PATCH /api/request/[id]": "request:update",
  "DELETE /api/request/[id]": "request:delete",
  "POST /api/request/[id]/approve": "request:approve-manager",
  "POST /api/request/[id]/approve-staff": "request:approve-staff",
  "GET /api/request/[id]/can-approve-staff": "request:approve-staff",

  // Appointment Management
  "GET /api/appointment": "appointment:read",
  "POST /api/appointment": "appointment:create",
  "GET /api/appointment/[id]": "appointment:read",
  "PATCH /api/appointment/[id]": "appointment:update",
  "DELETE /api/appointment/[id]": "appointment:delete",
  "GET /api/staff/appointment": "appointment:read",
  "POST /api/staff/appointment/[id]/approve": "appointment:approve",

  // Staff Management
  "GET /api/staff": "staff:read",
  "POST /api/staff": "staff:create",
  "GET /api/staff/[staffId]": "staff:read",
  "PATCH /api/staff/[staffId]": "staff:update",
  "DELETE /api/staff/[staffId]": "staff:delete",
  "GET /api/staff/available-users": "staff:create",
  "GET /api/staff/service": "service:read",
  "GET /api/staff/manager": "staff:read",
  "GET /api/admin/staff": "staff:read",

  // Report Management
  "GET /api/report": "report:read",
  "POST /api/report": "report:create",
  "GET /api/report/[id]": "report:read",
  "PATCH /api/report/[id]": "report:update",
  "DELETE /api/report/[id]": "report:delete",
  "POST /api/report/[id]/approve": "report:approve",
  "GET /api/manager/report": "report:read",
  "POST /api/manager/report": "report:create",
  "GET /api/manager/report/[id]": "report:read",
  "GET /api/staff/report": "report:read",
  "POST /api/staff/report": "report:create",
  "GET /api/staff/report/[id]": "report:read",

  // Gallery Management
  "GET /api/gallery": "gallery:read",
  "POST /api/gallery": "gallery:create",
  "GET /api/gallery/[galleryId]": "gallery:read",
  "PATCH /api/gallery/[galleryId]": "gallery:update",
  "DELETE /api/gallery/[galleryId]": "gallery:delete",

  // Role & Permission Management
  "GET /api/role": "role:read",
  "POST /api/role": "role:create",
  "PATCH /api/role/[roleId]": "role:update",
  "DELETE /api/role/[roleId]": "role:delete",
  "GET /api/role/[roleId]/permissions": "role:read",
  "POST /api/role/[roleId]/permissions": "role:assign-permissions",
  "GET /api/customRole": "role:read",
  "POST /api/customRole": "role:create",
  "GET /api/permission": "permission:read",

  // Language & Translation Management
  "GET /api/languages": "language:read",
  "POST /api/languages": "language:manage",
  "GET /api/languages/keys": "language:read",
  "GET /api/languages/[langCode]/[key]": "language:read",
  "PUT /api/languages/[langCode]/[key]": "language:update",
  "GET /api/translations/[lang]": "language:read",

  // About Page Management
  "GET /api/about": "about:read",
  "POST /api/about": "about:manage",
  "GET /api/about/[id]": "about:read",
  "PATCH /api/about/[id]": "about:update",
  "DELETE /api/about/[id]": "about:manage",

  // Administration Page Management
  "GET /api/administration": "administration:read",
  "POST /api/administration": "administration:manage",
  "GET /api/administration/[id]": "administration:read",
  "PATCH /api/administration/[id]": "administration:update",
  "DELETE /api/administration/[id]": "administration:manage",

  // Feedback Management
  "GET /api/feedback/[requestId]": "feedback:read",
  "POST /api/feedback/[requestId]": "feedback:create",

  // File Management
  "POST /api/upload": "file:upload",
  "POST /api/upload/logo": "file:upload",
  "POST /api/upload/logo/[file]": "file:upload",
  "POST /api/upload/request-file": "file:upload",
  "GET /api/filedata/[file]": "file:download",

  // Dashboard & Overview
  "GET /api/admin/overview": "dashboard:admin",
  "GET /api/manager/overview": "dashboard:manager",
  "GET /api/staff/overview": "dashboard:staff",

  // Guest/Public APIs (may not require authentication)
  "GET /api/guest/data": undefined, // Public access
};

/**
 * Get required permission for an API route
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - API path (e.g., "/api/user" or "/api/user/[id]")
 * @returns Permission name(s) or undefined if public access
 */
export function getRequiredPermission(
  method: string,
  path: string
): string | string[] | undefined {
  const key = `${method.toUpperCase()} ${path}`;
  return API_PERMISSIONS[key];
}

/**
 * Get required permission for a dynamic route
 * @param method - HTTP method
 * @param pathPattern - Path pattern with [param] placeholders
 * @param actualPath - Actual path from request
 * @returns Permission name(s) or undefined
 */
export function getRequiredPermissionForPath(
  method: string,
  pathPattern: string,
  actualPath: string
): string | string[] | undefined {
  // Try exact match first
  const exactKey = `${method.toUpperCase()} ${pathPattern}`;
  if (API_PERMISSIONS[exactKey] !== undefined) {
    return API_PERMISSIONS[exactKey];
  }

  // Try to match dynamic routes (e.g., [id] -> actual ID)
  const patternRegex = pathPattern.replace(/\[.*?\]/g, "[^/]+");
  const regex = new RegExp(`^${patternRegex}$`);

  if (regex.test(actualPath)) {
    // Find matching permission pattern
    const methodUpper = method.toUpperCase();
    for (const [key, permission] of Object.entries(API_PERMISSIONS)) {
      if (key.startsWith(methodUpper + " ")) {
        const routePath = key.substring(methodUpper.length + 1);
        const routeRegex = new RegExp(
          "^" + routePath.replace(/\[.*?\]/g, "[^/]+") + "$"
        );
        if (routeRegex.test(actualPath)) {
          return permission;
        }
      }
    }
  }

  return undefined;
}
