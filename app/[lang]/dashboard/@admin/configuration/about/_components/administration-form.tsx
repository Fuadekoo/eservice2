"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  administrationSchema,
  AdministrationFormValues,
} from "../_schema";
import { FormInput } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Administration } from "../_types";
import { SingleImageUpload } from "./single-image-upload";

interface AdministrationFormProps {
  administration?: Administration | null;
  onSubmit: (data: AdministrationFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AdministrationForm({
  administration,
  onSubmit,
  onCancel,
  isLoading = false,
}: AdministrationFormProps) {
  const form = useForm<AdministrationFormValues>({
    resolver: zodResolver(administrationSchema),
    defaultValues: administration
      ? {
          name: administration.name,
          description: administration.description || "",
          image: administration.image,
        }
      : {
          name: "",
          description: "",
          image: "",
        },
  });

  const handleSubmit = async (data: AdministrationFormValues) => {
    await onSubmit(data);
  };

  const image = form.watch("image");

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormInput
          name="name"
          label="Full Name *"
          placeholder="Enter administrator full name"
        />

        <Field>
          <FieldLabel>Description (Optional)</FieldLabel>
          <Textarea
            placeholder="Enter administrator description or role"
            {...form.register("description")}
            rows={4}
            className={form.formState.errors.description ? "border-destructive" : ""}
          />
          {form.formState.errors.description && (
            <FieldDescription className="text-destructive">
              {form.formState.errors.description.message}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel>Photo *</FieldLabel>
          <SingleImageUpload
            value={image || null}
            onChange={(filename) => {
              form.setValue("image", filename || "", { shouldValidate: true });
            }}
            error={form.formState.errors.image?.message}
          />
        </Field>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !image}>
            {isLoading
              ? "Saving..."
              : administration
              ? "Update Administrator"
              : "Create Administrator"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

