"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gallerySchema, GalleryFormValues } from "../_schema";
import { FormInput } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Gallery } from "../_types";
import { ImageUpload } from "./image-upload";

interface GalleryFormProps {
  gallery?: Gallery | null;
  onSubmit: (data: GalleryFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GalleryForm({
  gallery,
  onSubmit,
  onCancel,
  isLoading = false,
}: GalleryFormProps) {
  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: gallery
      ? {
          name: gallery.name,
          description: gallery.description || "",
          images: gallery.images.map((img) => img.filename),
        }
      : {
          name: "",
          description: "",
          images: [],
        },
  });

  const handleSubmit = async (data: GalleryFormValues) => {
    await onSubmit(data);
  };

  const images = form.watch("images");

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormInput
          name="name"
          label="Gallery Name"
          placeholder="Enter gallery name"
        />

        <Field>
          <FieldLabel>Description (Optional)</FieldLabel>
          <Textarea
            placeholder="Enter gallery description"
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
          <FieldLabel>Images *</FieldLabel>
          <ImageUpload
            value={images}
            onChange={(filenames) => {
              form.setValue("images", filenames, { shouldValidate: true });
            }}
            error={form.formState.errors.images?.message}
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
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : gallery
              ? "Update Gallery"
              : "Create Gallery"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

