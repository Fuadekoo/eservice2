import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { officeSchema } from "@/app/[lang]/dashboard/@admin/office/_schema";

// GET - Fetch a single office by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> | { officeId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const officeId = resolvedParams.officeId;

    if (!officeId) {
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    const office = await prisma.office.findUnique({
      where: { id: officeId },
    });

    if (!office) {
      return NextResponse.json(
        { success: false, error: "Office not found" },
        { status: 404 }
      );
    }

    // Serialize dates properly
    const serializedOffice = {
      ...office,
      startedAt: office.startedAt.toISOString(),
      createdAt: office.createdAt.toISOString(),
      updatedAt: office.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: serializedOffice });
  } catch (error: any) {
    console.error("❌ Error fetching office:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch office",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update an office
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> | { officeId: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Handle params - in Next.js 15+ params might be a Promise
    const resolvedParams = await Promise.resolve(params);
    const officeId = resolvedParams.officeId;

    if (!officeId) {
      console.error("❌ Office ID is missing from request params");
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("📥 PATCH request received:", { id: officeId, body });

    // Validate the data - use partial schema for updates
    const validationResult = officeSchema.partial().safeParse(body);
    if (!validationResult.success) {
      console.error("❌ Validation failed:", validationResult.error.issues);
      console.error("📝 Received data:", JSON.stringify(body, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    console.log("✅ Validation passed, data:", data);

    // Check if user is admin or manager of this office
    const userStaff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    const isAdmin =
      userStaff?.user?.role?.name?.toLowerCase() === "admin" ||
      userStaff?.user?.role?.name?.toLowerCase() === "administrator";

    // If not admin, verify user is manager of this office
    if (!isAdmin) {
      if (!userStaff || userStaff.officeId !== officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only update your own office",
          },
          { status: 403 }
        );
      }

      // Verify user has manager role
      const roleName = userStaff.user?.role?.name?.toLowerCase() || "";
      if (roleName !== "manager" && roleName !== "office_manager") {
        return NextResponse.json(
          {
            success: false,
            error: "Only managers can update office information",
          },
          { status: 403 }
        );
      }

      // Managers cannot update subdomain or status
      if (data.subdomain !== undefined) {
        return NextResponse.json(
          {
            success: false,
            error: "You cannot update subdomain",
          },
          { status: 403 }
        );
      }

      if (data.status !== undefined) {
        return NextResponse.json(
          {
            success: false,
            error: "You cannot update office status",
          },
          { status: 403 }
        );
      }
    }

    // If subdomain is being updated, check if it already exists (and is not the current office)
    if (data.subdomain !== undefined) {
      const subdomainValue = data.subdomain.toLowerCase().trim();
      const existingOffice = await prisma.office.findFirst({
        where: {
          subdomain: subdomainValue,
          id: { not: officeId },
        },
      });

      if (existingOffice) {
        return NextResponse.json(
          {
            success: false,
            error: "Subdomain already exists. Please choose a different one.",
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data - convert empty strings to null and handle dates
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;

    if (data.subdomain !== undefined) {
      updateData.subdomain = data.subdomain.toLowerCase().trim();
    }

    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber =
        data.phoneNumber === "" || !data.phoneNumber ? null : data.phoneNumber;
    }

    if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;

    if (data.address !== undefined) updateData.address = data.address;

    if (data.logo !== undefined) {
      updateData.logo = data.logo === "" || !data.logo ? null : data.logo;
    }

    if (data.slogan !== undefined) {
      updateData.slogan =
        data.slogan === "" || !data.slogan ? null : data.slogan;
    }

    if (data.status !== undefined) {
      updateData.status = Boolean(data.status);
    }

    if (data.startedAt !== undefined) {
      updateData.startedAt =
        data.startedAt instanceof Date
          ? data.startedAt
          : new Date(data.startedAt);
    }

    console.log("📝 Update data prepared:", updateData);

    // Update office
    const office = await prisma.office.update({
      where: { id: officeId },
      data: updateData,
    });

    console.log("✅ Office updated successfully:", office.id);

    return NextResponse.json({
      success: true,
      data: {
        ...office,
        startedAt: office.startedAt.toISOString(),
        createdAt: office.createdAt.toISOString(),
        updatedAt: office.updatedAt.toISOString(),
      },
      message: "Office updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating office:", error);
    console.error("❌ Error details:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Office not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update office",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete an office
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> | { officeId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const officeId = resolvedParams.officeId;

    if (!officeId) {
      console.error("❌ Office ID is missing from request params");
      return NextResponse.json(
        { success: false, error: "Office ID is required" },
        { status: 400 }
      );
    }

    console.log("🗑️ DELETE request received:", { id: officeId });

    await prisma.office.delete({
      where: { id: officeId },
    });

    console.log("✅ Office deleted successfully:", officeId);

    return NextResponse.json({
      success: true,
      message: "Office deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting office:", error);
    console.error("❌ Error details:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Office not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete office",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
