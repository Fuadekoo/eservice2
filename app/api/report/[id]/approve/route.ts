import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

// PATCH - Approve or reject a report (requires report:approve permission)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const reportId = resolvedParams.id;

    // Check permission
    const { response, userId } = await requirePermission(request, "report:approve");
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'approve' or 'reject'",
        },
        { status: 400 }
      );
    }

    // Fetch report - only if sent TO this user (manager or admin)
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        reportSentTo: userId,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found or access denied" },
        { status: 404 }
      );
    }

    // Update report status
    // Using "read" for approved and "archived" for rejected
    const newStatus = action === "approve" ? "read" : "archived";

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        receiverStatus: newStatus,
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
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            staffs: {
              select: {
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

    // Serialize dates
    const serializedReport = {
      ...updatedReport,
      createdAt: updatedReport.createdAt.toISOString(),
      updatedAt: updatedReport.updatedAt.toISOString(),
      fileData: updatedReport.fileData.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
      reportSentByUser: updatedReport.reportSentByUser
        ? {
            ...updatedReport.reportSentByUser,
            office: updatedReport.reportSentByUser.staffs?.[0]?.office || null,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: serializedReport,
      message: `Report ${
        action === "approve" ? "approved" : "rejected"
      } successfully`,
    });
  } catch (error: any) {
    console.error("❌ Error updating report status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update report status",
      },
      { status: 500 }
    );
  }
}
