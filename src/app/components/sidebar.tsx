"use client";

import { Home, TrendingUp, AlertTriangle, LogOut, Calendar, ShieldCheck, ChevronDown, ChevronRight, FileText, BarChart3, Settings, Users, ChevronLeft, Menu, Ship, Container, PackageSearch, FolderKanban, DollarSign, Receipt, TrendingUpIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "../providers/auth_provider";
import { useUserRole } from "../hooks/useUserRole";
import LogoutLoader from "./logout-loader";


interface SidebarProps {
  onTabChange?: (tab: string) => void;
}

export default function Sidebar({ onTabChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { bureau, isAdmin, permissions } = useUserRole();
  const [showLoadingRate, setShowLoadingRate] = useState<boolean>(false);
  const [showQCSubmenu, setShowQCSubmenu] = useState<boolean>(false);
  const [showFinanceSubmenu, setShowFinanceSubmenu] = useState<boolean>(false);
  const [showUserMgmtSubmenu, setShowUserMgmtSubmenu] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // useEffect(() => {
  //   setShowLoadingRate(permissions.includes('loading-rate') || isAdmin);
  // }, [permissions, isAdmin]);

  useEffect(() => {
  setShowLoadingRate(Array.isArray(permissions) ? permissions.includes('loading-rate') : false || isAdmin);
}, [permissions, isAdmin]);

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
    if (pathname === "/sales_marketing") return "sales-marketing";
    if (pathname === "/user_management/details") return "user-details";
    if (pathname === "/user_management/privileges") return "user-privileges";
    if (pathname === "/users") return "users";
    if (pathname.startsWith("/realisasi_pengapalan")) return "daily-operations";
    return "home";
  };

  useEffect(() => {
    if (pathname.startsWith("/quality_control")) setShowQCSubmenu(true);
    if (pathname.startsWith("/finance")) setShowFinanceSubmenu(true);
    if (pathname.startsWith("/user_management")) setShowUserMgmtSubmenu(true);
  }, [pathname]);

  const activeTab = getActiveTab();

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabase.auth.signOut();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  const handleTabClick = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    if (tab === "home") router.push("/");
    else if (tab === "loading-rate") router.push("/loading_ritase_rate");
    else if (tab === "issues") router.push("/issues");
    else if (tab === "daily-operations") router.push("/realisasi_pengapalan");
    else if (tab === "mining-reports") router.push("/mining_reports");
    else if (tab === "quality_control") setShowQCSubmenu(!showQCSubmenu);
    else if (tab === "qc-gcs") router.push("/quality_control/gcs");
    else if (tab === "qc-pra_produksi") router.push("/quality_control/pra_produksi");
    else if (tab === "qc-produksi") router.push("/quality_control/produksi");
    else if (tab === "qc-kapal") router.push("/quality_control/kapal");
    else if (tab === "qc-product_details") router.push("/quality_control/product_details");
    else if (tab === "finance") setShowFinanceSubmenu(!showFinanceSubmenu);
    else if (tab === "finance-cash-cost") router.push("/finance/cash_cost_report");
    else if (tab === "finance-detail") router.push("/finance/detail_report");
    else if (tab === "sales-marketing") router.push("/sales_marketing");
    else if (tab === "user_management") setShowUserMgmtSubmenu(!showUserMgmtSubmenu);
    else if (tab === "user-details") router.push("/user_management/details");
    else if (tab === "user-privileges") router.push("/user_management/privileges");
    else if (tab === "users") router.push("/users");
    else if (tab === "logout") setShowLogoutConfirm(true);
  };

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "loading-rate", label: "Loading & Ritase Rate", icon: TrendingUp },
    { id: "daily-operations", label: "Daily Operations", icon: Calendar },
    { id: "issues", label: "Significant Issues", icon: AlertTriangle },
    { id: "quality_control", label: "Quality Control", icon: ShieldCheck },
    { id: "mining-reports", label: "Mining Reports", icon: BarChart3 },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "sales-marketing", label: "Sales & Marketing", icon: TrendingUpIcon },
    { id: "user_management", label: "User Management", icon: Settings },
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

  const userMgmtSubMenuItems = [
    { id: "user-details", label: "Details", icon: Users },
    { id: "user-privileges", label: "Group Privilege", icon: ShieldCheck },
  ];

  const getVisibleMenuItems = () => {
    if (isAdmin) return menuItems;
    return menuItems.filter(item => {
      if (item.id === 'logout' || item.id === 'home') return true;
      return Array.isArray(permissions) && permissions.includes(item.id);
    });
  };

  const visibleMenuItems = getVisibleMenuItems();

  return (
    <>
      <LogoutLoader isLoading={isLoggingOut} />
      {showLogoutConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Apakah anda yakin ingin LogOut?</h3>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer">Tidak</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">Ya</button>
            </div>
          </div>
        </div>
      )}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm min-h-screen transition-all duration-300 relative cursor-auto sticky top-0 self-start`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-6 bg-white border rounded-full p-1 shadow-md z-10 group cursor-pointer">
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <div className={`${isCollapsed ? 'p-2' : 'p-6'}`}>
          {!isCollapsed && <h2 className="text-[#273240] font-semibold mb-6">Menu</h2>}
          <nav className="space-y-2">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isQCParent = item.id === "quality_control" && (activeTab === "quality_control" || activeTab.startsWith("qc-"));
              const isFinanceParent = item.id === "finance" && (activeTab === "finance" || activeTab.startsWith("finance-"));
              const isUserMgmtParent = item.id === "user_management" && activeTab.startsWith("user-");

              return (
                <div key={item.id}>
                  <Button
                    variant={isActive || isQCParent || isFinanceParent || isUserMgmtParent ? "default" : "ghost"}
                    className={`w-full ${isCollapsed ? 'justify-center p-2' : 'justify-start gap-3'} ${
                      isActive || isQCParent || isFinanceParent || isUserMgmtParent ? "bg-[#0075cf] text-white" : "text-[#273240] hover:bg-blue-50 hover:text-[#0075cf]"
                    } cursor-pointer transition-all duration-200 group`}
                    onClick={() => handleTabClick(item.id)}
                  >
                    <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {(item.id === "quality_control" || item.id === "finance" || item.id === "user_management") && (
                          (item.id === "quality_control" ? showQCSubmenu : item.id === "finance" ? showFinanceSubmenu : showUserMgmtSubmenu) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </Button>
                  
                  {!isCollapsed && item.id === "quality_control" && showQCSubmenu && (
                    <div className="ml-6 mt-2 space-y-1">
                      {qcSubMenuItems.map(sub => (
                        <Button key={sub.id} variant={activeTab === sub.id ? "default" : "ghost"} className={`w-full justify-start gap-3 text-sm cursor-pointer transition-all duration-200 group ${activeTab === sub.id ? "bg-[#0075cf] text-white" : "hover:bg-blue-50 hover:text-[#0075cf]"}`} onClick={() => handleTabClick(sub.id)}>
                          <sub.icon className="w-3 h-3 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" /> {sub.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {!isCollapsed && item.id === "finance" && showFinanceSubmenu && (
                    <div className="ml-6 mt-2 space-y-1">
                      {financeSubMenuItems.map(sub => (
                        <Button key={sub.id} variant={activeTab === sub.id ? "default" : "ghost"} className={`w-full justify-start gap-3 text-sm cursor-pointer transition-all duration-200 group ${activeTab === sub.id ? "bg-[#0075cf] text-white" : "hover:bg-blue-50 hover:text-[#0075cf]"}`} onClick={() => handleTabClick(sub.id)}>
                          <sub.icon className="w-3 h-3 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" /> {sub.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {!isCollapsed && item.id === "user_management" && showUserMgmtSubmenu && (
                    <div className="ml-6 mt-2 space-y-1">
                      {userMgmtSubMenuItems.map(sub => (
                        <Button key={sub.id} variant={activeTab === sub.id ? "default" : "ghost"} className={`w-full justify-start gap-3 text-sm cursor-pointer transition-all duration-200 group ${activeTab === sub.id ? "bg-[#0075cf] text-white" : "hover:bg-blue-50 hover:text-[#0075cf]"}`} onClick={() => handleTabClick(sub.id)}>
                          <sub.icon className="w-3 h-3 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" /> {sub.label}
                        </Button>
                      ))}
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