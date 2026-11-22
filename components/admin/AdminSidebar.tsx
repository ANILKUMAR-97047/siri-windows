"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Banknote,
  Package,
  UserCheck,
  Tag,
  PhoneCall,
  Briefcase,
  Coins,
  Receipt,
  Image as ImageIcon,
  Globe,
  ExternalLink,
  ShieldCheck,
  UserCog,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { useAdminUI } from "@/components/admin/AdminUIContext";
import { PermissionKey } from "@/lib/auth-types";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  permission: PermissionKey;
  badge?: string;
  highlight?: boolean;
}

const baseNavigation: NavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, permission: "overview" },
  { name: "Leads Management", href: "/admin/leads", icon: PhoneCall, permission: "leads", badge: "Live" },
  { name: "Clients & Quotes", href: "/admin/clients", icon: UserCheck, permission: "clients" },
  { name: "Projects Management", href: "/admin/projects", icon: Briefcase, permission: "projects" },
  { name: "Staff & Salaries", href: "/admin/staff", icon: Users, permission: "staff" },
  { name: "Staff Attendance", href: "/admin/staff/attendance", icon: CalendarCheck, permission: "attendance" },
  { name: "Staff Advances (Kharcha)", href: "/admin/staff/advances", icon: Coins, permission: "salaries" },
  { name: "Salary Records", href: "/admin/staff/salaries", icon: Banknote, permission: "salaries" },
  { name: "Stock & Materials", href: "/admin/stock", icon: Package, permission: "stock" },
  { name: "Pricing Packages", href: "/admin/pricing", icon: Tag, permission: "pricing" },
  { name: "Daily Expenses (Owner)", href: "/admin/expenses", icon: Receipt, permission: "expenses" },
  { name: "Gallery Manager", href: "/admin/gallery", icon: ImageIcon, permission: "gallery" },
  { name: "Website Dynamic Data", href: "/admin/website", icon: Globe, permission: "website", highlight: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, role, hasPermission, logout } = useAdminAuth();
  const { sidebarOpen, closeSidebar } = useAdminUI();

  // If Super Admin, include the Admin Users Management module
  const navigation: NavItem[] = [
    ...baseNavigation,
    ...(role === "super_admin"
      ? [
          {
            name: "Admin Users & RBAC",
            href: "/admin/users",
            icon: UserCog,
            permission: "users" as PermissionKey,
            badge: "Super",
          },
        ]
      : []),
  ];

  // Filter based on user's specific granted permissions
  const visibleItems = navigation.filter((item) => hasPermission(item.permission));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shrink-0 select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-amber-500/20">
              S
            </div>
            <div>
              <div className="font-semibold text-sm tracking-wide text-white flex items-center gap-1.5">
                SIRI WINDOWS
              </div>
              <div className="text-[10px] text-amber-400 font-medium tracking-wider uppercase">
                Admin Portal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.0
            </span>
            <button
              onClick={closeSidebar}
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Operations & CRM
          </div>
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : item.highlight
                  ? "text-amber-300 hover:bg-slate-800/80 hover:text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive
                      ? "text-slate-950"
                      : item.highlight
                      ? "text-amber-400"
                      : "text-slate-400 group-hover:text-amber-400"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : item.badge === "Super"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {isActive && !item.badge && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/30">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Live Website
          </span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </Link>

        {/* Current Admin User Info & Logout */}
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-800/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                role === "super_admin" ? "text-amber-400" : "text-emerald-400"
              }`}
            />
            <div className="truncate">
              <div className="text-slate-200 font-medium truncate">
                {user?.name || "Admin"}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    role === "super_admin" ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                {role === "super_admin" ? "Super Admin" : "Restricted Admin"}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  </>
);
}
