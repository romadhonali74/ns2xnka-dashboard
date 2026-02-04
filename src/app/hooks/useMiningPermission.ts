import { useAuth } from "../providers/auth_provider";

export const useMiningPermission = () => {
  const { user, loading } = useAuth();

  const hasMiningAccess = () => {
    if (loading || !user) return false;
    
    const root: any = user;
    
    const roleCandidates = [
      root?.app_metadata?.role,
      root?.user_metadata?.role,
      root?.raw_app_meta_data?.role,
      root?.raw_user_meta_data?.role,
    ];
    
    const normalize = (v: unknown) =>
      typeof v === "string" ? v.trim().toLowerCase() : "";
    const role = normalize(roleCandidates.find((x: unknown) => typeof x === "string")) || null;
    
    return role !== 'user';
  };

  return {
    canAddData: hasMiningAccess(),
    canEdit: hasMiningAccess(),
    canDelete: hasMiningAccess(),
    showActions: hasMiningAccess(),
    loading
  };
};