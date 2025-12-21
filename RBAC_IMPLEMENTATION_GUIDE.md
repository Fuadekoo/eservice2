# RBAC (Role-Based Access Control) Implementation Guide

This guide explains how to implement permission-based access control in API routes.

## Overview

The system uses a permission-based RBAC model where:
- **Roles** have **Permissions**
- API routes check for specific **Permissions** (not just roles)
- Users with roles that have the required permission can access the endpoint

## Permission Format

Permissions follow the pattern: `resource:action`

Examples:
- `user:create` - Create users
- `service:read` - View services
- `request:approve-staff` - Approve requests at staff level
- `office:configure` - Configure office settings

## Implementation Pattern

### Step 1: Import the RBAC utilities

```typescript
import { requirePermission, requireAnyPermission } from "@/lib/rbac";
```

### Step 2: Replace role-based checks with permission checks

**Before (Role-based):**
```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  const isAdmin = dbUser?.role?.name?.toLowerCase() === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // ... rest of the code
}
```

**After (Permission-based):**
```typescript
export async function POST(request: NextRequest) {
  // Check permission
  const { response, userId } = await requirePermission(request, "user:create");
  if (response) return response;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // ... rest of the code (userId is available)
}
```

## API Permission Mapping

### User Management
- `GET /api/allUser` → `user:read`
- `POST /api/allUser` → `user:create`
- `GET /api/allUser/[id]` → `user:read`
- `PATCH /api/allUser/[id]` → `user:update`
- `DELETE /api/allUser/[id]` → `user:delete`

### Service Management
- `GET /api/service` → `service:read` (public)
- `POST /api/service` → `service:create`
- `GET /api/service/[serviceId]` → `service:read`
- `PATCH /api/service/[serviceId]` → `service:update`
- `DELETE /api/service/[serviceId]` → `service:delete`

### Request Management
- `GET /api/request` → `request:read` or `request:view-all`
- `POST /api/request` → `request:create`
- `POST /api/request/[id]/approve` → `request:approve-manager`
- `POST /api/request/[id]/approve-staff` → `request:approve-staff`

See `lib/api-permissions.ts` for the complete mapping.

## RBAC Utility Functions

### `requirePermission(request, permissionName)`

Checks if the authenticated user has the specified permission.

```typescript
const { response, userId } = await requirePermission(request, "user:create");
if (response) return response; // Returns error response if permission denied
// userId is available for use in the route handler
```

### `requireAnyPermission(request, permissionNames[])`

Checks if the user has ANY of the specified permissions (OR logic).

```typescript
const { response, userId } = await requireAnyPermission(request, [
  "request:read",
  "request:view-all"
]);
if (response) return response;
```

### `checkPermission(userId, permissionName)`

Low-level function to check a specific permission for a user.

```typescript
const result = await checkPermission(userId, "service:read");
if (!result.allowed) {
  // Handle permission denied
}
```

### `getAuthenticatedUser(request)`

Get the current authenticated user with role and permissions.

```typescript
const user = await getAuthenticatedUser(request);
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

## Special Cases

### Public Endpoints

Some endpoints don't require authentication or permissions:

```typescript
export async function GET(request: NextRequest) {
  // No permission check - public access
  // ... code
}
```

Example: `GET /api/guest/data` is public.

### Conditional Permission Checks

For endpoints that may have different permission requirements based on context:

```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    // Allow public access, but with limited data
    return NextResponse.json({ data: publicData });
  }

  // Authenticated users need permission
  const { response, userId } = await requirePermission(request, "service:read");
  if (response) return response;
  
  // Return full data for authenticated users
  return NextResponse.json({ data: fullData });
}
```

### Office-Scoped Permissions

Some permissions are scoped to offices. After checking permission, verify office access:

```typescript
export async function POST(request: NextRequest) {
  const { response, userId } = await requirePermission(request, "service:create");
  if (response) return response;

  const body = await request.json();
  const { officeId } = body;

  // Get user to check if they're admin
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  const isAdmin = dbUser?.role?.name?.toLowerCase() === "admin";

  // Non-admins can only create services for their own office
  if (!isAdmin) {
    const staff = await prisma.staff.findFirst({ where: { userId } });
    if (!staff || staff.officeId !== officeId) {
      return NextResponse.json(
        { error: "You can only create services for your own office" },
        { status: 403 }
      );
    }
  }

  // ... create service
}
```

## Updating Existing Routes

### Checklist for Each Route

1. ✅ Import `requirePermission` or `requireAnyPermission`
2. ✅ Replace role checks with permission checks
3. ✅ Use `userId` from permission check result
4. ✅ Remove old role-based checks (`isAdmin`, `isManager`, etc.)
5. ✅ Keep office-scoped checks if needed (for managers)
6. ✅ Test the route with different user roles

### Example: Complete Route Update

**File: `app/api/staff/route.ts`**

```typescript
// BEFORE
import { auth } from "@/auth";
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  const isManager = dbUser?.role?.name?.toLowerCase() === "manager";
  if (!isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ... rest of code using session.user.id
}

// AFTER
import { requirePermission } from "@/lib/rbac";
export async function POST(request: NextRequest) {
  // Check permission
  const { response, userId } = await requirePermission(request, "staff:create");
  if (response) return response;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of code using userId
}
```

## Permission Seed

All permissions are defined in `prisma/permission-seed.ts`. To seed permissions:

```bash
npm run db:seed:permission
```

## Assigning Permissions to Roles

Permissions are assigned to roles through the `RolePermission` table. This can be done:
1. Through the admin interface (if implemented)
2. Via API endpoints (if implemented)
3. Directly in the database
4. Through a migration script

## Testing

When testing RBAC:

1. **Test with different roles**: Ensure each role has the correct permissions assigned
2. **Test permission denial**: Verify that users without permissions get 403 errors
3. **Test public endpoints**: Ensure public endpoints still work without authentication
4. **Test office-scoped access**: Verify managers can only access their own office's data

## Common Permission Names

See `prisma/permission-seed.ts` for the complete list. Common patterns:

- `{resource}:create` - Create resources
- `{resource}:read` - Read/view resources
- `{resource}:update` - Update resources
- `{resource}:delete` - Delete resources
- `{resource}:manage` - Full management (all CRUD operations)
- `{resource}:approve` - Approve resources
- `{resource}:configure` - Configure settings

## Notes

- Permission checks are cached in the user session/request
- Always use `userId` from the permission check result instead of `session.user.id`
- Remove old role-based checks to avoid confusion
- Keep office-scoped checks where appropriate (managers can only access their office)

