import { useState, useEffect } from 'react';
import { useAuth } from '../providers/auth_provider';

interface UserRoleData {
  email: string | null;
  role: string | null;
  bureau: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  permissions: string[];
  crudPermissions: Record<string, { canCreate: boolean; canEdit: boolean; canDelete: boolean }>;
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
        console.log('Fetching permissions for bureau:', bureau);
        const response = await fetch(`/api/permissions?bureau=${bureau}`);
        const data = await response.json();
        console.log('Permissions received:', data);
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
          isLoading: false,
          permissions: [],
          crudPermissions: {},
        });
        return;
      }

      const email = user.email || null;
      const isSuperAdmin = user.app_metadata?.is_super_admin || false;
      const isAdmin = email === 'romadhonali74@gmail.com' || isSuperAdmin;

      const role = user.app_metadata?.role || user.user_metadata?.role || null;
      const bureau = user.app_metadata?.bureau || user.user_metadata?.bureau || null;

      let permissions: string[] = [];
      let crudPermissions: Record<string, { canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
      if (!isAdmin && bureau) {
        const permData = await fetchPermissions(bureau);
        permissions = permData.menuKeys || [];
        crudPermissions = permData.crudPermissions || {};
      }

      setRoleData({
        email,
        role,
        bureau,
        isAdmin,
        isLoading: false,
        permissions,
        crudPermissions,
      });
    };

    loadUserData();
  }, [user]);

  return roleData;
};

// Helper hook to check if user is admin
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useUserRole();
  return isAdmin;
};

// Helper hook to check if user has specific role
export const useHasRole = (requiredRole: string): boolean => {
  const { role, isAdmin } = useUserRole();
  if (isAdmin) return true;
  return role === requiredRole;
};

// Helper hook to check if user has specific bureau
export const useHasBureau = (requiredBureau: string): boolean => {
  const { bureau, isAdmin } = useUserRole();
  if (isAdmin) return true;
  return bureau === requiredBureau;
};

// Helper hook to check if user has access based on role and/or bureau
export const useHasAccess = (requiredRole?: string, requiredBureau?: string): boolean => {
  const { role, bureau, isAdmin } = useUserRole();
  
  if (isAdmin) return true;
  if (requiredRole && role !== requiredRole) return false;
  if (requiredBureau && bureau !== requiredBureau) return false;
  
  return true;
};

// Helper hook to check if user has permission to access a menu
export const useHasMenuPermission = (menuKey: string): boolean => {
  const { permissions, isAdmin } = useUserRole();
  if (isAdmin) return true;
  return permissions.includes(menuKey);
};

// Helper hook to check CRUD permissions
export const useCrudPermissions = (menuKey: string) => {
  const { crudPermissions, isAdmin } = useUserRole();
  if (isAdmin) return { canCreate: true, canEdit: true, canDelete: true };
  return crudPermissions[menuKey] || { canCreate: false, canEdit: false, canDelete: false };
};
