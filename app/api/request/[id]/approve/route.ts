import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { sendHahuSMS } from "@/lib/utils/hahu-sms";

/**
 * POST - Approve request as manager
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

    // Check if user is manager
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const isManager = dbUser?.role?.name?.toLowerCase() === "manager";

    if (!isManager) {
      return NextResponse.json(
        { success: false, error: "Only managers can approve requests" },
        { status: 403 }
      );
    }

    // Get manager's staff record to get officeId
    const managerStaff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: { id: true, officeId: true },
    });

    if (!managerStaff) {
      return NextResponse.json(
        { success: false, error: "Manager staff record not found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { note, action = "approve" } = body; // action: "approve" or "reject", defaults to "approve"

    // Get the request and verify it belongs to manager's office
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
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
              },
            },
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

    // Verify request belongs to manager's office
    if (requestData.service.officeId !== managerStaff.officeId) {
      return NextResponse.json(
        { success: false, error: "Request does not belong to your office" },
        { status: 403 }
      );
    }

    // Check if already processed by manager
    if (requestData.approveManagerId) {
      return NextResponse.json(
        { success: false, error: "Request already processed by manager" },
        { status: 400 }
      );
    }

    // Determine manager status based on action
    const managerStatus: "pending" | "approved" | "rejected" =
      action === "approve" ? "approved" : "rejected";
    const hasStaffApproved = !!requestData.approveStaffId;
    const staffStatus = requestData.statusbystaff || "pending";

    // Update the request with manager approval/rejection
    const updateData: any = {
      statusbyadmin: managerStatus,
      approveNote: note || null,
    };

    // Only set approveManagerId if approving
    if (action === "approve") {
      updateData.approveManagerId = managerStaff.id;
    } else {
      // If rejecting, clear approveManagerId
      updateData.approveManagerId = null;
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

    // Send SMS to customer when request is approved/rejected
    if (action === "approve" && updatedRequest.user.phoneNumber) {
      try {
        const customerMessage = `✅ Gaaffii Tajaajilaa Milkaa'ee!

Maaloo ${updatedRequest.user.username},

Odeeffannoo gammachuu! Gaaffii tajaajilaa keessan manaajeriin milkaa'eera.

📋 Odeeffannoo Gaaffii:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tajaajilaa: ${updatedRequest.service.name}
ID Gaaffii: ${updatedRequest.id.slice(0, 8).toUpperCase()}
Guyyaa Gaaffii: ${new Date(updatedRequest.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Haala: ✅ MILKAA'EERA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 Odeeffannoo Waajjiraa:
Waajjira: ${updatedRequest.service.office.name}
Kutaa: ${updatedRequest.service.office.roomNumber}
Teessoo: ${updatedRequest.service.office.address}

${note ? `📝 Barreeffama Manaajerii: ${note}\n\n` : ''}Hojii Itti Aanuu:
Gaaffii keessan amma hojii irratti jira. Yeroo dhiyeessaan hojii itti aanuu fi walgahii irratti nuun qunnamti.

Haala gaaffii keessan dashboard fayyadamaa keessan irratti ilaaluu dandeessan.

E-Service Platform fayyadamuuf galata guddaa!

Haala gaariin,
Gareen E-Service Platform`;

        await sendHahuSMS(updatedRequest.user.phoneNumber, customerMessage);
        console.log(`✅ Approval SMS sent to customer: ${updatedRequest.user.phoneNumber}`);
      } catch (smsError: any) {
        console.error("⚠️ Failed to send approval SMS to customer:", smsError);
      }
    } else if (action === "reject" && updatedRequest.user.phoneNumber) {
      try {
        const customerMessage = `❌ Fooyya'iinsa Gaaffii Tajaajilaa

Maaloo ${updatedRequest.user.username},

Gaaffii tajaajilaa keessan ilaalamtee yeroo kanaan milkaa'uu hin dandeenye jedhuun gaddisiisaa jirra.

📋 Odeeffannoo Gaaffii:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tajaajilaa: ${updatedRequest.service.name}
ID Gaaffii: ${updatedRequest.id.slice(0, 8).toUpperCase()}
Haala: ❌ HIN MILKAA'AMNE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${note ? `📝 Sababa: ${note}\n\n` : '📝 Odeeffannoo dabalataa argachuuf waajjira qunnamti.\n\n'}Gaaffii ykn murtii kana irratti mari'achuuf barbaaddan, waajjira qunnamti.

Rakkoo ta'eef dhiifama gaafanna.

Haala gaariin,
Gareen E-Service Platform`;

        await sendHahuSMS(updatedRequest.user.phoneNumber, customerMessage);
        console.log(`✅ Rejection SMS sent to customer: ${updatedRequest.user.phoneNumber}`);
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
