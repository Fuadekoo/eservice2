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
import { toast } from "sonner";

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
    mode: "onSubmit", // Only validate on submit, not on change/blur
    reValidateMode: "onSubmit",
    defaultValues: user
      ? {
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email || "",
          password: "", // Don't pre-fill password
          roleId: user.roleId || "",
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

  // Reset form when user changes (switching between create/edit)
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email || "",
        password: "",
        roleId: user.roleId || "",
        officeId: user.officeId || "",
        username: user.username || "",
      });
    } else {
      form.reset({
        name: "",
        phoneNumber: "",
        email: "",
        password: "",
        roleId: "",
        officeId: "",
        username: "",
      });
    }
  }, [user, form]);

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
    console.log("📋 Form data before processing:", data);

    // Get the current form values to ensure we have the latest
    const currentValues = form.getValues();
    console.log("📋 Current form values:", currentValues);

    // Ensure all string fields are not undefined (convert undefined to empty string)
    const formData: UserFormValues = {
      name: data.name || currentValues.name || "",
      phoneNumber: data.phoneNumber || currentValues.phoneNumber || "",
      email: data.email || currentValues.email || "",
      password: data.password || currentValues.password || "",
      roleId: data.roleId || currentValues.roleId || "",
      officeId: data.officeId || currentValues.officeId || "",
      username: data.username || currentValues.username || "",
    };

    console.log("📋 Processed form data:", { ...formData, password: "***" });

    // For new users, ensure office and role are set
    if (!user) {
      if (!formData.officeId || formData.officeId.trim() === "") {
        form.setError("officeId", {
          type: "manual",
          message: "Office is required",
        });
        return;
      }

      if (!formData.roleId || formData.roleId.trim() === "") {
        form.setError("roleId", {
          type: "manual",
          message: "Role is required. Please select a manager or staff role.",
        });
        return;
      }

      // Verify the selected role is a manager or staff role
      const selectedRole = roles.find((r) => r.id === formData.roleId);
      if (!selectedRole) {
        form.setError("roleId", {
          type: "manual",
          message: "Selected role not found. Please select a valid role.",
        });
        return;
      }

      const isManagerOrStaffRole =
        selectedRole.name.toLowerCase() === "manager" ||
        selectedRole.name.toLowerCase() === "office_manager" ||
        selectedRole.name.toLowerCase() === "staff";
      if (!isManagerOrStaffRole) {
        form.setError("roleId", {
          type: "manual",
          message: "Only manager and staff roles can be assigned to new users",
        });
        return;
      }
    }

    console.log("📤 Form submission data:", { ...formData, password: "***" });
    await onSubmit(formData);
  };

  // Filter roles by selected office
  // For new users, show manager and staff roles
  // For editing, show all roles
  const availableRoles = watchedOfficeId
    ? roles.filter((role) => {
        const isManagerOrStaffRole =
          role.name.toLowerCase() === "manager" ||
          role.name.toLowerCase() === "office_manager" ||
          role.name.toLowerCase() === "staff";
        const matchesOffice =
          role.officeId === watchedOfficeId || !role.officeId;

        // If creating new user, only show manager and staff roles
        if (!user) {
          return matchesOffice && isManagerOrStaffRole;
        }
        // If editing, show all roles for the office
        return matchesOffice;
      })
    : user
    ? roles // When editing and no office selected, show all roles
    : []; // When creating and no office selected, show no roles

  // Check if manager and staff roles exist for the selected office
  const hasManagerRole = availableRoles.some(
    (role) =>
      role.name.toLowerCase() === "manager" ||
      role.name.toLowerCase() === "office_manager"
  );
  const hasStaffRole = availableRoles.some(
    (role) => role.name.toLowerCase() === "staff"
  );

  // Function to create a role for the selected office
  const createRoleForOffice = async (
    roleName: string
  ): Promise<string | null> => {
    if (!watchedOfficeId) {
      toast.error("Please select an office first");
      return null;
    }

    try {
      const response = await fetch("/api/customRole", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roleName,
          officeId: watchedOfficeId,
          permissionIds: [], // No permissions by default
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        toast.success(`${roleName} role created successfully`);
        // Refresh roles list
        await fetchRoles(watchedOfficeId);
        return result.data.id;
      } else {
        toast.error(result.error || `Failed to create ${roleName} role`);
        return null;
      }
    } catch (error: any) {
      console.error(`Error creating ${roleName} role:`, error);
      toast.error(`Failed to create ${roleName} role`);
      return null;
    }
  };

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
        <FieldLabel>Office {!user && "*"}</FieldLabel>
        <Controller
          control={form.control}
          name="officeId"
          render={({ field, fieldState }) => (
            <>
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  if (value) {
                    field.onChange(value);
                    // Clear role selection when office changes
                    form.setValue("roleId", "", { shouldValidate: false });
                    form.clearErrors("roleId");
                  } else {
                    field.onChange("");
                    form.setValue("roleId", "", { shouldValidate: false });
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue
                    placeholder={
                      user
                        ? "Select an office (optional)"
                        : "Select an office *"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
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
                {user
                  ? "Select an office to assign the user to. This will filter available roles."
                  : "Select an office to assign the user to. Only manager and staff roles will be available."}
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
                value={field.value || ""}
                onValueChange={async (value) => {
                  console.log("Role selected:", value);

                  if (!value) {
                    field.onChange("");
                    return;
                  }

                  // Check if it's a special option to create a role
                  if (value === "create_manager" || value === "create_staff") {
                    const roleName =
                      value === "create_manager" ? "manager" : "staff";
                    const createdRoleId = await createRoleForOffice(roleName);

                    if (createdRoleId) {
                      field.onChange(createdRoleId);
                      form.clearErrors("roleId");
                    }
                  } else {
                    // Regular role selection
                    field.onChange(value);
                    form.clearErrors("roleId");
                  }
                }}
                disabled={!watchedOfficeId}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue
                    placeholder={
                      !watchedOfficeId
                        ? "Select an office first"
                        : user
                        ? "Select a role"
                        : "Select a manager or staff role"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {!watchedOfficeId ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Please select an office first
                    </div>
                  ) : user ? (
                    // For editing, show all available roles
                    availableRoles.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No roles available for this office
                      </div>
                    ) : (
                      availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                          {role.office && ` (${role.office.name})`}
                        </SelectItem>
                      ))
                    )
                  ) : (
                    // For creating new user, show manager and staff options
                    <>
                      {!hasManagerRole && (
                        <SelectItem value="create_manager">
                          Manager (Create new)
                        </SelectItem>
                      )}
                      {!hasStaffRole && (
                        <SelectItem value="create_staff">
                          Staff (Create new)
                        </SelectItem>
                      )}
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                          {role.office && ` (${role.office.name})`}
                        </SelectItem>
                      ))}
                      {availableRoles.length === 0 &&
                        hasManagerRole &&
                        hasStaffRole && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Manager and staff roles already exist for this
                            office
                          </div>
                        )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <FieldDescription className="text-destructive mt-1">
                  {fieldState.error.message}
                </FieldDescription>
              )}
              <FieldDescription className="mt-1">
                {user
                  ? "Select a role for the user. Available roles are filtered by the selected office."
                  : "Select a manager or staff role. Only manager and staff roles are available for new users."}
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
                  ? "Leave empty to keep current password. If provided, password must be at least 8 characters."
                  : "Password must be at least 8 characters."}
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
