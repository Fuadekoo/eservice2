import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

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

  // Clear existing data (skip if tables don't exist)
  console.log("🗑️  Cleaning existing data...");
  try {
    await prisma.user.deleteMany();
    console.log("✅ Users table cleaned");
  } catch (error: any) {
    if (error.code === "P2021") {
      console.log(
        "⚠️  Users table doesn't exist yet (this is ok if migrations haven't run)"
      );
    } else {
      throw error;
    }
  }

  try {
    await prisma.role.deleteMany();
    console.log("✅ Roles table cleaned");
  } catch (error: any) {
    if (error.code === "P2021") {
      console.log(
        "⚠️  Roles table doesn't exist yet (this is ok if migrations haven't run)"
      );
    } else {
      throw error;
    }
  }

  // Create or find Roles
  console.log("📝 Creating/updating roles...");

  async function getOrCreateRole(name: string) {
    try {
      const existing = await prisma.role.findFirst({
        where: { name },
      });
      if (existing) {
        return existing;
      }
      return await prisma.role.create({
        data: { name },
      });
    } catch (error: any) {
      if (error.code === "P2021") {
        console.error("\n❌ ERROR: Database tables don't exist yet!");
        console.error("📋 Please run migrations first:\n");
        console.error("   npx prisma migrate dev");
        console.error("\n   OR\n");
        console.error("   npx prisma db push\n");
        throw new Error(
          "Database tables don't exist. Please run migrations first."
        );
      }
      throw error;
    }
  }

  let adminRole, managerRole, staffRole, customerRole;
  try {
    adminRole = await getOrCreateRole("admin");
    managerRole = await getOrCreateRole("manager");
    staffRole = await getOrCreateRole("staff");
    customerRole = await getOrCreateRole("customer");
    console.log("✅ Roles ready");
  } catch (error: any) {
    if (error.message.includes("Database tables don't exist")) {
      throw error;
    }
    throw error;
  }

  // Hash password (using same method as auth.ts)
  const hashedPassword = await bcryptjs.hash("password123", 12);

  // Create or update Admin User
  console.log("👤 Creating/updating admin user...");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      username: "admin",
      phoneNumber: "+25100112233",
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
      phoneVerified: false,
    },
  });
  console.log("✅ Admin user ready (username: admin, password: password123)");

  // Create or update Manager User
  console.log("👤 Creating/updating manager user...");
  await prisma.user.upsert({
    where: { username: "manager" },
    update: {
      password: hashedPassword,
      roleId: managerRole.id,
      isActive: true,
    },
    create: {
      username: "manager",
      phoneNumber: "+25100112234",
      password: hashedPassword,
      roleId: managerRole.id,
      isActive: true,
      phoneVerified: false,
    },
  });
  console.log(
    "✅ Manager user ready (username: manager, password: password123)"
  );

  // Create or update Staff User
  console.log("👤 Creating/updating staff user...");
  await prisma.user.upsert({
    where: { username: "staff" },
    update: {
      password: hashedPassword,
      roleId: staffRole.id,
      isActive: true,
    },
    create: {
      username: "staff",
      phoneNumber: "+25100112235",
      password: hashedPassword,
      roleId: staffRole.id,
      isActive: true,
      phoneVerified: false,
    },
  });
  console.log("✅ Staff user ready (username: staff, password: password123)");

  // Create or update Customer User
  console.log("👤 Creating/updating customer user...");
  await prisma.user.upsert({
    where: { username: "customer" },
    update: {
      password: hashedPassword,
      roleId: customerRole.id,
      isActive: true,
    },
    create: {
      username: "customer",
      phoneNumber: "+25100112236",
      password: hashedPassword,
      roleId: customerRole.id,
      isActive: true,
      phoneVerified: false,
    },
  });
  console.log(
    "✅ Customer user ready (username: customer, password: password123)"
  );

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test credentials:");
  console.log("   Admin:    username=admin    password=password123");
  console.log("   Manager:  username=manager  password=password123");
  console.log("   Staff:    username=staff    password=password123");
  console.log("   Customer: username=customer password=password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
