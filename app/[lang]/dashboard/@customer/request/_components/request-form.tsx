"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerRequestFormValues, customerRequestSchema } from "../_schema";
import { Service, Request } from "../_types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface RequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerRequestFormValues) => Promise<void>;
  services: Service[];
  selectedRequest?: Request | null;
  isSubmitting: boolean;
}

export function RequestForm({
  open,
  onOpenChange,
  onSubmit,
  services,
  selectedRequest,
  isSubmitting,
}: RequestFormProps) {
  const form = useForm({
    resolver: zodResolver(customerRequestSchema),
    defaultValues: {
      serviceId: "",
      currentAddress: "",
      date: new Date(),
    },
  });

  // Reset form when dialog opens/closes or selectedRequest changes
  useEffect(() => {
    if (open) {
      if (selectedRequest) {
        // Edit mode
        form.reset({
          serviceId: selectedRequest.serviceId,
          currentAddress: selectedRequest.currentAddress,
          date: selectedRequest.date,
        });
      } else {
        // Create mode
        form.reset({
          serviceId: "",
          currentAddress: "",
          date: new Date(),
        });
      }
    }
  }, [open, selectedRequest, form]);

  const handleSubmit = async (data: CustomerRequestFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedRequest ? "Edit Request" : "Create New Request"}
          </DialogTitle>
          <DialogDescription>
            {selectedRequest
              ? "Update your request details. Note: You can only edit pending requests."
              : "Fill in the details to create a new service request."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Controller
            control={form.control}
            name="serviceId"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Service *</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No services available
                      </div>
                    ) : (
                      services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {service.office.name} - Room{" "}
                              {service.office.roomNumber}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <FieldDescription className="text-destructive">
                    {fieldState.error.message}
                  </FieldDescription>
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="currentAddress"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Current Address *</FieldLabel>
                <Input
                  {...field}
                  placeholder="Enter your current address"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <FieldDescription className="text-destructive">
                    {fieldState.error.message}
                  </FieldDescription>
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Request Date *</FieldLabel>
                <Input
                  type="date"
                  value={
                    field.value
                      ? new Date(field.value as Date | string)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const dateValue = e.target.value
                      ? new Date(e.target.value)
                      : new Date();
                    field.onChange(dateValue);
                  }}
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <FieldDescription className="text-destructive">
                    {fieldState.error.message}
                  </FieldDescription>
                )}
              </Field>
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {selectedRequest ? "Update Request" : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
