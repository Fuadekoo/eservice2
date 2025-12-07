import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch all admin users (for managers to send reports to)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Query all users with their roles and filter for admins
    // This approach works better with MySQL case-sensitivity
    const allUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          isNot: null,
        },
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`📊 Found ${allUsers.length} active users with roles`);

    // Filter users with admin role (case-insensitive check in application layer)
    const admins = allUsers
      .filter((user) => {
        const roleName = user.role?.name?.toLowerCase();
        const isAdmin = roleName === "admin" || roleName === "administrator";
        if (isAdmin) {
          console.log(
            `✅ Found admin user: ${user.username} (role: ${user.role?.name})`
          );
        }
        return isAdmin;
      })
      .map((user) => ({
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));

    console.log(`✅ Returning ${admins.length} admin users`);

    return NextResponse.json({
      success: true,
      data: admins,
    });
  } catch (error: any) {
    console.error("❌ Error fetching admins:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch admins",
      },
      { status: 500 }
    );
  }
}
