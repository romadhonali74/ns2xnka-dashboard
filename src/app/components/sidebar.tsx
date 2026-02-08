"use client";

import { Home, TrendingUp, AlertTriangle, LogOut, Calendar, ShieldCheck, ChevronDown, ChevronRight, FileText, BarChart3, Settings, Users, ChevronLeft, Menu, Ship, Container, PackageSearch, FolderKanban, DollarSign, Receipt } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase"; // Impor supabase
import { useEffect, useState } from "react";
import { useAuth } from "../providers/auth_provider";
import LogoutLoader from "./logout-loader";


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
  const [showQCSubmenu, setShowQCSubmenu] = useState<boolean>(false);
  const [showFinanceSubmenu, setShowFinanceSubmenu] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);


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
    if (pathname === "/mining_reports") return "mining-reports";
    if (pathname === "/quality_control") return "quality_control";
    if (pathname === "/quality_control/gcs") return "qc-gcs";
    if (pathname === "/quality_control/pra_produksi") return "qc-pra_produksi";
    if (pathname === "/quality_control/produksi") return "qc-produksi";
    if (pathname === "/quality_control/kapal") return "qc-kapal";
    if (pathname === "/quality_control/product_details") return "qc-product_details";
    if (pathname === "/finance") return "finance";
    if (pathname === "/finance/cash_cost_report") return "finance-cash-cost";
    if (pathname === "/finance/detail_report") return "finance-detail";
    if (pathname.startsWith("/realisasi_pengapalan")) return "daily-operations";
    return "home";
  };

  useEffect(() => {
    if (pathname.startsWith("/quality_control")) {
      setShowQCSubmenu(true);
    }
    if (pathname.startsWith("/finance")) {
      setShowFinanceSubmenu(true);
    }
  }, [pathname]);



  const activeTab = getActiveTab();

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    
    try {
      // Delay untuk smooth loading experience
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Hapus semua cookie terkait auth
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
      setIsLoggingOut(false);
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
    } else if (tab === "mining-reports") {
      router.push("/mining_reports");
    } else if (tab === "quality_control") {
      setShowQCSubmenu(!showQCSubmenu);
    } else if (tab === "qc-gcs") {
      router.push("/quality_control/gcs");
    } else if (tab === "qc-pra_produksi") {
      router.push("/quality_control/pra_produksi");
    } else if (tab === "qc-produksi") {
      router.push("/quality_control/produksi");
    } else if (tab === "qc-kapal") {
      router.push("/quality_control/kapal");
      } else if (tab === "qc-product_details") {
      router.push("/quality_control/product_details");
    } else if (tab === "finance") {
      setShowFinanceSubmenu(!showFinanceSubmenu);
    } else if (tab === "finance-cash-cost") {
      router.push("/finance/cash_cost_report");
    } else if (tab === "finance-detail") {
      router.push("/finance/detail_report");
    } else if (tab === "logout") {
      confirmLogout();
    }
  };

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "loading-rate", label: "Loading & Ritase Rate", icon: TrendingUp },
    { id: "daily-operations", label: "Daily Operations", icon: Calendar },
    { id: "issues", label: "Significant Issues", icon: AlertTriangle },
    { id: "quality_control", label: "Quality Control", icon: ShieldCheck },
    { id: "mining-reports", label: "Mining Reports", icon: BarChart3 },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "logout", label: "Log out", icon: LogOut },
  ];

  const qcSubMenuItems = [
    { id: "qc-gcs", label: "GCS", icon: FileText },
    { id: "qc-pra_produksi", label: "ETO to EFO", icon: PackageSearch },
    { id: "qc-produksi", label: "Produksi", icon: Container },
    { id: "qc-kapal", label: "Kapal/Tkg", icon: Ship },
    { id: "qc-product_details", label: "Product Details", icon: FolderKanban },
  ];

  const financeSubMenuItems = [
    { id: "finance-cash-cost", label: "Cash Cost Report", icon: DollarSign },
    { id: "finance-detail", label: "Detail Report", icon: Receipt },
  ];

  // Filter menu berdasarkan role dan bureu
  const getVisibleMenuItems = () => {
    let items = showLoadingRate
      ? menuItems
      : menuItems.filter((m) => m.id !== "loading-rate");
    
    // Hide Finance menu if user email is not romadhonali74@gmail.com
    if (user?.email !== 'romadhonali74@gmail.com') {
      items = items.filter((m) => m.id !== "finance");
    }
    
    return items;
  };

  const visibleMenuItems = getVisibleMenuItems();

  return (
    <>
      <LogoutLoader isLoading={isLoggingOut} />
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Apakah anda yakin ingin LogOut ?</h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Tidak
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm min-h-screen transition-all duration-300 relative`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-xl hover:scale-110 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 ease-in-out z-10 group"
      >
        {isCollapsed ? 
          <Menu className="w-4 h-4 transition-all duration-300 group-hover:rotate-90 group-hover:text-blue-600" /> : 
          <ChevronLeft className="w-4 h-4 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-blue-600" />
        }
      </button>
      <div className={`${isCollapsed ? 'p-2' : 'p-6'}`}>
        {!isCollapsed && <h2 className="text-[#273240] font-semibold mb-6">Menu</h2>}
        <nav className="space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isQCParent = item.id === "quality_control" && (activeTab === "quality_control" || activeTab.startsWith("qc-"));
            const isFinanceParent = item.id === "finance" && (activeTab === "finance" || activeTab.startsWith("finance-"));
            
            return (
              <div key={item.id}>
                <Button
                  variant={isActive || isQCParent || isFinanceParent ? "default" : "ghost"}
                  className={`w-full ${isCollapsed ? 'justify-center p-2' : 'justify-start gap-3'} transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:-translate-y-0.5 group relative overflow-hidden ${
                    isActive || isQCParent || isFinanceParent
                      ? "bg-[#0075cf] text-white hover:bg-[#114771] shadow-md"
                      : "text-[#273240] hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#0075cf] hover:border-blue-200"
                  }`}
                  onClick={() => handleTabClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-sm" />
                  {!isCollapsed && (
                    <>
                      <span className="transition-all duration-300 group-hover:translate-x-1">{item.label}</span>
                      {item.id === "quality_control" && (
                        showQCSubmenu ? 
                          <ChevronDown className="w-4 h-4 ml-auto transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600" /> : 
                          <ChevronRight className="w-4 h-4 ml-auto transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1 group-hover:text-blue-600" />
                      )}
                      {item.id === "finance" && (
                        showFinanceSubmenu ? 
                          <ChevronDown className="w-4 h-4 ml-auto transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600" /> : 
                          <ChevronRight className="w-4 h-4 ml-auto transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1 group-hover:text-blue-600" />
                      )}
                    </>
                  )}
                </Button>
                
                {item.id === "quality_control" && showQCSubmenu && !isCollapsed && (
                  <div className="ml-6 mt-2 space-y-1">
                    {qcSubMenuItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.id;
                      return (
                        <Button
                          key={subItem.id}
                          variant={isSubActive ? "default" : "ghost"}
                          className={`w-full justify-start gap-3 text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md hover:translate-x-2 hover:-translate-y-0.5 group relative overflow-hidden ${
                            isSubActive
                              ? "bg-[#0075cf] text-white hover:bg-[#114771] shadow-sm"
                              : "text-[#273240] hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-[#0075cf] hover:border-l-2 hover:border-blue-400"
                          }`}
                          onClick={() => handleTabClick(subItem.id)}
                        >
                          <SubIcon className="w-3 h-3 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 group-hover:text-blue-600" />
                          <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">{subItem.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
                
                {item.id === "finance" && showFinanceSubmenu && !isCollapsed && (
                  <div className="ml-6 mt-2 space-y-1">
                    {financeSubMenuItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.id;
                      return (
                        <Button
                          key={subItem.id}
                          variant={isSubActive ? "default" : "ghost"}
                          className={`w-full justify-start gap-3 text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md hover:translate-x-2 hover:-translate-y-0.5 group relative overflow-hidden ${
                            isSubActive
                              ? "bg-[#0075cf] text-white hover:bg-[#114771] shadow-sm"
                              : "text-[#273240] hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-[#0075cf] hover:border-l-2 hover:border-blue-400"
                          }`}
                          onClick={() => handleTabClick(subItem.id)}
                        >
                          <SubIcon className="w-3 h-3 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 group-hover:text-blue-600" />
                          <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">{subItem.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
    </>
  );
}
