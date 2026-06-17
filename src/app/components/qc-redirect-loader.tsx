"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../providers/auth_provider";

export default function QCRedirectLoader({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // No redirect logic needed - all users can access all pages

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