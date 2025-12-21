# Update Remaining API Routes to Use RBAC

This document lists all remaining API routes that need to be updated from role-based checks to permission-based checks.

## Pattern to Follow

Replace this pattern:
```typescript
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
```

With this:
```typescript
import { requirePermission } from "@/lib/rbac";

const { response, userId } = await requirePermission(request, "permission:name");
if (response) return response;
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

## Routes Still Needing Updates

### Office Routes
- [ ] `app/api/office/route.ts` - POST (office:create)
- [ ] `app/api/office/[officeId]/route.ts` - PATCH (office:update), DELETE (office:delete)
- [ ] `app/api/office/[officeId]/availability/route.ts` - PUT (office:configure)
- [ ] `app/api/office/[officeId]/manager/route.ts` - GET (office:read)

### Staff Routes
- [ ] `app/api/staff/route.ts` - GET (staff:read), POST (staff:create)
- [ ] `app/api/staff/[staffId]/route.ts` - GET (staff:read), PATCH (staff:update), DELETE (staff:delete)
- [ ] `app/api/staff/manager/route.ts` - GET (staff:read)
- [ ] `app/api/staff/report/route.ts` - GET (report:read), POST (report:create)
- [ ] `app/api/staff/report/[id]/route.ts` - GET (report:read)
- [ ] `app/api/staff/appointment/route.ts` - GET (appointment:read)
- [ ] `app/api/staff/appointment/[id]/approve/route.ts` - POST (appointment:approve)
- [ ] `app/api/staff/service/route.ts` - GET (service:read)

### Request Routes
- [ ] `app/api/request/route.ts` - GET (request:read), POST (request:create)
- [ ] `app/api/request/[id]/route.ts` - GET (request:read), PATCH (request:update), DELETE (request:delete)
- [ ] `app/api/request/[id]/approve/route.ts` - POST (request:approve-manager)
- [ ] `app/api/request/[id]/approve-staff/route.ts` - POST (request:approve-staff)
- [ ] `app/api/request/[id]/can-approve-staff/route.ts` - GET (request:approve-staff)

### Service Routes
- [ ] `app/api/service/[serviceId]/route.ts` - GET (service:read), PATCH (service:update), DELETE (service:delete)
- [ ] `app/api/service/[serviceId]/staff/route.ts` - GET (service:read), POST (service:assign-staff), DELETE (service:assign-staff)

### Report Routes
- [ ] `app/api/report/route.ts` - GET (report:read), POST (report:create)
- [ ] `app/api/report/[id]/route.ts` - GET (report:read), PATCH (report:update), DELETE (report:delete)
- [ ] `app/api/report/[id]/approve/route.ts` - PATCH (report:approve)
- [ ] `app/api/manager/report/route.ts` - GET (report:read), POST (report:create)
- [ ] `app/api/manager/report/[id]/route.ts` - GET (report:read)

### Appointment Routes
- [ ] `app/api/appointment/route.ts` - GET (appointment:read), POST (appointment:create)
- [ ] `app/api/appointment/[id]/route.ts` - GET (appointment:read), PATCH (appointment:update), DELETE (appointment:delete)

### Admin Routes
- [ ] `app/api/admin/overview/route.ts` - GET (dashboard:admin)
- [ ] `app/api/admin/office/route.ts` - GET (office:read)
- [ ] `app/api/admin/staff/route.ts` - GET (staff:read)
- [ ] `app/api/admin/list/route.ts` - GET (user:read)

### Manager Routes
- [ ] `app/api/manager/overview/route.ts` - GET (dashboard:manager)
- [ ] `app/api/manager/office/route.ts` - GET (office:read)

### Role Routes
- [ ] `app/api/customRole/route.ts` - POST (role:create), GET (role:read)
- [ ] `app/api/role/route.ts` - GET (role:read), POST (role:create)
- [ ] `app/api/role/[roleId]/permissions` - GET (role:read), POST (role:assign-permissions)

### Language Routes
- [ ] `app/api/languages/route.ts` - GET (language:read), POST (language:manage)
- [ ] `app/api/languages/keys/route.ts` - GET (language:read)
- [ ] `app/api/languages/[langCode]/[key]/route.ts` - GET (language:read), PUT (language:update)

### Upload/File Routes
- [ ] `app/api/upload/route.ts` - POST (file:upload)
- [ ] `app/api/upload/logo/route.ts` - POST (file:upload)
- [ ] `app/api/upload/request-file/route.ts` - POST (file:upload)

### Other Routes
- [ ] `app/api/feedback/[requestId]/route.ts` - GET (feedback:read), POST (feedback:create)

## Permission Reference

See `lib/api-permissions.ts` for the complete permission mapping.

## Completed Routes ✅

- ✅ `app/api/allUser/route.ts`
- ✅ `app/api/allUser/[id]/route.ts`
- ✅ `app/api/service/route.ts` (POST)
- ✅ `app/api/administration/route.ts`
- ✅ `app/api/administration/[id]/route.ts`
- ✅ `app/api/about/route.ts`
- ✅ `app/api/about/[id]/route.ts`
- ✅ `app/api/gallery/route.ts`
- ✅ `app/api/gallery/[galleryId]/route.ts`

