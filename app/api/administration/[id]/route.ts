import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { administrationSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";

// PATCH - Update an administration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

// DELETE - Delete an administration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

