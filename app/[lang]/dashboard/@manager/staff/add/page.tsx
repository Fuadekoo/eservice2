"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { StaffForm } from "../_components/staff-form";
import { StaffCreateValues, StaffUpdateValues } from "../_schema";
import { useStaffStore } from "../_store/staff-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddStaffPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const { createStaff, isLoading } = useStaffStore();
  const [managerOfficeId, setManagerOfficeId] = useState<string | null>(null);

  // Get manager's office ID from staff
  useEffect(() => {
    const fetchOfficeId = async () => {
      try {
        const response = await fetch("/api/staff?page=1&pageSize=1");
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          setManagerOfficeId(result.data[0].officeId);
        }
      } catch (error) {
        console.error("Error fetching office ID:", error);
      }
    };
    fetchOfficeId();
  }, []);

  const handleSubmit = async (data: StaffCreateValues | StaffUpdateValues) => {
    try {
      // Since this is the add page, the form will always pass StaffCreateValues
      // But TypeScript doesn't know this, so we ensure the required fields exist
      if (!data.username || !data.phoneNumber || !data.password) {
        toast.error("All fields are required");
        return;
      }
      const success = await createStaff(data as StaffCreateValues);
      if (success) {
        toast.success("Staff created successfully");
        router.push(`/${lang}/dashboard/staff`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create staff");
    }
  };

  const handleCancel = () => {
    router.push(`/${lang}/dashboard/staff`);
  };

  if (!managerOfficeId) {
    return (
      <div className="w-full h-dvh py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh py-6 space-y-6 px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold tracking-tight">Add Staff</h1>
          <p className="text-muted-foreground mt-1">
            Add a new staff member to your office
          </p>
        </div>
      </div>

      <div className="w-full">
        <StaffForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          managerOfficeId={managerOfficeId}
        />
      </div>
    </div>
  );
}

