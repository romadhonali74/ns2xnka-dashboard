"use client";

import { Home, TrendingUp, AlertTriangle, LogOut, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase"; // Impor supabase
import { useEffect, useState } from "react";
import { useAuth } from "../providers/auth_provider";

interface SidebarProps {
  onTabChange?: (tab: string) => void;
}

export default function Sidebar({ onTabChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [bureu, setBureu] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [showLoadingRate, setShowLoadingRate] = useState<boolean>(false);

  useEffect(() => {
    try {
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
      const knownSet = new Set(["shipping", "mining", "qc"]);
      const firstValid = normalized.find((s) => knownSet.has(s)) || null;
      setBureu(firstValid);

      const roleCandidates = [
        root?.app_metadata?.role,
        root?.user_metadata?.role,
        root?.raw_app_meta_data?.role,
        root?.raw_user_meta_data?.role,
      ];
      const r = normalize(roleCandidates.find((x: unknown) => typeof x === "string"));
      setRole(r || null);

      const hasShipping = normalized.includes("shipping");
      const hasMiningOrQc = normalized.includes("mining") || normalized.includes("qc");
      const visible = hasShipping ? true : hasMiningOrQc ? false : true;
      setShowLoadingRate(visible);
    } catch {
      setBureu(null);
      setRole(null);
      setShowLoadingRate(true);
    }
  }, [user]);

  // Fungsi untuk menentukan tab aktif berdasarkan pathname saat ini
  const getActiveTab = () => {
    if (pathname === "/") return "home";
    if (pathname === "/loading_ritase_rate") return "loading-rate";
    if (pathname === "/issues") return "issues";
    if (pathname.startsWith("/realisasi_pengapalan")) return "daily-operations";
    return "home";
  };

  const activeTab = getActiveTab();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2. Hapus semua cookie terkait auth
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Session after logout:", session);

      // Paksa reset state auth dan cache
      window.location.href = "/login"; // Hard redirect untuk pastikan cache bersih
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    // Logika navigasi berdasarkan tab yang diklik
    if (tab === "home") {
      router.push("/");
    } else if (tab === "loading-rate") {
      router.push("/loading_ritase_rate");
    } else if (tab === "issues") {
      router.push("/issues");
    } else if (tab === "daily-operations") {
      router.push("/realisasi_pengapalan");
    } else if (tab === "logout") {
      handleLogout();
    }
  };

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "loading-rate", label: "Loading & Ritase Rate", icon: TrendingUp },
    { id: "daily-operations", label: "Daily Operations", icon: Calendar },
    { id: "issues", label: "Significant Issues", icon: AlertTriangle },
    { id: "logout", label: "Log out", icon: LogOut },
  ];

  const visibleMenuItems = showLoadingRate
    ? menuItems
    : menuItems.filter((m) => m.id !== "loading-rate");

  return (
    <div className="w-64 bg-white shadow-sm min-h-screen">
      <div className="p-6">
        <h2 className="text-[#273240] font-semibold mb-6">Menu</h2>
        <nav className="space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 transition-colors ${
                  isActive
                    ? "bg-[#0075cf] text-white hover:bg-[#114771]"
                    : "text-[#273240] hover:bg-[#f1f2f7]"
                }`}
                onClick={() => handleTabClick(item.id)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
