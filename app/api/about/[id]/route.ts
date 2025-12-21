import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { aboutSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";

// PATCH - Update an about section (requires about:update permission)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check permission
    const { response, userId } = await requirePermission(request, "about:update");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = aboutSchema.partial().safeParse(body);

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

    // Check if about section exists
    const existingAbout = await prisma.about.findUnique({
      where: { id },
    });

    if (!existingAbout) {
      return NextResponse.json(
        { success: false, error: "About section not found" },
        { status: 404 }
      );
    }

    // Update about section
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;

    const updatedAbout = await prisma.about.update({
      where: { id },
      data: updateData,
    });

    console.log("✅ About section updated:", id);

    return NextResponse.json({
      success: true,
      data: updatedAbout,
    });
  } catch (error: any) {
    console.error("❌ Error updating about section:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "About section not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update about section",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an about section (requires about:manage permission)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check permission
    const { response, userId } = await requirePermission(request, "about:manage");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if about section exists
    const existingAbout = await prisma.about.findUnique({
      where: { id },
    });

    if (!existingAbout) {
      return NextResponse.json(
        { success: false, error: "About section not found" },
        { status: 404 }
      );
    }

    // Delete about section
    await prisma.about.delete({
      where: { id },
    });

    console.log("✅ About section deleted:", id);

    return NextResponse.json({
      success: true,
      message: "About section deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting about section:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "About section not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete about section",
      },
      { status: 500 }
    );
  }
}

