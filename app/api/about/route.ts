import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { aboutSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";
import { randomUUID } from "crypto";

// GET - Fetch all about sections (public access for guest users)
export async function GET(request: NextRequest) {
  try {
    // Allow public access - no authentication required for viewing about sections
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

// POST - Create a new about section (requires about:manage permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "about:manage");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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

