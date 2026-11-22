"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCog,
  Plus,
  Shield,
  ShieldAlert,
  CheckCircle2,
  X,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  Key,
  Users,
  Check,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { ALL_PERMISSIONS, PermissionKey, AdminUser } from "@/lib/auth-types";
import { toast } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";

export default function AdminUsersPage() {
  const { user: currentSuperAdmin, refreshUser } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    permissions: ["overview", "leads", "clients"] as string[],
  });

  // Edit Form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    permissions: [] as string[],
    status: "active",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "admin",
      permissions: ["overview", "leads", "clients"],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (admin: AdminUser) => {
    setEditingUser(admin);
    setEditFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      role: admin.role,
      permissions: admin.permissions || [],
      status: admin.status,
    });
  };

  const toggleAddPermission = (key: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(key);
      const next = exists
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions: next };
    });
  };

  const toggleEditPermission = (key: string) => {
    setEditFormData((prev) => {
      const exists = prev.permissions.includes(key);
      const next = exists
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions: next };
    });
  };

  const selectAllAddPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: ALL_PERMISSIONS.map((p) => p.key),
    }));
  };

  const clearAllAddPermissions = () => {
    setFormData((prev) => ({ ...prev, permissions: [] }));
  };

  const selectAllEditPermissions = () => {
    setEditFormData((prev) => ({
      ...prev,
      permissions: ALL_PERMISSIONS.map((p) => p.key),
    }));
  };

  const clearAllEditPermissions = () => {
    setEditFormData((prev) => ({ ...prev, permissions: [] }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.warning("Name, email and password are required.", "Missing Required Fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create admin user.", "Creation Failed");
        return;
      }

      toast.success("Admin account created successfully!");
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to create admin.", "Creation Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update admin.", "Update Failed");
        return;
      }

      toast.success("Admin profile & permissions updated successfully!");
      const isSelf = editingUser.id === currentSuperAdmin?.id;
      setEditingUser(null);
      await fetchUsers();
      if (isSelf) {
        await refreshUser();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to update admin.", "Update Error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete admin.", "Delete Failed");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success("Admin user deleted successfully.");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to delete admin.", "Delete Error");
    } finally {
      setIsDeleting(false);
    }
  };

  const superAdminsCount = users.filter((u) => u.role === "super_admin").length;
  const restrictedAdminsCount = users.filter((u) => u.role === "admin").length;
  const activeCount = users.filter((u) => u.status === "active").length;

  return (
    <PermissionGuard permission="users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCog className="w-5 h-5 text-amber-500" />
              Admin Users & Access Control (RBAC)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Super Admin controls which operational modules each admin is permitted to access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Refresh Admins"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create New Admin
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Admin Accounts
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {users.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeCount} active in system
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Super Admin
            </div>
            <div className="text-2xl font-bold text-amber-500 mt-1">
              1
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              System Owner & Master Access
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Team Admins
            </div>
            <div className="text-2xl font-bold text-blue-500 mt-1">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Assigned custom module permissions
            </div>
          </div>
        </div>

        {/* Admin Directory Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Registered Admin Team Members
            </span>
            <span className="text-xs text-slate-400">
              {users.length} user{users.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Admin User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Module Permissions</th>
                  <th className="py-3 px-4 font-semibold">Last Login</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                      Loading admin users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No admin users found.
                    </td>
                  </tr>
                ) : (
                  users.map((admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {admin.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{admin.email}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {admin.role === "super_admin" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
                            <Shield className="w-3 h-3" /> Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/40">
                            <Users className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${admin.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                        >
                          {admin.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {admin.role === "super_admin" ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All Modules Permitted
                          </span>
                        ) : admin.permissions.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            No permissions assigned
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {admin.permissions.map((p) => {
                              const match = ALL_PERMISSIONS.find((item) => item.key === p);
                              return (
                                <span
                                  key={p}
                                  className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  {match?.label || p}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {admin.last_login_at
                          ? new Date(admin.last_login_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "Never"}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(admin)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            title="Edit Permissions"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {admin.id !== currentSuperAdmin?.id && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(admin)}
                              className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition cursor-pointer"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create New Admin Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 my-auto shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-amber-500" />
                  Create New Admin Account
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Varma"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ramesh@siriwindows.in"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Module Permissions Checkbox Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Granted Module Permissions
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Select which operational sections this admin can access
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={selectAllAddPermissions}
                        className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={clearAllAddPermissions}
                        className="text-slate-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {ALL_PERMISSIONS.map((perm) => {
                      const checked = formData.permissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => toggleAddPermission(perm.key)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${checked
                              ? "bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500"
                            }`}
                        >
                          <div>
                            <div className="font-semibold text-xs">{perm.label}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              {perm.description}
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 ${checked
                                ? "bg-amber-500 border-amber-500 text-slate-950 font-bold"
                                : "border-slate-300 dark:border-slate-600"
                              }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
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
                    Create Admin Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Admin Permissions Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 my-auto shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  {editingUser.role === "super_admin"
                    ? `Edit Super Admin: ${editingUser.name}`
                    : `Edit Admin Access & Permissions: ${editingUser.name}`}
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateAdmin} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, email: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Account Status
                    </label>
                    <CustomSelect
                      value={editFormData.status}
                      onChange={(val) =>
                        setEditFormData({ ...editFormData, status: val })
                      }
                      size="sm"
                      dark={true}
                      options={[
                        { value: "active", label: "Active (Access Allowed)" },
                        { value: "inactive", label: "Inactive (Access Blocked)" },
                      ]}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Reset Password (optional)
                    </label>
                    <input
                      type="password"
                      minLength={6}
                      value={editFormData.password}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, password: e.target.value })
                      }
                      placeholder="Leave empty to keep current"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* If Super Admin, show badge notice; if normal admin, show module permissions list */}
                {editingUser.role === "super_admin" ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-400">Super Admin (System Owner)</span>
                        <p className="text-[11px] text-slate-400">
                          Full unrestricted master access to all operations & modules
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Granted Module Permissions
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Assign which operational sections this admin can access
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={selectAllEditPermissions}
                          className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={clearAllEditPermissions}
                          className="text-slate-400 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {ALL_PERMISSIONS.map((perm) => {
                        const checked = editFormData.permissions.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            onClick={() => toggleEditPermission(perm.key)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${checked
                                ? "bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500"
                              }`}
                          >
                            <div>
                              <div className="font-semibold text-xs">{perm.label}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">
                                {perm.description}
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 ${checked
                                  ? "bg-amber-500 border-amber-500 text-slate-950 font-bold"
                                  : "border-slate-300 dark:border-slate-600"
                                }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
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
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-4 sm:p-6 my-auto shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Delete Admin Account?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? This admin will no longer be able to log in.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
