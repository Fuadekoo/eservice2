import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { gallerySchema } from "@/app/[lang]/dashboard/@admin/configuration/gallery/_schema";
import { randomUUID } from "crypto";

// GET - Fetch all galleries (public access for guest users)
export async function GET(request: NextRequest) {
  try {
    // Allow public access - no authentication required for viewing galleries
    const galleries = await prisma.gallery.findMany({
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: galleries,
    });
  } catch (error: any) {
    console.error("❌ Error fetching galleries:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch galleries" },
      { status: 500 }
    );
  }
}

// POST - Create a new gallery (requires gallery:create permission)
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "gallery:create");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = gallerySchema.safeParse(body);

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

    const { name, description, images } = validationResult.data;

    // Create gallery with images
    const newGallery = await prisma.gallery.create({
      data: {
        id: randomUUID(),
        name,
        description: description || null,
        images: {
          create: images.map((filename, index) => ({
            id: randomUUID(),
            filename,
            order: index,
          })),
        },
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    console.log("✅ Gallery created:", newGallery.id);

    return NextResponse.json(
      {
        success: true,
        data: newGallery,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating gallery:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create gallery" },
      { status: 500 }
    );
  }
}
