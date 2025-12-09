import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET - Get a single report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const reportId = resolvedParams.id;

    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is staff
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

    const isStaff = dbUser.role?.name?.toLowerCase() === "staff";
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
      report.reportSentBy !== session.user.id &&
      report.reportSentTo !== session.user.id
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
