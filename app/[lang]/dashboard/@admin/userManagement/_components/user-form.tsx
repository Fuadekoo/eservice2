"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userSchema,
  userUpdateSchema,
  UserFormValues,
  UserUpdateValues,
} from "../_schema";
import { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "../_types";
import { useUserStore } from "../_store";

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: UserFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
}: UserFormProps) {
  const {
    offices,
    roles,
    fetchOffices,
    fetchRoles,
    selectedOfficeId,
    setSelectedOfficeId,
  } = useUserStore();

  const form = useForm<UserFormValues | UserUpdateValues>({
    resolver: zodResolver(user ? userUpdateSchema : userSchema),
    defaultValues: user
      ? {
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email || "",
          password: "", // Don't pre-fill password
          roleId: user.roleId,
          officeId: user.officeId || "",
          username: user.username || "",
        }
      : {
          name: "",
          phoneNumber: "",
          email: "",
          password: "",
          roleId: "",
          officeId: "",
          username: "",
        },
  });

  // Fetch offices and roles on mount
  useEffect(() => {
    fetchOffices();
    fetchRoles();
  }, [fetchOffices, fetchRoles]);

  // Fetch roles when office selection changes
  const watchedOfficeId = form.watch("officeId");
  useEffect(() => {
    if (watchedOfficeId) {
      fetchRoles(watchedOfficeId);
      setSelectedOfficeId(watchedOfficeId);
    } else {
      fetchRoles();
      setSelectedOfficeId(null);
    }
  }, [watchedOfficeId, fetchRoles, setSelectedOfficeId]);

  const handleSubmit = async (data: UserFormValues | UserUpdateValues) => {
    await onSubmit(data as UserFormValues);
  };

  // Filter roles by selected office
  const availableRoles = watchedOfficeId
    ? roles.filter(
        (role) => role.officeId === watchedOfficeId || !role.officeId
      ) // Include roles for this office or global roles
    : roles;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          control={form.control}
          name="name"
          label="Full Name"
          placeholder="Enter full name"
        />
        <FormInput
          control={form.control}
          name="phoneNumber"
          label="Phone Number"
          placeholder="0912345678 or +251912345678"
          type="tel"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          control={form.control}
          name="email"
          label="Email (Optional)"
          placeholder="user@example.com"
          type="email"
        />
        <FormInput
          control={form.control}
          name="username"
          label="Username (Optional)"
          placeholder="username"
        />
      </div>

      <Field>
        <FieldLabel>Office</FieldLabel>
        <Controller
          control={form.control}
          name="officeId"
          render={({ field, fieldState }) => (
            <>
              <Select
                value={field.value || undefined}
                onValueChange={(value) => {
                  field.onChange(value || undefined);
                  // Clear role selection when office changes
                  form.setValue("roleId", undefined);
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select an office (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {offices
                    .filter((office) => office.status) // Only show active offices
                    .map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}{" "}
                        {office.roomNumber && `(${office.roomNumber})`}
                      </SelectItem>
                    ))}
                  {offices.filter((office) => office.status).length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No active offices available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <FieldDescription className="text-destructive mt-1">
                  {fieldState.error.message}
                </FieldDescription>
              )}
              <FieldDescription className="mt-1">
                Select an office to assign the user to. This will filter
                available roles.
              </FieldDescription>
            </>
          )}
        />
      </Field>

      <Field>
        <FieldLabel>Role *</FieldLabel>
        <Controller
          control={form.control}
          name="roleId"
          render={({ field, fieldState }) => (
            <>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={availableRoles.length === 0}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {watchedOfficeId
                        ? "No roles available for this office"
                        : "Loading roles..."}
                    </div>
                  ) : (
                    availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                        {role.office && ` (${role.office.name})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <FieldDescription className="text-destructive mt-1">
                  {fieldState.error.message}
                </FieldDescription>
              )}
              <FieldDescription className="mt-1">
                Select a role for the user. Available roles are filtered by the
                selected office.
              </FieldDescription>
            </>
          )}
        />
      </Field>

      <Field>
        <FieldLabel>
          Password {user ? "(Leave empty to keep current)" : "*"}
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
                placeholder={user ? "Enter new password" : "Enter password"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && (
                <FieldDescription className="text-destructive mt-1">
                  {fieldState.error.message}
                </FieldDescription>
              )}
              <FieldDescription className="mt-1">
                {user
                  ? "Leave empty to keep current password. If provided, password must be at least 8 characters with uppercase, lowercase, and number."
                  : "Password must be at least 8 characters with uppercase, lowercase, and number."}
              </FieldDescription>
            </>
          )}
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
          {isLoading ? "Saving..." : user ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
