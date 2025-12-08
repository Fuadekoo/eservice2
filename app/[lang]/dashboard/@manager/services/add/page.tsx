"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ServiceForm } from "../_components/service-form";
import { ServiceFormValues } from "../_schema";
import { useServiceStore } from "../_store/service-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddServicePage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";
  const { createService, isLoading } = useServiceStore();
  const [managerOfficeId, setManagerOfficeId] = useState<string | null>(null);
  const [isLoadingOffice, setIsLoadingOffice] = useState(true);

  // Get manager's office ID from authenticated user's staff relation
  useEffect(() => {
    const fetchOfficeId = async () => {
      try {
        setIsLoadingOffice(true);
        const response = await fetch("/api/manager/office");
        const result = await response.json();
        if (result.success && result.data) {
          setManagerOfficeId(result.data.id);
        } else {
          console.error("Failed to fetch office:", result.error);
          toast.error("Failed to load office information");
        }
      } catch (error) {
        console.error("Error fetching office ID:", error);
        toast.error("Failed to load office information");
      } finally {
        setIsLoadingOffice(false);
      }
    };
    fetchOfficeId();
  }, []);

  const handleSubmit = async (data: ServiceFormValues) => {
    try {
      const success = await createService(data);
      if (success) {
        toast.success("Service created successfully");
        router.push(`/${lang}/dashboard/services`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create service");
    }
  };

  const handleCancel = () => {
    router.push(`/${lang}/dashboard/services`);
  };

  if (isLoadingOffice || !managerOfficeId) {
    return (
      <div className="w-full h-dvh py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold tracking-tight">Create Service</h1>
          <p className="text-muted-foreground mt-1">
            Add a new service for your office
          </p>
        </div>
      </div>

      <div className="w-full pb-6">
        <ServiceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          managerOfficeId={managerOfficeId}
        />
      </div>
    </div>
  );
}
