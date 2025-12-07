"use client";

import { useState, useEffect } from "react";
import { Service } from "../_types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Staff {
  id: string;
  userId: string;
  username: string;
  phoneNumber: string;
  isActive: boolean;
  role?: {
    id: string;
    name: string;
  };
  officeId: string;
  office?: {
    id: string;
    name: string;
  };
}

interface ServiceAssignmentDialogProps {
  service: Service | null;
  officeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ServiceAssignmentDialog({
  service,
  officeId,
  open,
  onOpenChange,
  onSuccess,
}: ServiceAssignmentDialogProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch staff from the same office as the service
  useEffect(() => {
    if (open && service && officeId) {
      fetchStaff();
      fetchAssignedStaff();
    }
  }, [open, service, officeId]);

  const fetchStaff = async () => {
    if (!officeId) return;

    setIsLoading(true);
    try {
      // Use the dedicated admin staff API endpoint
      const response = await fetch(`/api/admin/staff?page=1&pageSize=100`);
      const result = await response.json();

      if (result.success && result.data) {
        // The API already filters for "staff" role and the correct office
        // Format staff data
        const formattedStaff: Staff[] = result.data.map((s: any) => ({
          id: s.id,
          userId: s.userId,
          username: s.username,
          phoneNumber: s.phoneNumber,
          isActive: s.isActive,
          role: s.role,
          officeId: s.officeId,
          office: s.office,
        }));
        setStaffList(formattedStaff);
      } else {
        toast.error(result.error || "Failed to fetch staff");
      }
    } catch (error: any) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to fetch staff");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedStaff = async () => {
    if (!service?.id) return;

    try {
      const response = await fetch(`/api/service/${service.id}/staff`);
      const result = await response.json();

      if (result.success && result.data?.assignedStaff) {
        const assignedIds = result.data.assignedStaff.map((s: any) => s.id);
        setSelectedStaffIds(assignedIds);
      }
    } catch (error: any) {
      console.error("Error fetching assigned staff:", error);
    }
  };

  const handleToggleStaff = (staffId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSave = async () => {
    if (!service?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/service/${service.id}/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffIds: selectedStaffIds,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Successfully assigned service to ${selectedStaffIds.length} staff member(s)`
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Failed to assign staff");
      }
    } catch (error: any) {
      console.error("Error assigning staff:", error);
      toast.error("Failed to assign staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Staff to Service</DialogTitle>
          <DialogDescription>
            Select staff members who can approve/reject requests for "
            {service.name}"
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading staff...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              No staff found in this office
            </p>
            <p className="text-sm text-muted-foreground">
              Please add staff members to your office first before assigning them to services.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg divide-y">
              {staffList.map((staff) => {
                const isSelected = selectedStaffIds.includes(staff.id);
                return (
                  <div
                    key={staff.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleToggleStaff(staff.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleStaff(staff.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{staff.username}</p>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">
                            Assigned
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {staff.phoneNumber}
                        </p>
                        {staff.role && (
                          <Badge variant="outline" className="text-xs">
                            {staff.role.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <UserCheck className="w-5 h-5 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedStaffIds.length} of {staffList.length} staff selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Assignments"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
