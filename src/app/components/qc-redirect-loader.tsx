"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../providers/auth_provider";

export default function QCRedirectLoader({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is QC admin based on metadata
    const root: any = user ?? null;
    
    const candidates = [
      root?.app_metadata?.bureu,
      root?.user_metadata?.bureu,
      root?.raw_app_meta_data?.bureu,
      root?.raw_user_meta_data?.bureu,
    ];
    const normalize = (v: unknown) =>
      typeof v === "string" ? v.trim().toLowerCase() : "";
    const normalized = candidates.map(normalize).filter((s) => s && s !== "-");
    const bureu = normalized.find((s) => s === "qc") || null;
    
    const roleCandidates = [
      root?.app_metadata?.role,
      root?.user_metadata?.role,
      root?.raw_app_meta_data?.role,
      root?.raw_user_meta_data?.role,
    ];
    const role = normalize(roleCandidates.find((x: unknown) => typeof x === "string"));
    
    if (role === "admin" && bureu === "qc") {
      const allowedPaths = [
        "/quality_control/gcs",
        "/quality_control/pra_produksi", 
        "/quality_control/produksi",
        "/quality_control/kapal"
      ];
      
      if (!allowedPaths.includes(pathname)) {
        setIsLoading(true);
        
        // Immediate redirect with fallback
        const redirectTimer = setTimeout(() => {
          router.replace("/quality_control/gcs");
        }, 500);
        
        // Fallback timeout to stop loading
        const fallbackTimer = setTimeout(() => {
          setIsLoading(false);
          window.location.href = "/quality_control/gcs";
        }, 3000);
        
        return () => {
          clearTimeout(redirectTimer);
          clearTimeout(fallbackTimer);
        };
      } else {
        setIsLoading(false);
      }
    }
  }, [user, pathname, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0075cf] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirecting to Quality Control</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}