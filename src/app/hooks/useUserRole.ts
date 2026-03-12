import { useState, useEffect } from 'react';
import { useAuth } from '../providers/auth_provider';

interface UserRoleData {
  email: string | null;
  role: string | null;
  bureau: string | null;
  isAdmin: boolean; // true if role === 'admin' OR super admin (for backward compatibility)
  isLoading: boolean;
  permissions: string[];
  crudPermissions: Record<string, { canCreate: boolean; canEdit: boolean; canDelete: boolean }>;
  isSuperAdmin: boolean; // true only for super admin
  isRegularAdmin: boolean; // true only for role === 'admin' (not super admin)
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [roleData, setRoleData] = useState<UserRoleData>({
    email: null,
    role: null,
    bureau: null,
    isAdmin: false,
    isLoading: true,
    permissions: [],
    crudPermissions: {},
  });

  useEffect(() => {
    const fetchPermissions = async (bureau: string) => {
      try {
        const response = await fetch(`/api/permissions?bureau=${bureau}`);
        const data = await response.json();
        return data || { menuKeys: [], crudPermissions: {} };
      } catch (error) {
        console.error('Error fetching permissions:', error);
        return { menuKeys: [], crudPermissions: {} };
      }
    };

    const loadUserData = async () => {
      if (!user) {
        setRoleData({
          email: null,
          role: null,
          bureau: null,
          isAdmin: false,
          isSuperAdmin: false,
          isRegularAdmin: false,
          isLoading: false,
          permissions: [],
          crudPermissions: {},
        });
        return;
      }

      const email = user.email || null;
      const role = user.app_metadata?.role || user.user_metadata?.role || null;
      const bureau = user.app_metadata?.bureau || user.user_metadata?.bureau || null;
      const isSuperAdmin = user.app_metadata?.is_super_admin || false;
      
      // Super Admin: Full access without restrictions
      // Admin: Has admin privileges but limited by bureau
      const isAdmin = role === 'admin';
      const isSuperAdminUser = email === 'romadhonali74@gmail.com' || isSuperAdmin;

      let permissions: string[] = [];
      let crudPermissions: Record<string, { canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
      
      // Only fetch permissions for non-super-admin users
      if (!isSuperAdminUser && bureau) {
        const permData = await fetchPermissions(bureau);
        permissions = permData.menuKeys || [];
        crudPermissions = permData.crudPermissions || {};
      }

      setRoleData({
        email,
        role,
        bureau,
        isAdmin: isAdmin || isSuperAdminUser, // For backward compatibility - true for both
        isSuperAdmin: isSuperAdminUser, // Only true for super admin
        isRegularAdmin: isAdmin && !isSuperAdminUser, // Only true for regular admin
        isLoading: false,
        permissions,
        crudPermissions,
      });
    };

    loadUserData();
  }, [user]);

  return roleData;
};

// Helper hook to check if user is super admin (full access)
export const useIsSuperAdmin = (): boolean => {
  const { isSuperAdmin } = useUserRole();
  return isSuperAdmin || false;
};

// Helper hook to check if user is admin
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useUserRole();
  return isAdmin;
};

// Helper hook to check if user has specific role
export const useHasRole = (requiredRole: string): boolean => {
  const { role, isSuperAdmin } = useUserRole();
  if (isSuperAdmin) return true; // Super admin has all roles
  return role === requiredRole;
};

// Helper hook to check if user has specific bureau
export const useHasBureau = (requiredBureau: string): boolean => {
  const { bureau, isSuperAdmin } = useUserRole();
  if (isSuperAdmin) return true; // Super admin has access to all bureaus
  return bureau === requiredBureau;
};

// Helper hook to check if user has access based on role and/or bureau
export const useHasAccess = (requiredRole?: string, requiredBureau?: string): boolean => {
  const { role, bureau, isSuperAdmin } = useUserRole();
  
  if (isSuperAdmin) return true; // Super admin has full access
  if (requiredRole && role !== requiredRole) return false;
  if (requiredBureau && bureau !== requiredBureau) return false;
  
  return true;
};

// Helper hook to check if user has permission to access a menu
export const useHasMenuPermission = (menuKey: string): boolean => {
  const { permissions, isSuperAdmin } = useUserRole();
  if (isSuperAdmin) return true; // Super admin has all menu access
  return permissions.includes(menuKey);
};

// Helper hook to check CRUD permissions
export const useCrudPermissions = (menuKey: string) => {
  const { crudPermissions, isSuperAdmin } = useUserRole();
  if (isSuperAdmin) return { canCreate: true, canEdit: true, canDelete: true }; // Super admin has all CRUD access
  return crudPermissions[menuKey] || { canCreate: false, canEdit: false, canDelete: false };
};
