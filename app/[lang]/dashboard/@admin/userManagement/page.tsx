"use client";

import { useEffect } from "react";
import { User } from "./_types";
import { UserFormValues } from "./_schema";
import { UserCard } from "./_components/user-card";
import { UserForm } from "./_components/user-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon, Loader2, RefreshCw } from "lucide-react";
import { useUserStore } from "./_store";

export default function UserManagementPage() {
  // Get state and actions from Zustand store
  const {
    users,
    isLoading,
    isSubmitting,
    isFormOpen,
    isDeleteDialogOpen,
    selectedUser,
    fetchUsers,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser,
    setFormOpen,
    setDeleteDialogOpen,
    setSelectedUser,
  } = useUserStore();

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchUsers is stable from Zustand store

  // Handle form submission
  const handleSubmit = async (data: UserFormValues) => {
    if (selectedUser) {
      // For updates, only include password if provided
      const updateData: Partial<UserFormValues> = {
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
        roleId: data.roleId,
        officeId: data.officeId,
        username: data.username,
      };

      // Only include password if it's provided
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateUser(selectedUser.id, updateData);
    } else {
      await createUser(data);
    }
  };

  // Handle edit
  const handleEdit = (user: User) => {
    console.log("✏️ Editing user:", user);
    setSelectedUser(user);
    setFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUser?.id) return;
    await deleteUser(selectedUser.id);
  };

  // Handle create new
  const handleCreateNew = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, assign roles, and assign offices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshUsers}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? "Edit User" : "Create New User"}
                </DialogTitle>
                <DialogDescription>
                  {selectedUser
                    ? "Update user information below."
                    : "Fill in the details to create a new user. Select an office and role to assign permissions."}
                </DialogDescription>
              </DialogHeader>
              <UserForm
                user={selectedUser}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setFormOpen(false);
                  setSelectedUser(null);
                }}
                isLoading={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-lg border border-dashed">
          <UsersIcon className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Get started by creating your first user. Assign roles and offices to
            manage access and permissions.
          </p>
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Your First User
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{selectedUser?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
