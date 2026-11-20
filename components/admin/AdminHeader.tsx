"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, Sparkles, LogOut, Shield } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, role, logout } = useAdminAuth();

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard Overview";
    if (pathname.startsWith("/admin/leads")) return "Leads & Inquiries";
    if (pathname.startsWith("/admin/clients")) return "Clients & Onboarding";
    if (pathname.startsWith("/admin/projects")) return "Projects Management";
    if (pathname.startsWith("/admin/staff/salaries")) return "Monthly Salaries";
    if (pathname.startsWith("/admin/staff")) return "Staff & Team";
    if (pathname.startsWith("/admin/stock")) return "Stock & Materials";
    if (pathname.startsWith("/admin/pricing")) return "Pricing & Quotations";
    if (pathname.startsWith("/admin/maintenance")) return "Daily Maintenance";
    if (pathname.startsWith("/admin/gallery")) return "Gallery & Media";
    if (pathname.startsWith("/admin/website")) return "Website Dynamic Content";
    if (pathname.startsWith("/admin/users")) return "Admin Users & Access Control";
    return "Admin Portal";
  };

  const getInitials = (name?: string) => {
    if (!name) return "SW";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">
          {getPageTitle()}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
          <Sparkles className="w-3 h-3" />
          Siri Operations Engine
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, stock, staff..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>

        {/* Database Status indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300">
            Supabase DB
          </span>
        </div>

        {/* User Profile Pill & Logout Button */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40 shadow-sm shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.name || "Admin"}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-amber-500" />
                {role === "super_admin" ? "Super Admin" : "Restricted Admin"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
