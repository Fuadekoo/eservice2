# Dashboard RBAC Implementation Guide

This document describes how permission-based access control is implemented for dashboard pages and API calls.

## Overview

The dashboard RBAC system works at multiple levels:
1. **Menu Filtering** - Only shows menu items the user has permission to access
2. **Page Access Control** - Checks permissions before rendering pages
3. **API Call Protection** - API routes check permissions server-side

## Permission Structure

### Page Permissions
- Mapped in `lib/page-permissions.ts`
- Format: `resource:action` (e.g., `user:read`, `service:create`)
- Dashboard overviews use: `dashboard:admin`, `dashboard:manager`, `dashboard:staff`, `dashboard:customer`

### Menu Permissions
- Mapped in `lib/dashboard-menu-permissions.ts`
- Uses same permission format as page permissions
- Menu items are filtered based on user permissions

## Implementation Details

### 1. Menu Filtering

Menu items are automatically filtered in layout files using `filterMenuByPermissions`:

```typescript
import { filterMenuByPermissions } from "@/lib/filter-menu-by-permissions";

const menu = userId
  ? await filterMenuByPermissions(userId, "admin", allMenuItems)
  : allMenuItems;
```

This function:
- Fetches user's role and permissions
- Compares with required permissions for each menu item
- Returns only items the user can access

### 2. Page Access Control

Pages can be protected using the `checkPagePermission` utility:

```typescript
import { checkPagePermission } from "@/lib/check-page-permission";

const result = await checkPagePermission(userId, role, path);
if (!result.allowed) {
  // Show access denied
}
```

### 3. API Call Protection

All API routes already check permissions using `requirePermission` from `lib/rbac.ts`.

For client-side stores, use `protectedFetch` for better error handling:

```typescript
import { protectedFetch } from "@/lib/protected-fetch";

const response = await protectedFetch("/api/allUser", {
  method: "GET",
  requiredPermission: "user:read",
});
```

## Permission Mapping

### Admin Pages
- Overview: `dashboard:admin`
- Office Management: `office:read`
- User Management: `user:read`
- Languages: `language:read`
- Gallery: `gallery:read`
- About: `about:read`
- Reports: `report:view-all`
- Requests: `request:view-all`

### Manager Pages
- Overview: `dashboard:manager`
- Services: `service:read`
- Staff: `staff:read`
- Requests: `request:read`
- Reports: `report:read`
- Configuration: `office:read`
- Availability: `office:configure`

### Staff Pages
- Overview: `dashboard:staff`
- Requests: `request:read`
- Appointments: `appointment:read`
- Services: `service:read`
- Reports: `report:read`

### Customer Pages
- Overview: `dashboard:customer`
- Apply Service: `request:create`
- My Requests: `request:read`
- Appointments: `appointment:read`
- Feedback: `feedback:create`
- Profile: `profile:read`

## Adding New Pages

1. **Add permission to seed file** (`prisma/permission-seed.ts`)
2. **Add page mapping** in `lib/page-permissions.ts`
3. **Add menu mapping** in `lib/dashboard-menu-permissions.ts`
4. **Update API route** to check permission
5. **Run permission seed**: `npm run db:seed:permission`

## Best Practices

1. **Always check permissions server-side** - Client-side checks are for UX only
2. **Use permission checks in API routes** - This is the primary security layer
3. **Filter menus based on permissions** - Improves UX by hiding inaccessible items
4. **Handle permission errors gracefully** - Show clear error messages
5. **Test with different roles** - Ensure permissions work correctly

## Troubleshooting

### Menu items not showing
- Check if permission exists in database
- Verify permission is assigned to the role
- Check menu permission mapping in `dashboard-menu-permissions.ts`

### Page access denied
- Verify page permission mapping in `page-permissions.ts`
- Check if user's role has the required permission
- Ensure permission is seeded in database

### API calls failing with 403
- Verify API route checks permission correctly
- Check if permission is assigned to user's role
- Ensure permission name matches between client and server

