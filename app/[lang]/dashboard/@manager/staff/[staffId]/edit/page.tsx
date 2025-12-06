"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StaffForm } from "../../_components/staff-form";
import { StaffFormValues } from "../../_schema";
import { Staff } from "../../_types";
import { useStaffStore } from "../../_store/staff-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditStaffPage() {
  const params = useParams<{ lang: string; staffId: string }>();
  const router = useRouter();
  const { lang, staffId } = params;
  const langParam = lang || "en";
  const { updateStaff, isLoading } = useStaffStore();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [managerOfficeId, setManagerOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/staff/${staffId}`);
        const result = await response.json();

        if (result.success) {
          const staffData = result.data;
          setStaff({
            ...staffData,
            createdAt: new Date(staffData.createdAt),
            updatedAt: new Date(staffData.updatedAt),
          });
          setManagerOfficeId(staffData.officeId);
        } else {
          toast.error(result.error || "Failed to load staff");
          router.push(`/${langParam}/dashboard/staff`);
        }
      } catch (error: any) {
        console.error("Error fetching staff:", error);
        toast.error("Failed to load staff");
        router.push(`/${langParam}/dashboard/staff`);
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchStaff();
    }
  }, [staffId, router, langParam]);

  const handleSubmit = async (data: StaffFormValues) => {
    if (!staffId) return;

    try {
      const success = await updateStaff(staffId, data);
      if (success) {
        toast.success("Staff updated successfully");
        router.push(`/${langParam}/dashboard/staff`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update staff");
    }
  };

  const handleCancel = () => {
    router.push(`/${langParam}/dashboard/staff`);
  };

  if (loading) {
    return (
      <div className="w-full h-full py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="w-full h-full py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Staff not found</p>
          <Button onClick={() => router.push(`/${langParam}/dashboard/staff`)} className="mt-4">
            Back to Staff
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full py-6 space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Staff</h1>
          <p className="text-muted-foreground mt-1">
            Update staff member information
          </p>
        </div>
      </div>

      <div className="w-full">
        <StaffForm
          staff={staff}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          managerOfficeId={managerOfficeId}
        />
      </div>
    </div>
  );
}

