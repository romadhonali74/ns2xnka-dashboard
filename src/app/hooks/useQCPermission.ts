import { useAuth } from "../providers/auth_provider";

export const useQCPermission = () => {
  const { user } = useAuth();

  const hasQCAccess = () => {
    if (!user) return false;
    
    const root: any = user;
    const candidates = [
      root?.app_metadata?.bureu,
      root?.user_metadata?.bureu,
      root?.raw_app_meta_data?.bureu,
      root?.raw_user_meta_data?.bureu,
    ];
    
    const normalize = (v: unknown) =>
      typeof v === "string" ? v.trim().toLowerCase() : "";
    const normalized = candidates.map(normalize).filter((s) => s && s !== "-");
    
    return normalized.includes("qc");
  };

  return {
    canAddData: hasQCAccess(),
    canEdit: hasQCAccess(),
    canDelete: hasQCAccess(),
    showActions: hasQCAccess()
  };
};