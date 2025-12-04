"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aboutSchema, AboutFormValues } from "../_schema";
import { FormInput } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { About } from "../_types";
import { SingleImageUpload } from "./single-image-upload";

interface AboutFormProps {
  about?: About | null;
  onSubmit: (data: AboutFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AboutForm({
  about,
  onSubmit,
  onCancel,
  isLoading = false,
}: AboutFormProps) {
  const form = useForm<AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: about
      ? {
          name: about.name,
          description: about.description || "",
          image: about.image,
        }
      : {
          name: "",
          description: "",
          image: "",
        },
  });

  const handleSubmit = async (data: AboutFormValues) => {
    await onSubmit(data);
  };

  const image = form.watch("image");

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormInput
          name="name"
          label="Section Name *"
          placeholder="Enter section name (e.g., Our Mission, Our Vision)"
        />

        <Field>
          <FieldLabel>Description (Optional)</FieldLabel>
          <Textarea
            placeholder="Enter detailed description"
            {...form.register("description")}
            rows={6}
            className={form.formState.errors.description ? "border-destructive" : ""}
          />
          {form.formState.errors.description && (
            <FieldDescription className="text-destructive">
              {form.formState.errors.description.message}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel>Image *</FieldLabel>
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
              : about
              ? "Update About Section"
              : "Create About Section"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

