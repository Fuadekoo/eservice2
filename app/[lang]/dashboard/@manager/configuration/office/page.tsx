"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  officeSchema,
  OfficeFormValues,
} from "@/app/[lang]/dashboard/@admin/office/_schema";
import { FormInput } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { format } from "date-fns";
import { LogoUpload } from "@/app/[lang]/dashboard/@admin/office/_components/logo-upload";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Office {
  id: string;
  name: string;
  phoneNumber: string | null;
  roomNumber: string;
  address: string;
  subdomain: string;
  logo: string | null;
  slogan: string | null;
  status: boolean;
  startedAt: string;
}

export default function OfficeEditPage() {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params.lang || "en";
  const [office, setOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OfficeFormValues>({
    resolver: zodResolver(officeSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      roomNumber: "",
      address: "",
      subdomain: "",
      logo: "",
      slogan: "",
      status: true,
      startedAt: new Date(),
    },
  });

  // Fetch office data
  useEffect(() => {
    const fetchOffice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/manager/office");
        const result = await response.json();

        if (result.success && result.data) {
          const officeData = result.data;
          setOffice(officeData);
          form.reset({
            name: officeData.name,
            phoneNumber: officeData.phoneNumber || "",
            roomNumber: officeData.roomNumber,
            address: officeData.address,
            subdomain: officeData.subdomain || "",
            logo: officeData.logo || "",
            slogan: officeData.slogan || "",
            status: officeData.status,
            startedAt: new Date(officeData.startedAt),
          });
        } else {
          toast.error(result.error || "Failed to load office");
        }
      } catch (error: any) {
        console.error("Error fetching office:", error);
        toast.error("Failed to load office");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffice();
  }, [form]);

  const handleSubmit = async (data: OfficeFormValues) => {
    if (!office) return;

    try {
      setIsSubmitting(true);
      // Managers cannot update subdomain or status, so exclude them
      const { subdomain, status, ...updateData } = data;
      const response = await fetch(`/api/office/${office.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Office updated successfully");
        // Refresh office data
        const refreshResponse = await fetch("/api/manager/office");
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success && refreshResult.data) {
          setOffice(refreshResult.data);
        }
      } else {
        toast.error(result.error || "Failed to update office");
      }
    } catch (error: any) {
      console.error("Error updating office:", error);
      toast.error("Failed to update office");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${lang}/dashboard`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full overflow-y-auto py-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="w-full h-full overflow-y-auto py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Office not found</p>
          <Button onClick={handleCancel} className="mt-4">
            Back to Dashboard
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Office</h1>
          <p className="text-muted-foreground mt-1">
            Update your office information
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 pb-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            control={form.control}
            name="name"
            label="Office Name"
            placeholder="Enter office name"
          />
          <FormInput
            control={form.control}
            name="roomNumber"
            label="Room Number"
            placeholder="Enter room number"
          />
        </div>

        <FormInput
          control={form.control}
          name="address"
          label="Address"
          placeholder="Enter office address"
        />

        <FormInput
          control={form.control}
          name="phoneNumber"
          label="Phone Number"
          placeholder="Enter phone number (optional)"
          type="tel"
        />

        <Controller
          control={form.control}
          name="logo"
          render={({ field, fieldState }) => (
            <LogoUpload
              value={field.value || undefined}
              onChange={(url) => field.onChange(url || "")}
              error={fieldState.error?.message}
            />
          )}
        />

        <Field>
          <FieldLabel>Slogan</FieldLabel>
          <Controller
            control={form.control}
            name="slogan"
            render={({ field, fieldState }) => (
              <>
                <Textarea
                  {...field}
                  placeholder="Enter office slogan (optional)"
                  rows={3}
                  aria-invalid={fieldState.invalid}
                  value={field.value || ""}
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </Field>

        <Field>
          <FieldLabel>Start Date</FieldLabel>
          <Controller
            control={form.control}
            name="startedAt"
            render={({ field, fieldState }) => (
              <>
                <input
                  type="date"
                  value={
                    field.value
                      ? format(
                          field.value instanceof Date
                            ? field.value
                            : new Date(field.value as string | number | Date),
                          "yyyy-MM-dd"
                        )
                      : format(new Date(), "yyyy-MM-dd")
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? new Date(e.target.value) : new Date()
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </Field>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update Office"}
          </Button>
        </div>
      </form>
    </div>
  );
}
