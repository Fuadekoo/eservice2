/**
 * Dashboard Menu Item Permissions
 * 
 * Maps menu items to their required permissions for filtering menu visibility.
 */

export interface MenuItemPermission {
  key: string;
  url: string;
  permission: string | string[];
}

export const ADMIN_MENU_PERMISSIONS: MenuItemPermission[] = [
  { key: "overview", url: "", permission: "dashboard:admin" },
  { key: "office", url: "office", permission: "office:read" },
  { key: "myoffice", url: "myoffice", permission: "office:read" },
  { key: "userManagement", url: "userManagement", permission: "user:read" },
  { key: "languages", url: "languages", permission: "language:read" },
  { key: "gallery", url: "configuration/gallery", permission: "gallery:read" },
  { key: "about", url: "configuration/about", permission: "about:read" },
  { key: "report", url: "report", permission: "report:view-all" },
  { key: "requestManagement", url: "requestManagement", permission: "request:view-all" },
];

export const MANAGER_MENU_PERMISSIONS: MenuItemPermission[] = [
  { key: "overview", url: "", permission: "dashboard:manager" },
  { key: "services", url: "services", permission: "service:read" },
  { key: "staff", url: "staff", permission: "staff:read" },
  { key: "requestManagement", url: "requestmanagement", permission: "request:read" },
  { key: "report", url: "report", permission: "report:read" },
  { key: "configuration", url: "configuration/office", permission: "office:read" },
  { key: "availability", url: "configuration/avaibility", permission: "office:configure" },
];

export const STAFF_MENU_PERMISSIONS: MenuItemPermission[] = [
  { key: "overview", url: "", permission: "dashboard:staff" },
  { key: "requestManagement", url: "requestManagement", permission: "request:read" },
  { key: "appointment", url: "appointment", permission: "appointment:read" },
  { key: "serviceManagement", url: "serviceManagement", permission: "service:read" },
  { key: "report", url: "report", permission: "report:read" },
];

export const CUSTOMER_MENU_PERMISSIONS: MenuItemPermission[] = [
  { key: "overview", url: "", permission: "dashboard:customer" },
  { key: "applyService", url: "applyservice", permission: "request:create" },
  { key: "request", url: "request", permission: "request:read" },
  { key: "appointment", url: "appointment", permission: "appointment:read" },
  { key: "feedback", url: "feedback", permission: "feedback:create" },
  { key: "profile", url: "profile", permission: "profile:read" },
];

/**
 * Get menu permissions for a role
 */
export function getMenuPermissions(role: string): MenuItemPermission[] {
  const normalizedRole = role.toLowerCase();
  
  switch (normalizedRole) {
    case "admin":
      return ADMIN_MENU_PERMISSIONS;
    case "manager":
      return MANAGER_MENU_PERMISSIONS;
    case "staff":
      return STAFF_MENU_PERMISSIONS;
    case "customer":
      return CUSTOMER_MENU_PERMISSIONS;
    default:
      return [];
  }
}

