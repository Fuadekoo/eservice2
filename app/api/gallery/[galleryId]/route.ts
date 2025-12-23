import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { gallerySchema } from "@/app/[lang]/dashboard/@admin/configuration/gallery/_schema";
import { randomUUID } from "crypto";

// GET - Fetch a single gallery (public access for guest users)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    // Allow public access - no authentication required for viewing galleries
    const { galleryId } = await params;

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: gallery,
    });
  } catch (error: any) {
    console.error("❌ Error fetching gallery:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

// PATCH - Update a gallery (requires gallery:update permission)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params;

    // Check permission
    const { response, userId } = await requirePermission(request, "gallery:update");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = gallerySchema.partial().safeParse(body);

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

    // Check if gallery exists
    const existingGallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      include: { images: true },
    });

    if (!existingGallery) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }

    // Update gallery
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // If images are provided, replace all existing images
    if (images !== undefined) {
      // Delete existing images
      await prisma.galleryImage.deleteMany({
        where: { galleryId },
      });

      // Create new images
      updateData.images = {
        create: images.map((filename: string, index: number) => ({
          id: randomUUID(),
          filename,
          order: index,
        })),
      };
    }

    const updatedGallery = await prisma.gallery.update({
      where: { id: galleryId },
      data: updateData,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    console.log("✅ Gallery updated:", galleryId);

    return NextResponse.json({
      success: true,
      data: updatedGallery,
    });
  } catch (error: any) {
    console.error("❌ Error updating gallery:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update gallery" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a gallery (requires gallery:delete permission)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params;

    // Check permission
    const { response, userId } = await requirePermission(request, "gallery:delete");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if gallery exists
    const existingGallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      include: { images: true },
    });

    if (!existingGallery) {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }

    // Delete gallery (images will be cascade deleted)
    await prisma.gallery.delete({
      where: { id: galleryId },
    });

    console.log("✅ Gallery deleted:", galleryId);

    return NextResponse.json({
      success: true,
      message: "Gallery deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting gallery:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Gallery not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete gallery" },
      { status: 500 }
    );
  }
}
