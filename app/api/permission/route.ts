import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// Type for permission with included relations
type PermissionWithRolePermissions = Prisma.PermissionGetPayload<{
  include: {
    rolePermissions: {
      include: {
        role: {
          select: {
            id: true;
            name: true;
            office: {
              select: {
                id: true;
                name: true;
              };
            };
          };
        };
      };
    };
  };
}>;

// GET - Fetch all permissions
export async function GET(request: NextRequest) {
  try {
    console.log("📥 Fetching permissions from database...");

    const permissions: PermissionWithRolePermissions[] =
      await prisma.permission.findMany({
        include: {
          rolePermissions: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  office: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

    console.log(`✅ Successfully fetched ${permissions.length} permissions`);

    // Serialize dates and format permissions
    const serializedPermissions = permissions.map(
      (permission: PermissionWithRolePermissions) => ({
        id: permission.id,
        name: permission.name,
        createdAt: permission.createdAt.toISOString(),
        updatedAt: permission.updatedAt.toISOString(),
        roles: permission.rolePermissions.map((rp) => ({
          id: rp.role.id,
          name: rp.role.name,
          office: rp.role.office,
        })),
        roleCount: permission.rolePermissions.length,
      })
    );

    return NextResponse.json({ success: true, data: serializedPermissions });
  } catch (error: any) {
    console.error("❌ Error fetching permissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch permissions",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
