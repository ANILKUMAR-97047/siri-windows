"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminUser, AdminRole, PermissionKey, checkPermission } from "@/lib/auth-types";

interface AdminAuthContextType {
  user: AdminUser | null;
  role: AdminRole | null;
  permissions: string[];
  isLoading: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  role: null,
  permissions: [],
  isLoading: true,
  hasPermission: () => false,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public authentication pages that do not require an active admin session
  const isPublicAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/me", {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          // Only redirect to dashboard if the user is on the login page specifically.
          // Do NOT redirect away from /admin/reset-password or /admin/forgot-password,
          // so admins can test or complete password resets without cookie conflicts.
          if (pathname === "/admin/login") {
            router.push("/admin");
          }
          return;
        }
      }

      // Not authenticated
      setUser(null);
      if (!isPublicAuthPage && pathname.startsWith("/admin")) {
        router.push("/admin/login");
      }
    } catch {
      setUser(null);
      if (!isPublicAuthPage && pathname.startsWith("/admin")) {
        router.push("/admin/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isPublicAuthPage, pathname, router]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.push("/admin/login");
    }
  };

  const hasPermission = (key: PermissionKey): boolean => {
    if (!user) return false;
    return checkPermission(user.role, user.permissions, key);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        permissions: user?.permissions || [],
        isLoading,
        hasPermission,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
