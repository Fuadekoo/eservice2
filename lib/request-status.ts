/**
 * Utility functions for calculating request status
 * cSpell:ignore statusbystaff statusbyadmin
 */

export type RequestStatus = "pending" | "approved" | "rejected";

/**
 * Calculate overall request status based on staff and admin statuses
 * - Both approved → "approved"
 * - Both rejected → "rejected"
 * - Otherwise → "pending"
 */
export function calculateOverallStatus(
  statusbystaff: RequestStatus,
  statusbyadmin: RequestStatus
): RequestStatus {
  if (statusbystaff === "approved" && statusbyadmin === "approved") {
    return "approved";
  }
  if (statusbystaff === "rejected" && statusbyadmin === "rejected") {
    return "rejected";
  }
  return "pending";
}
