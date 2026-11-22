"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminUIProvider } from "@/components/admin/AdminUIContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Loader2 } from "lucide-react";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAdminAuth();

  // Public auth pages (login, forgot-password, reset-password) get a clean standalone presentation without sidebar or header
  const isPublicAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  if (isPublicAuthPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // While checking session
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          S
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Authenticating Siri Windows Admin Portal...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated (AuthProvider also triggers router.push to /admin/login)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation (Filters dynamically by permissions) */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 bg-slate-100/60 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminUIProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminUIProvider>
    </AdminAuthProvider>
  );
}
