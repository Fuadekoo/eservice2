import { create } from "zustand";
import { toast } from "sonner";
import { User, Role, Office } from "../_types";
import { UserFormValues } from "../_schema";

interface UserStore {
  // State
  users: User[];
  roles: Role[];
  offices: Office[];
  isLoading: boolean;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedUser: User | null;
  selectedOfficeId: string | null; // For filtering roles by office

  // Actions - Fetch
  fetchUsers: () => Promise<void>;
  fetchRoles: (officeId?: string | null) => Promise<void>;
  fetchOffices: () => Promise<void>;
  refreshUsers: () => Promise<void>;

  // Actions - CRUD
  createUser: (data: UserFormValues) => Promise<boolean>;
  updateUser: (id: string, data: Partial<UserFormValues>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;

  // Actions - UI State
  setFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  setSelectedOfficeId: (officeId: string | null) => void;

  // Helpers
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  users: [],
  roles: [],
  offices: [],
  isLoading: false,
  isSubmitting: false,
  isFormOpen: false,
  isDeleteDialogOpen: false,
  selectedUser: null,
  selectedOfficeId: null,

  // Fetch users from API
  fetchUsers: async () => {
    try {
      set({ isLoading: true });
      console.log("🔄 Fetching users...");

      const response = await fetch("/api/allUser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Fetch result:", result);

      if (result.success) {
        const usersData = Array.isArray(result.data) ? result.data : [];
        console.log(`✅ Loaded ${usersData.length} users`);

        // Convert date strings back to Date objects
        const usersWithDates = usersData.map((user: any) => ({
          ...user,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
        }));

        set({ users: usersWithDates });

        if (usersWithDates.length === 0) {
          console.log("ℹ️ No users found in database");
        }
      } else {
        console.error("❌ API returned error:", result.error);
        toast.error(result.error || "Failed to fetch users");
        set({ users: [] });
      }
    } catch (error: any) {
      console.error("❌ Error fetching users:", error);
      toast.error(
        error.message ||
          "Failed to fetch users. Please check your connection and try again."
      );
      set({ users: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch roles from API
  fetchRoles: async (officeId?: string | null) => {
    try {
      const url = officeId
        ? `/api/role?officeId=${officeId}`
        : "/api/role";

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Fetch roles result:", result);

      if (result.success) {
        const rolesData = Array.isArray(result.data) ? result.data : [];
        console.log(`✅ Loaded ${rolesData.length} roles`);

        // Convert date strings back to Date objects
        const rolesWithDates = rolesData.map((role: any) => ({
          ...role,
          createdAt: role.createdAt ? new Date(role.createdAt) : new Date(),
          updatedAt: role.updatedAt ? new Date(role.updatedAt) : new Date(),
        }));

        set({ roles: rolesWithDates });
      } else {
        console.error("❌ API returned error:", result.error);
        set({ roles: [] });
      }
    } catch (error: any) {
      console.error("❌ Error fetching roles:", error);
      set({ roles: [] });
    }
  },

  // Fetch offices from API
  fetchOffices: async () => {
    try {
      const response = await fetch("/api/office", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Fetch offices result:", result);

      if (result.success) {
        const officesData = Array.isArray(result.data) ? result.data : [];
        console.log(`✅ Loaded ${officesData.length} offices`);

        // Convert date strings back to Date objects
        const officesWithDates = officesData.map((office: any) => ({
          ...office,
          startedAt: office.startedAt ? new Date(office.startedAt) : new Date(),
          createdAt: office.createdAt ? new Date(office.createdAt) : new Date(),
          updatedAt: office.updatedAt ? new Date(office.updatedAt) : new Date(),
        }));

        set({ offices: officesWithDates });
      } else {
        console.error("❌ API returned error:", result.error);
        set({ offices: [] });
      }
    } catch (error: any) {
      console.error("❌ Error fetching offices:", error);
      set({ offices: [] });
    }
  },

  // Refresh users (alias for fetchUsers)
  refreshUsers: async () => {
    await get().fetchUsers();
  },

  // Create a new user
  createUser: async (data: UserFormValues) => {
    try {
      set({ isSubmitting: true });
      console.log("📤 Creating user:", { ...data, password: "***" });

      const response = await fetch("/api/allUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Create result:", result);

      if (result.success) {
        toast.success("User created successfully");
        await get().fetchUsers(); // Refresh the list
        set({ isFormOpen: false, selectedUser: null });
        return true;
      } else {
        toast.error(result.error || "Failed to create user");
        if (result.details) {
          console.error("Validation errors:", result.details);
        }
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error creating user:", error);
      toast.error(error.message || "Failed to create user. Please try again.");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Update an existing user
  updateUser: async (id: string, data: Partial<UserFormValues>) => {
    try {
      set({ isSubmitting: true });
      console.log(`📤 Updating user ${id}:`, { ...data, password: data.password ? "***" : undefined });

      const response = await fetch(`/api/allUser/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Update result:", result);

      if (result.success) {
        toast.success("User updated successfully");
        await get().fetchUsers(); // Refresh the list
        set({ isFormOpen: false, selectedUser: null });
        return true;
      } else {
        toast.error(result.error || "Failed to update user");
        if (result.details) {
          console.error("Validation errors:", result.details);
        }
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error updating user:", error);
      toast.error(error.message || "Failed to update user. Please try again.");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete a user
  deleteUser: async (id: string) => {
    try {
      set({ isSubmitting: true });
      console.log("🗑️ Deleting user:", id);

      const response = await fetch(`/api/allUser/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Delete result:", result);

      if (result.success) {
        toast.success("User deleted successfully");
        await get().fetchUsers(); // Refresh the list
        set({ isDeleteDialogOpen: false, selectedUser: null });
        return true;
      } else {
        toast.error(result.error || "Failed to delete user");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error deleting user:", error);
      toast.error(error.message || "Failed to delete user. Please try again.");
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // UI State Actions
  setFormOpen: (open: boolean) => set({ isFormOpen: open }),
  setDeleteDialogOpen: (open: boolean) => set({ isDeleteDialogOpen: open }),
  setSelectedUser: (user: User | null) => set({ selectedUser: user }),
  setSelectedOfficeId: (officeId: string | null) => {
    set({ selectedOfficeId: officeId });
    // Fetch roles filtered by office when office selection changes
    get().fetchRoles(officeId);
  },

  // Helper functions
  getUserById: (id: string) => {
    return get().users.find((user) => user.id === id);
  },
}));

