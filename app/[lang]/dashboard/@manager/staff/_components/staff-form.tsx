"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  staffCreateSchema,
  staffUpdateSchema,
  StaffCreateValues,
  StaffUpdateValues,
} from "../_schema";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { Staff } from "../_types";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormInput } from "@/components/form";
import { Loader2 } from "lucide-react";

interface StaffFormProps {
  staff?: Staff | null;
  onSubmit: (data: StaffCreateValues | StaffUpdateValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  managerOfficeId?: string | null;
}

interface Role {
  id: string;
  name: string;
  officeId: string | null;
}

export function StaffForm({
  staff,
  onSubmit,
  onCancel,
  isLoading = false,
  managerOfficeId,
}: StaffFormProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const form = useForm<StaffCreateValues | StaffUpdateValues>({
    resolver: zodResolver(staff ? staffUpdateSchema : staffCreateSchema),
    defaultValues: staff
      ? {
          username: staff.username,
          phoneNumber: staff.phoneNumber,
          password: "",
          roleId: staff.role?.id || "",
          officeId: managerOfficeId || staff.officeId || "",
        }
      : {
          username: "",
          phoneNumber: "",
          password: "",
          roleId: "",
          officeId: managerOfficeId || "",
        },
  });

  // Fetch roles for the manager's office and auto-select "staff" role when creating
  useEffect(() => {
    const fetchRoles = async () => {
      if (!managerOfficeId) return;
      try {
        setLoadingRoles(true);
        const response = await fetch(`/api/role?officeId=${managerOfficeId}`);
        const result = await response.json();
        if (result.success) {
          const rolesData = result.data || [];

          // Filter out manager and admin roles - staff members can only have staff roles
          const allowedRoles = rolesData.filter((role: Role) => {
            const roleNameLower = role.name.toLowerCase();
            return (
              roleNameLower !== "manager" &&
              roleNameLower !== "office_manager" &&
              roleNameLower !== "admin" &&
              roleNameLower !== "administrator"
            );
          });

          setRoles(allowedRoles);

          // When creating (not editing), automatically set role to "staff"
          if (!staff) {
            const staffRole = allowedRoles.find(
              (role: Role) => role.name.toLowerCase() === "staff"
            );
            if (staffRole) {
              form.setValue("roleId", staffRole.id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [managerOfficeId, staff, form]);

  // Automatically set officeId to manager's office
  useEffect(() => {
    if (managerOfficeId) {
      form.setValue("officeId", managerOfficeId);
    }
  }, [managerOfficeId, form]);

  // Reset form when switching between create/edit modes
  useEffect(() => {
    if (staff) {
      form.reset({
        username: staff.username,
        phoneNumber: staff.phoneNumber,
        password: "",
        roleId: staff.role?.id || "",
        officeId: managerOfficeId || staff.officeId || "",
      });
    } else {
      form.reset({
        username: "",
        phoneNumber: "",
        password: "",
        roleId: "",
        officeId: managerOfficeId || "",
      });
    }
  }, [staff, managerOfficeId, form]);

  const handleSubmit = async (data: StaffCreateValues | StaffUpdateValues) => {
    // Always ensure officeId is set to manager's office
    const submitData: any = {
      username: data.username,
      phoneNumber: data.phoneNumber,
      password: data.password,
      officeId: managerOfficeId || data.officeId,
    };

    // Only include roleId when editing (for create, API will auto-assign staff role)
    if (staff && data.roleId) {
      submitData.roleId = data.roleId;
    }

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Hidden field to ensure officeId is always set to manager's office */}
      <input type="hidden" {...form.register("officeId")} />

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          control={form.control}
          name="username"
          label="Username"
          placeholder="Enter username"
        />
        <FormInput
          control={form.control}
          name="phoneNumber"
          label="Phone Number"
          placeholder="0912345678 or +251912345678"
          type="tel"
        />
      </div>

      <Field>
        <FieldLabel>Role {staff ? "*" : ""}</FieldLabel>
        <Controller
          control={form.control}
          name="roleId"
          render={({ field, fieldState }) => (
            <>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
                disabled={loadingRoles || !staff} // Disable when creating (auto-set to staff)
              >
                <SelectTrigger
                  aria-invalid={staff ? fieldState.invalid : false}
                >
                  <SelectValue
                    placeholder={
                      staff ? "Select a role" : "Staff (Auto-assigned)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingRoles ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No roles available
                    </div>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {/* Only show validation error when editing (staff exists) */}
              {staff && fieldState.error && (
                <FieldDescription className="text-destructive mt-1">
                  {fieldState.error.message}
                </FieldDescription>
              )}
              {!staff && (
                <FieldDescription className="mt-1">
                  New staff members are automatically assigned the "staff" role.
                </FieldDescription>
              )}
            </>
          )}
        />
      </Field>

      <Field>
        <FieldLabel>
          Password {staff ? "(Leave empty to keep current)" : "*"}
        </FieldLabel>
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <>
              <input
                type="password"
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={staff ? "Enter new password" : "Enter password"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && (
                <FieldDescription className="text-destructive mt-1">
                  {fieldState.error.message}
                </FieldDescription>
              )}
              <FieldDescription className="mt-1">
                {staff
                  ? "Leave empty to keep current password. If provided, password must be at least 8 characters with uppercase, lowercase, and number."
                  : "Password must be at least 8 characters with uppercase, lowercase, and number."}
              </FieldDescription>
            </>
          )}
        />
      </Field>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : staff ? "Update Staff" : "Create Staff"}
        </Button>
      </div>
    </form>
  );
}
