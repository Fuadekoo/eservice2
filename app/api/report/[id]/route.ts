import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET - Fetch a single report by ID (admin only, must be sent to them)
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

    // Check if user is admin
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

    // Fetch report - only if sent TO this admin
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        reportSentTo: session.user.id,
      },
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
          include: {
            staffs: {
              include: {
                office: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found or access denied" },
        { status: 404 }
      );
    }

    // Serialize dates and include office information
    const serializedReport = {
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      fileData: report.fileData.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
      reportSentByUser: report.reportSentByUser
        ? {
            id: report.reportSentByUser.id,
            username: report.reportSentByUser.username,
            phoneNumber: report.reportSentByUser.phoneNumber,
            office: report.reportSentByUser.staffs?.[0]?.office || null,
          }
        : null,
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
