/**
 * Utility functions for service-staff assignment validation
 */

import prisma from "@/lib/db";

/**
 * Check if a staff member can approve/reject requests for a specific service
 *
 * Rules:
 * 1. Staff must be assigned to the service (via serviceStaffAssignment)
 * 2. Staff and service must belong to the same office
 *
 * @param staffId - The ID of the staff member
 * @param serviceId - The ID of the service
 * @returns boolean indicating if staff can approve/reject
 */
export async function canStaffApproveService(
  staffId: string,
  serviceId: string
): Promise<boolean> {
  try {
    // Get staff and service with their offices
    const [staff, service] = await Promise.all([
      prisma.staff.findUnique({
        where: { id: staffId },
        include: { office: true },
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
        include: { office: true },
      }),
    ]);

    // Verify both exist
    if (!staff || !service) {
      return false;
    }

    // Verify they belong to the same office
    if (staff.officeId !== service.officeId) {
      return false;
    }

    // Check if staff is assigned to the service
    const assignment = await prisma.serviceStaffAssignment.findUnique({
      where: {
        serviceId_staffId: {
          serviceId,
          staffId,
        },
      },
    });

    return !!assignment;
  } catch (error) {
    console.error("Error checking staff service assignment:", error);
    return false;
  }
}

/**
 * Get all staff members who can approve requests for a specific service
 *
 * @param serviceId - The ID of the service
 * @returns Array of staff members who can approve
 */
export async function getApproversForService(serviceId: string) {
  try {
    const assignments = await prisma.serviceStaffAssignment.findMany({
      where: { serviceId },
      include: {
        staff: {
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
      },
    });

    return assignments.map((assignment) => ({
      staffId: assignment.staff.id,
      userId: assignment.staff.userId,
      username: assignment.staff.user.username,
      phoneNumber: assignment.staff.user.phoneNumber,
    }));
  } catch (error) {
    console.error("Error getting approvers for service:", error);
    return [];
  }
}

/**
 * Check if a service has any staff assigned
 *
 * @param serviceId - The ID of the service
 * @returns boolean indicating if service has assigned staff
 */
export async function serviceHasAssignedStaff(
  serviceId: string
): Promise<boolean> {
  try {
    const count = await prisma.serviceStaffAssignment.count({
      where: { serviceId },
    });

    return count > 0;
  } catch (error) {
    console.error("Error checking service staff assignment:", error);
    return false;
  }
}
