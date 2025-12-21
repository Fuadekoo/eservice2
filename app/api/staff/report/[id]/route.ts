import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

/**
 * GET - Get a single report by ID (requires report:read permission)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(request, "report:read");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const reportId = resolvedParams.id;

    // Get user with role from database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    const roleName = dbUser.role?.name?.toLowerCase() || "";
    const isStaff = roleName === "staff";
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Staff access required" },
        { status: 403 }
      );
    }

    // Fetch report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        fileData: {
          select: {
            id: true,
            name: true,
            filepath: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        reportSentToUser: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        reportSentByUser: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Verify staff has access to this report (either sent or received)
    if (
      report.reportSentBy !== userId &&
      report.reportSentTo !== userId
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Access denied" },
        { status: 403 }
      );
    }

    // Serialize dates
    const serializedReport = {
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      fileData: report.fileData.map((file: any) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: serializedReport,
    });
  } catch (error: any) {
    console.error("❌ Error fetching report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch report",
      },
      { status: 500 }
    );
  }
}
