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

  // Pagination state
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;

  // Actions - Fetch
  fetchUsers: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => Promise<void>;
  fetchRoles: (officeId?: string | null) => Promise<void>;
  fetchOffices: () => Promise<void>;
  refreshUsers: () => Promise<void>;

  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (query: string) => void;

  // Actions - CRUD
  createUser: (data: UserFormValues) => Promise<boolean>;
  updateUser: (id: string, data: Partial<UserFormValues>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<boolean>;

  // Actions - UI State
  isStatusDialogOpen: boolean;
  setFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setStatusDialogOpen: (open: boolean) => void;
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
  isStatusDialogOpen: false,
  selectedUser: null,
  selectedOfficeId: null,
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  search: "",

  // Fetch users from API with pagination and search
  fetchUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    try {
      set({ isLoading: true });
      const state = get();
      const page = params?.page ?? state.page;
      const pageSize = params?.pageSize ?? state.pageSize;
      const search = params?.search ?? state.search;

      console.log("🔄 Fetching users...", { page, pageSize, search });

      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search && search.trim()) {
        queryParams.append("search", search.trim());
      }

      const response = await fetch(`/api/allUser?${queryParams.toString()}`, {
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

        set({
          users: usersWithDates,
          total: result.total || 0,
          totalPages: result.totalPages || 0,
          page: result.page || page,
          pageSize: result.pageSize || pageSize,
        });

        if (usersWithDates.length === 0) {
          console.log("ℹ️ No users found in database");
        }
      } else {
        console.error("❌ API returned error:", result.error);
        toast.error(result.error || "Failed to fetch users");
        set({ users: [], total: 0, totalPages: 0 });
      }
    } catch (error: any) {
      console.error("❌ Error fetching users:", error);
      toast.error(
        error.message ||
          "Failed to fetch users. Please check your connection and try again."
      );
      set({ users: [], total: 0, totalPages: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch roles from API
  fetchRoles: async (officeId?: string | null) => {
    try {
      const url = officeId ? `/api/role?officeId=${officeId}` : "/api/role";

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
    const state = get();
    await get().fetchUsers({
      page: state.page,
      pageSize: state.pageSize,
      search: state.search,
    });
  },

  // Set page
  setPage: (page: number) => {
    set({ page });
    const state = get();
    get().fetchUsers({
      page,
      pageSize: state.pageSize,
      search: state.search,
    });
  },

  // Set page size
  setPageSize: (size: number) => {
    set({ pageSize: size, page: 1 }); // Reset to page 1 when changing page size
    const state = get();
    get().fetchUsers({ page: 1, pageSize: size, search: state.search });
  },

  // Set search
  setSearch: (query: string) => {
    set({ search: query, page: 1 }); // Reset to page 1 when searching
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
        const state = get();
        await get().fetchUsers({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        }); // Refresh the list
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
      console.log(`📤 Updating user ${id}:`, {
        ...data,
        password: data.password ? "***" : undefined,
      });

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
        const state = get();
        await get().fetchUsers({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        }); // Refresh the list
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
        const state = get();
        await get().fetchUsers({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        }); // Refresh the list
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

  // Toggle user status (activate/deactivate)
  toggleUserStatus: async (id: string, isActive: boolean) => {
    try {
      set({ isSubmitting: true });
      console.log(`🔄 Toggling user ${id} status to ${isActive}`);

      const response = await fetch(`/api/allUser/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📦 Toggle status result:", result);

      if (result.success) {
        toast.success(
          `User ${isActive ? "activated" : "deactivated"} successfully`
        );
        const state = get();
        await get().fetchUsers({
          page: state.page,
          pageSize: state.pageSize,
          search: state.search,
        });
        set({ isStatusDialogOpen: false, selectedUser: null });
        return true;
      } else {
        toast.error(result.error || "Failed to update user status");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Error toggling user status:", error);
      toast.error(
        error.message || "Failed to update user status. Please try again."
      );
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // UI State Actions
  setFormOpen: (open: boolean) => set({ isFormOpen: open }),
  setDeleteDialogOpen: (open: boolean) => set({ isDeleteDialogOpen: open }),
  setStatusDialogOpen: (open: boolean) => set({ isStatusDialogOpen: open }),
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
