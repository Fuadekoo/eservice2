"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { officeSchema, OfficeFormValues } from "../_schema";
import { FormInput } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { Office } from "../_types";
import { format } from "date-fns";
import { LogoUpload } from "./logo-upload";

interface OfficeFormProps {
  office?: Office | null;
  onSubmit: (data: OfficeFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OfficeForm({
  office,
  onSubmit,
  onCancel,
  isLoading = false,
}: OfficeFormProps) {
  const form = useForm({
    resolver: zodResolver(officeSchema),
    defaultValues: office
      ? {
          name: office.name,
          phoneNumber: office.phoneNumber || "",
          roomNumber: office.roomNumber,
          address: office.address,
          subdomain: office.subdomain || "",
          logo: office.logo || "",
          slogan: office.slogan || "",
          status: office.status,
          startedAt: new Date(office.startedAt),
        }
      : {
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

  // Generate subdomain from name when name changes (only for new offices)
  const watchedName = form.watch("name");
  useEffect(() => {
    if (!office && watchedName) {
      // Generate subdomain from name: lowercase, replace spaces with hyphens, remove special chars
      const generatedSubdomain = watchedName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // Only update if subdomain is empty or matches the auto-generated pattern
      const currentSubdomain = form.getValues("subdomain");
      if (!currentSubdomain || currentSubdomain === "") {
        form.setValue("subdomain", generatedSubdomain);
      }
    }
  }, [watchedName, office, form]);

  const handleSubmit = async (data: OfficeFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
        name="subdomain"
        label="Subdomain *"
        placeholder="e.g., education, investment"
        description="Unique subdomain for this office (lowercase, letters, numbers, and hyphens only)"
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

      <Field>
        <div className="flex items-center gap-3">
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <FieldLabel>Active Status</FieldLabel>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Toggle to activate or deactivate this office
        </p>
      </Field>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : office ? "Update Office" : "Create Office"}
        </Button>
      </div>
    </form>
  );
}
