import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch all roles (optionally filtered by officeId)
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

    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get("officeId");

    // Build where clause
    const where: any = {};
    if (officeId) {
      where.officeId = officeId;
    }

    // Fetch roles
    const roles = await prisma.role.findMany({
      where,
      include: {
        office: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        officeId: role.officeId,
        office: role.office,
      })),
    });
  } catch (error: any) {
    console.error("❌ Error fetching roles:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch roles",
      },
      { status: 500 }
    );
  }
}
