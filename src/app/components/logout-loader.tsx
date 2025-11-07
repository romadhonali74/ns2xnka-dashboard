"use client";

import { useState } from "react";

interface LogoutLoaderProps {
  isLoading: boolean;
}

export default function LogoutLoader({ isLoading }: LogoutLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Logging Out</h2>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}