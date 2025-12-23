import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { administrationSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";
import { randomUUID } from "crypto";

// GET - Fetch all administrations (public access for guest users)
export async function GET(request: NextRequest) {
  try {
    // Allow public access - no authentication required for viewing administrations
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

// POST - Create a new administration (requires administration:manage permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(
      request,
      "administration:manage"
    );
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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
