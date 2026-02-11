import { useState, useEffect } from 'react';
import { useAuth } from '../providers/auth_provider';

interface UserRoleData {
  email: string | null;
  role: string | null;
  bureau: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  permissions: string[];
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
  });

  useEffect(() => {
    const fetchPermissions = async (bureau: string) => {
      try {
        const response = await fetch(`/api/permissions?bureau=${bureau}`);
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching permissions:', error);
        return [];
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
        });
        return;
      }

      const email = user.email || null;
      const isSuperAdmin = user.app_metadata?.is_super_admin || false;
      const isAdmin = email === 'romadhonali74@gmail.com' || isSuperAdmin;

      const role = user.app_metadata?.role || user.user_metadata?.role || null;
      const bureau = user.app_metadata?.bureau || user.user_metadata?.bureau || null;

      let permissions: string[] = [];
      if (!isAdmin && bureau) {
        permissions = await fetchPermissions(bureau);
      }

      setRoleData({
        email,
        role,
        bureau,
        isAdmin,
        isLoading: false,
        permissions,
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
