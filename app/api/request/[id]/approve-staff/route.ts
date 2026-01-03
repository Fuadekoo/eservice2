import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { canStaffApproveService } from "@/lib/service-staff-assignment";
import { sendSMS } from "@/lib/utils/sms";

/**
 * POST - Approve request as staff (requires request:approve-staff permission)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check permission
    const { response, userId } = await requirePermission(
      request,
      "request:approve-staff"
    );
    if (response) return response;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

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
        { success: false, error: "Only staff can approve requests" },
        { status: 403 }
      );
    }

    // Get staff's staff record
    const staffRecord = await prisma.staff.findFirst({
      where: { userId: userId },
      select: { id: true },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { note, action = "approve" } = body; // action: "approve" or "reject", defaults to "approve"

    // Get the request with current approval status
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        service: {
          select: {
            id: true,
            officeId: true,
          },
        },
      },
    });

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Verify staff can approve this service
    const canApprove = await canStaffApproveService(
      staffRecord.id,
      requestData.serviceId
    );

    if (!canApprove) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this service or cannot approve it",
        },
        { status: 403 }
      );
    }

    // Check if already processed by staff
    if (requestData.approveStaffId) {
      return NextResponse.json(
        { success: false, error: "Request already processed by staff" },
        { status: 400 }
      );
    }

    // Determine staff status based on action
    const staffStatus: "pending" | "approved" | "rejected" =
      action === "approve" ? "approved" : "rejected";
    const hasManagerApproved = !!requestData.approveManagerId;
    const managerStatus = requestData.statusbyadmin || "pending";

    // Update the request with staff approval/rejection
    const updateData: any = {
      statusbystaff: staffStatus,
      approveNote: note || null,
    };

    // Only set approveStaffId if approving
    if (action === "approve") {
      updateData.approveStaffId = staffRecord.id;
    } else {
      // If rejecting, clear approveStaffId
      updateData.approveStaffId = null;
    }

    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        service: {
          include: {
            office: {
              select: {
                id: true,
                name: true,
                roomNumber: true,
                address: true,
                status: true,
              },
            },
          },
        },
        approveStaff: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
        approveManager: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
              },
            },
          },
        },
        fileData: true,
        appointments: true,
      },
    });

    // Send SMS to customer when request is approved/rejected by staff
    if (action === "approve" && updatedRequest.user.phoneNumber) {
      // Check if manager has already approved (final approval)
      const isFullyApproved = updatedRequest.statusbyadmin === "approved";

      if (isFullyApproved) {
        // Both staff and manager approved - send final approval message
        try {
          const customerMessage = `✅ Gaaffii Tajaajilaa Milkaa'ee!

Maaloo ${updatedRequest.user.username},

Odeeffannoo gammachuu! Gaaffii tajaajilaa keessan guutuu milkaa'ee amma hojii irratti jira.

📋 Odeeffannoo Gaaffii:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tajaajilaa: ${updatedRequest.service.name}
ID Gaaffii: ${updatedRequest.id.slice(0, 8).toUpperCase()}
Guyyaa Gaaffii: ${new Date(updatedRequest.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
Haala: ✅ GUUTUU MILKAA'EERA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 Odeeffannoo Waajjiraa:
Waajjira: ${updatedRequest.service.office.name}
Kutaa: ${updatedRequest.service.office.roomNumber}
Teessoo: ${updatedRequest.service.office.address}

${note ? `📝 Barreeffama Hojjettootaa: ${note}\n\n` : ""}Hojii Itti Aanuu:
Gaaffii keessan amma tarkaanfii hojii keessatti jira. Yeroo dhiyeessaan walgahii fi hojii itti aanuu irratti nuun qunnamti.

Haala gaaffii keessan fi walgahii adda addaa dashboard fayyadamaa keessan irratti ilaaluu dandeessan.

E-Service Platform filachuuf galata guddaa!

Haala gaariin,
Godinaa shawa baha irraa`;

          await sendSMS(updatedRequest.user.phoneNumber, customerMessage);
          console.log(
            `✅ Final approval SMS sent to customer: ${updatedRequest.user.phoneNumber}`
          );
        } catch (smsError: any) {
          console.error(
            "⚠️ Failed to send final approval SMS to customer:",
            smsError
          );
        }
      } else {
        // Only staff approved - send pending manager approval message
        try {
          const customerMessage = `⏳ Fooyya'iinsa Gaaffii Tajaajilaa

Maaloo ${updatedRequest.user.username},

Gaaffii tajaajilaa keessan hojjettoonni ilaalamtee milkaa'eera. Amma manaajeriin milkaa'uu dhabbataa eegaa jira.

📋 Odeeffannoo Gaaffii:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tajaajilaa: ${updatedRequest.service.name}
ID Gaaffii: ${updatedRequest.id.slice(0, 8).toUpperCase()}
Haala: ⏳ Manaajeriin Milkaa'uu Eegaa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  note ? `📝 Barreeffama Hojjettootaa: ${note}\n\n` : ""
}Gaaffii keessan haala gaariin hordofaa jira. Manaajeriin ilaaluu fi murtii dhabbataa murteessuun booda odeeffannoo biraa argattu.

Obseessuu keessan irratti galata guddaa.

Haala gaariin,
Godina Shawa Bahaa irraa`;
          await sendSMS(updatedRequest.user.phoneNumber, customerMessage);
          console.log(
            `✅ Staff approval SMS sent to customer: ${updatedRequest.user.phoneNumber}`
          );
        } catch (smsError: any) {
          console.error(
            "⚠️ Failed to send staff approval SMS to customer:",
            smsError
          );
        }
      }
    } else if (action === "reject" && updatedRequest.user.phoneNumber) {
      try {
        const customerMessage = `❌ Fooyya'iinsa Gaaffii Tajaajilaa

Maaloo ${updatedRequest.user.username},

Gaaffii tajaajilaa keessan ilaalamtee milkaa'uu hin dandeenye jedhuun gaddisiisaa jirra.

📋 Odeeffannoo Gaaffii:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tajaajilaa: ${updatedRequest.service.name}
ID Gaaffii: ${updatedRequest.id.slice(0, 8).toUpperCase()}
Haala: ❌ HIN MILKAA'AMNE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  note
    ? `📝 Sababa: ${note}\n\n`
    : "📝 Odeeffannoo dabalataa argachuuf waajjira qunnamti.\n\n"
}Gaaffii ykn murtii kana irratti mari'achuuf barbaaddan, waajjira qunnamti.

Rakkoo ta'eef dhiifama gaafanna. Hubannoo keessan irratti galata guddaa.

Haala gaariin,
Gareen E-Service Platform`;

        await sendSMS(updatedRequest.user.phoneNumber, customerMessage);
        console.log(
          `✅ Rejection SMS sent to customer: ${updatedRequest.user.phoneNumber}`
        );
      } catch (smsError: any) {
        console.error("⚠️ Failed to send rejection SMS to customer:", smsError);
      }
    }

    // Serialize dates
    const serializedRequest = {
      ...updatedRequest,
      date: updatedRequest.date.toISOString(),
      createdAt: updatedRequest.createdAt.toISOString(),
      updatedAt: updatedRequest.updatedAt.toISOString(),
      fileData: updatedRequest.fileData.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
      appointments: updatedRequest.appointments.map((apt) => ({
        ...apt,
        date: apt.date.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: serializedRequest,
    });
  } catch (error: any) {
    console.error("❌ Error approving request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve request",
      },
      { status: 500 }
    );
  }
}
