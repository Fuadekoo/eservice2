import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { aboutSchema } from "@/app/[lang]/dashboard/@admin/configuration/about/_schema";

// PATCH - Update an about section
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

// DELETE - Delete an about section
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

