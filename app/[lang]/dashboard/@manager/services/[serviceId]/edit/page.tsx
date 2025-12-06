"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceForm } from "../../_components/service-form";
import { ServiceFormValues } from "../../_schema";
import { Service } from "../../_types";
import { useServiceStore } from "../../_store/service-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditServicePage() {
  const params = useParams<{ lang: string; serviceId: string }>();
  const router = useRouter();
  const { lang, serviceId } = params;
  const langParam = lang || "en";
  const { updateService, isLoading } = useServiceStore();
  const [service, setService] = useState<Service | null>(null);
  const [managerOfficeId, setManagerOfficeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/service/${serviceId}`);
        const result = await response.json();

        if (result.success) {
          const serviceData = result.data;
          setService({
            ...serviceData,
            createdAt: new Date(serviceData.createdAt),
            updatedAt: new Date(serviceData.updatedAt),
          });
          setManagerOfficeId(serviceData.officeId);
        } else {
          toast.error(result.error || "Failed to load service");
          router.push(`/${langParam}/dashboard/services`);
        }
      } catch (error: any) {
        console.error("Error fetching service:", error);
        toast.error("Failed to load service");
        router.push(`/${langParam}/dashboard/services`);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId, router]);

  const handleSubmit = async (data: ServiceFormValues) => {
    if (!serviceId) return;

    try {
      const success = await updateService(serviceId, data);
      if (success) {
        toast.success("Service updated successfully");
        router.push(`/${langParam}/dashboard/services/${serviceId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update service");
    }
  };

  const handleCancel = () => {
    router.push(`/${langParam}/dashboard/services/${serviceId}`);
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

  if (!service) {
    return (
      <div className="w-full h-full py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Service not found</p>
          <Button onClick={() => router.push(`/${langParam}/dashboard/services`)} className="mt-4">
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Service</h1>
          <p className="text-muted-foreground mt-1">
            Update service information
          </p>
        </div>
      </div>

      <div className="w-full pb-6">
        <ServiceForm
          service={service}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          managerOfficeId={managerOfficeId}
        />
      </div>
    </div>
  );
}

