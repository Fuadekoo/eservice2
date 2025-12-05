import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { administrationSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";
import { randomUUID } from "crypto";

// GET - Fetch all administrations
export async function GET(request: NextRequest) {
  try {
    console.log("📥 Fetching administrations from database...");

    const administrations = await prisma.administration.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${administrations.length} administrations`);

    return NextResponse.json({
      success: true,
      data: administrations,
    });
  } catch (error: any) {
    console.error("❌ Error fetching administrations:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch administrations",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new administration
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user (admin only)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin by querying database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const isAdmin = dbUser.role?.name?.toLowerCase() === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = administrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, image } = validationResult.data;

    // Create administration
    const newAdministration = await prisma.administration.create({
      data: {
        id: randomUUID(),
        name,
        description: description || null,
        image,
      },
    });

    console.log("✅ Administration created:", newAdministration.id);

    return NextResponse.json(
      {
        success: true,
        data: newAdministration,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating administration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create administration",
      },
      { status: 500 }
    );
  }
}
