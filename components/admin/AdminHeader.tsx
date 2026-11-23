"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sparkles,
  LogOut,
  Shield,
  Settings,
  X,
  Loader2,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { useAdminUI } from "@/components/admin/AdminUIContext";
import { toast } from "@/components/ui/ToastProvider";

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, role, logout, refreshUser } = useAdminAuth();
  const { toggleSidebar } = useAdminUI();

  // Profile modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleOpenProfile = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        email: email.trim(),
      };
      if (password && password.trim()) {
        payload.password = password.trim();
      }

      const res = await fetch("/api/admin/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errText = data.error || "Failed to update profile.";
        setErrorMsg(errText);
        toast.error(errText, "Profile Update Failed");
        setSubmitting(false);
        return;
      }

      setSuccessMsg("Account details updated successfully!");
      toast.success("Account profile and email updated successfully!", "Profile Saved");
      await refreshUser();
      setTimeout(() => {
        setIsProfileOpen(false);
      }, 1200);
    } catch (err: any) {
      const errText = err?.message || "A network error occurred.";
      setErrorMsg(errText);
      toast.error(errText, "Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard Overview";
    if (pathname.startsWith("/admin/leads")) return "Leads & Inquiries";
    if (pathname.startsWith("/admin/clients")) return "Clients & Onboarding";
    if (pathname.startsWith("/admin/projects")) return "Projects Management";
    if (pathname.startsWith("/admin/staff/advances")) return "Staff Advances & Kharcha";
    if (pathname.startsWith("/admin/staff/salaries")) return "Monthly Salaries";
    if (pathname.startsWith("/admin/staff")) return "Staff & Team";
    if (pathname.startsWith("/admin/stock")) return "Stock & Materials";
    if (pathname.startsWith("/admin/pricing")) return "Pricing & Quotations";
    if (pathname.startsWith("/admin/expenses")) return "Daily Expenses (Owner)";
    if (pathname.startsWith("/admin/gallery")) return "Gallery & Media";
    if (pathname.startsWith("/admin/website")) return "Website Dynamic Content";
    if (pathname.startsWith("/admin/users")) return "Admin Users & Access Control";
    return "Admin Portal";
  };

  const getInitials = (userName?: string) => {
    if (!userName) return "SW";
    const parts = userName.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return userName.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-xs md:max-w-none">
            {getPageTitle()}
          </h1>
          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 shrink-0">
            <Sparkles className="w-3 h-3" />
            Siri Operations Engine
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* System Status indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              System Online
            </span>
          </div>

          {/* User Profile Pill & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition text-left cursor-pointer group"
              title="Click to view & edit your profile/email"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40 shadow-sm shrink-0 group-hover:scale-105 transition">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-amber-500 transition">
                  {user?.name || "Admin"}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-amber-500" />
                  {role === "super_admin" ? "Super Admin" : "Restricted Admin"}
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition hidden md:inline" />
            </button>

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

      {/* Account Profile & Email Settings Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 my-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Account Profile & Email
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Manage your administrator credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Admin Email Address
                  </label>
                  <span className="text-[10px] text-amber-500 font-medium">
                    Used for login & password reset
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@siriwindows.in"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  If changed, you will log in with this new email going forward.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Update Password (optional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
