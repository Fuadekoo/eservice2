import { create } from "zustand";
import { toast } from "sonner";
import { Role } from "../_types";

interface RoleStore {
  // State
  roles: Role[];
  isLoading: boolean;

  // Actions
  fetchRoles: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  deleteRole: (id: string) => Promise<boolean>;

  // Helpers
  getRoleById: (id: string) => Role | undefined;
  getRolesByOffice: (officeId: string) => Role[];
  getSystemRoles: () => Role[];
  getCustomRoles: () => Role[];
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  // Initial state
  roles: [],
  isLoading: false,

  // Fetch roles from API
  fetchRoles: async () => {
    try {
      set({ isLoading: true });
      const response = await fetch("/api/role", {
        cache: "no-store",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch roles");
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Process roles to add computed fields
        const processedRoles: Role[] = result.data.map((role: Role) => {
          // Check if it's a system role (admin roles without officeId are typically system roles)
          const isSystem = role.name === "ADMIN" || (!role.officeId && role.name.toUpperCase() === "ADMIN");

          return {
            ...role,
            isSystem,
            permissionCount: role.permissions?.length || 0,
            userCount: role.userCount || 0,
          };
        });

        set({ roles: processedRoles });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast.error(error.message || "Failed to load roles");
      set({ roles: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshRoles: async () => {
    await get().fetchRoles();
  },

  deleteRole: async (id: string) => {
    try {
      const response = await fetch(`/api/role/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete role");
      }

      // Remove from local state
      set((state) => ({
        roles: state.roles.filter((role) => role.id !== id),
      }));

      toast.success("Role deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error(error.message || "Failed to delete role");
      return false;
    }
  },

  // Helper functions
  getRoleById: (id: string) => {
    return get().roles.find((r) => r.id === id);
  },

  getRolesByOffice: (officeId: string) => {
    return get().roles.filter((r) => r.officeId === officeId);
  },

  getSystemRoles: () => {
    return get().roles.filter((r) => r.isSystem);
  },

  getCustomRoles: () => {
    return get().roles.filter((r) => !r.isSystem);
  },
}));

