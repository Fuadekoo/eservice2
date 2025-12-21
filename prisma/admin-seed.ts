import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting admin seed...");
  console.log(
    "ℹ️  This script will only create or update admin2 and admin3 users."
  );
  console.log("ℹ️  It will NOT delete any existing data.\n");

  // Check if database tables exist first
  try {
    await prisma.$queryRaw`SELECT 1 FROM role LIMIT 1`;
  } catch (error: any) {
    if (error.code === "P2021" || error.code === "42S02") {
      console.error("\n❌ ERROR: Database tables don't exist yet!");
      console.error("📋 Please run database migrations first:\n");
      console.error("   npx prisma migrate dev");
      console.error("\n   OR\n");
      console.error("   npx prisma db push\n");
      throw new Error(
        "Database tables don't exist. Please run migrations first: npx prisma migrate dev"
      );
    }
    throw error;
  }

  // Find or create Admin Role
  console.log("📝 Finding/creating admin role...");
  let adminRole;
  try {
    adminRole = await prisma.role.findFirst({
      where: { name: "admin" },
    });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: "admin" },
      });
      console.log("✅ Admin role created");
    } else {
      console.log("✅ Admin role found");
    }
  } catch (error: any) {
    if (error.code === "P2021") {
      console.error("\n❌ ERROR: Database tables don't exist yet!");
      console.error("📋 Please run migrations first:\n");
      console.error("   npx prisma migrate dev");
      throw new Error(
        "Database tables don't exist. Please run migrations first."
      );
    }
    throw error;
  }

  // Hash password (using same method as seed.ts)
  const hashedPassword = await bcryptjs.hash("password123", 12);

  // Create or update Admin User 2
  // Note: Using upsert ensures we only create/update these specific users
  // without affecting any other existing users or data
  console.log("👤 Creating/updating admin user 2...");
  await prisma.user.upsert({
    where: { username: "admin2" },
    update: {
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      username: "admin2",
      phoneNumber: "+251900112238",
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
      phoneVerified: false,
    },
  });
  console.log(
    "✅ Admin user 2 ready (username: admin2, password: password123)"
  );

  // Create or update Admin User 3
  // Note: Using upsert ensures we only create/update these specific users
  // without affecting any other existing users or data
  console.log("👤 Creating/updating admin user 3...");
  await prisma.user.upsert({
    where: { username: "admin3" },
    update: {
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      username: "admin3",
      phoneNumber: "+251900112239",
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
      phoneVerified: false,
    },
  });
  console.log(
    "✅ Admin user 3 ready (username: admin3, password: password123)"
  );

  // Assign all permissions to admin role
  console.log("\n🔐 Assigning all permissions to admin role...");
  try {
    // Get all permissions from database
    const allPermissions = await prisma.permission.findMany({
      select: { id: true, name: true },
    });

    if (allPermissions.length === 0) {
      console.log(
        "⚠️  No permissions found in database. Please run permission seed first:"
      );
      console.log("   npm run db:seed:permission");
    } else {
      console.log(`📋 Found ${allPermissions.length} permissions`);

      // Get existing role permissions to avoid duplicates
      const existingRolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: adminRole.id },
        select: { permissionId: true },
      });

      const existingPermissionIds = new Set(
        existingRolePermissions.map((rp) => rp.permissionId)
      );

      // Filter out permissions that are already assigned
      const permissionsToAssign = allPermissions.filter(
        (perm) => !existingPermissionIds.has(perm.id)
      );

      if (permissionsToAssign.length > 0) {
        // Create role permissions using createMany (will skip duplicates due to unique constraint)
        await prisma.rolePermission.createMany({
          data: permissionsToAssign.map((perm) => ({
            roleId: adminRole.id,
            permissionId: perm.id,
          })),
          skipDuplicates: true,
        });
        console.log(
          `✅ Assigned ${permissionsToAssign.length} new permissions to admin role`
        );
      } else {
        console.log("✅ All permissions are already assigned to admin role");
      }

      // Verify assignment
      const totalAssigned = await prisma.rolePermission.count({
        where: { roleId: adminRole.id },
      });
      console.log(
        `📊 Total permissions assigned to admin role: ${totalAssigned}/${allPermissions.length}`
      );
    }
  } catch (error: any) {
    if (error.code === "P2021") {
      console.log(
        "⚠️  Permissions table doesn't exist yet. Please run permission seed first:"
      );
      console.log("   npm run db:seed:permission");
    } else {
      console.error("❌ Error assigning permissions:", error.message);
      throw error;
    }
  }

  console.log("\n🎉 Admin seed completed successfully!");
  console.log("\n📋 Admin credentials:");
  console.log(
    "   Admin 2: username=admin2  password=password123  phone=+251900112238"
  );
  console.log(
    "   Admin 3: username=admin3  password=password123  phone=+251900112239"
  );
  console.log("\n💡 Admin role has been granted all available permissions.");
}

main()
  .catch((e) => {
    console.error("❌ Admin seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
