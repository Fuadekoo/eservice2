import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { administrationSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";

// PATCH - Update an administration (requires administration:update permission)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check permission
    const { response, userId } = await requirePermission(request, "administration:update");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = administrationSchema.partial().safeParse(body);

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

    // Check if administration exists
    const existingAdministration = await prisma.administration.findUnique({
      where: { id },
    });

    if (!existingAdministration) {
      return NextResponse.json(
        { success: false, error: "Administration not found" },
        { status: 404 }
      );
    }

    // Update administration
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;

    const updatedAdministration = await prisma.administration.update({
      where: { id },
      data: updateData,
    });

    console.log("✅ Administration updated:", id);

    return NextResponse.json({
      success: true,
      data: updatedAdministration,
    });
  } catch (error: any) {
    console.error("❌ Error updating administration:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Administration not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update administration",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an administration (requires administration:manage permission)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check permission
    const { response, userId } = await requirePermission(request, "administration:manage");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if administration exists
    const existingAdministration = await prisma.administration.findUnique({
      where: { id },
    });

    if (!existingAdministration) {
      return NextResponse.json(
        { success: false, error: "Administration not found" },
        { status: 404 }
      );
    }

    // Delete administration
    await prisma.administration.delete({
      where: { id },
    });

    console.log("✅ Administration deleted:", id);

    return NextResponse.json({
      success: true,
      message: "Administration deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting administration:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Administration not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete administration",
      },
      { status: 500 }
    );
  }
}

