import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { aboutSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";
import { randomUUID } from "crypto";

// GET - Fetch all about sections
export async function GET(request: NextRequest) {
  try {
    console.log("📥 Fetching about sections from database...");

    const aboutSections = await prisma.about.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${aboutSections.length} about sections`);

    return NextResponse.json({
      success: true,
      data: aboutSections,
    });
  } catch (error: any) {
    console.error("❌ Error fetching about sections:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch about sections",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new about section
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
    const validationResult = aboutSchema.safeParse(body);

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

    // Create about section
    const newAbout = await prisma.about.create({
      data: {
        id: randomUUID(),
        name,
        description: description || null,
        image,
      },
    });

    console.log("✅ About section created:", newAbout.id);

    return NextResponse.json(
      {
        success: true,
        data: newAbout,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating about section:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create about section",
      },
      { status: 500 }
    );
  }
}

