"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  serviceSchema,
  ServiceFormValues,
  RequirementFormValues,
  ServiceForFormValues,
} from "../_schema";
import { FormInput } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { Service, Requirement, ServiceFor } from "../_types";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface ServiceFormProps {
  service?: Service | null;
  onSubmit: (data: ServiceFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  managerOfficeId?: string | null;
}

export function ServiceForm({
  service,
  onSubmit,
  onCancel,
  isLoading = false,
  managerOfficeId,
}: ServiceFormProps) {
  const [requirementInput, setRequirementInput] = useState("");
  const [serviceForInput, setServiceForInput] = useState("");

  const form = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description,
          timeToTake: service.timeToTake || "",
          officeId: managerOfficeId || service.officeId || "",
          requirements: (service.requirements || []).map((r) => ({
            name: r.name,
            description: r.description || undefined,
          })),
          serviceFors: (service.serviceFors || []).map((sf) => ({
            name: sf.name,
            description: sf.description || undefined,
          })),
        }
      : {
          name: "",
          description: "",
          timeToTake: "",
          officeId: managerOfficeId || "",
          requirements: [],
          serviceFors: [],
        },
  });

  const requirements = form.watch("requirements") || [];
  const serviceFors = form.watch("serviceFors") || [];

  // Automatically set officeId to manager's office (always use manager's office)
  useEffect(() => {
    if (managerOfficeId) {
      form.setValue("officeId", managerOfficeId);
    }
  }, [managerOfficeId, form]);

  // Reset form when switching between create/edit modes
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description,
        timeToTake: service.timeToTake || "",
        officeId: managerOfficeId || service.officeId || "",
        requirements: (service.requirements || []).map((r) => ({
          name: r.name,
          description: r.description || undefined,
        })),
        serviceFors: (service.serviceFors || []).map((sf) => ({
          name: sf.name,
          description: sf.description || undefined,
        })),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        timeToTake: "",
        officeId: managerOfficeId || "",
        requirements: [],
        serviceFors: [],
      });
    }
    setRequirementInput("");
    setServiceForInput("");
  }, [service, managerOfficeId, form]);

  // Add requirement
  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      const newRequirement: RequirementFormValues = {
        name: requirementInput.trim(),
        description: "",
      };
      const currentRequirements = form.getValues("requirements") || [];
      form.setValue("requirements", [...currentRequirements, newRequirement]);
      setRequirementInput("");
    }
  };

  // Remove requirement
  const handleRemoveRequirement = (index: number) => {
    const currentRequirements = form.getValues("requirements") || [];
    form.setValue(
      "requirements",
      currentRequirements.filter((_, i) => i !== index)
    );
  };

  // Add serviceFor
  const handleAddServiceFor = () => {
    if (serviceForInput.trim()) {
      const newServiceFor: ServiceForFormValues = {
        name: serviceForInput.trim(),
        description: "",
      };
      const currentServiceFors = form.getValues("serviceFors") || [];
      form.setValue("serviceFors", [...currentServiceFors, newServiceFor]);
      setServiceForInput("");
    }
  };

  // Remove serviceFor
  const handleRemoveServiceFor = (index: number) => {
    const currentServiceFors = form.getValues("serviceFors") || [];
    form.setValue(
      "serviceFors",
      currentServiceFors.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (data: ServiceFormValues) => {
    // Always ensure officeId is set to manager's office
    const submitData = {
      ...data,
      officeId: managerOfficeId || data.officeId,
    };
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Hidden field to ensure officeId is always set to manager's office */}
      <input type="hidden" {...form.register("officeId")} />

      <FormInput
        control={form.control}
        name="name"
        label="Service Name"
        placeholder="Enter service name"
      />

      <Field>
        <FieldLabel>Description</FieldLabel>
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <>
              <Textarea
                {...field}
                placeholder="Enter service description"
                rows={4}
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

      <FormInput
        control={form.control}
        name="timeToTake"
        label="Time to Take"
        placeholder="e.g., 5-7 business days, 2 weeks, etc."
        description="Estimated time required to complete this service"
      />

      {/* Requirements Section */}
      <Field>
        <FieldLabel>Requirements</FieldLabel>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={requirementInput}
              onChange={(e) => setRequirementInput(e.target.value)}
              placeholder="Enter requirement name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddRequirement();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddRequirement}
              disabled={!requirementInput.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          {requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requirements.map((req, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {req.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Field>

      {/* Service For Section */}
      <Field>
        <FieldLabel>Service For</FieldLabel>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={serviceForInput}
              onChange={(e) => setServiceForInput(e.target.value)}
              placeholder="Enter service for name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddServiceFor();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddServiceFor}
              disabled={!serviceForInput.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          {serviceFors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceFors.map((sf, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {sf.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveServiceFor(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Field>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : service
            ? "Update Service"
            : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
