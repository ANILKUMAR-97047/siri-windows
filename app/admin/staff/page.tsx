"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  Banknote,
  Coins,
  Calendar,
  CalendarCheck,
  Briefcase,
  Pencil,
  X,
  RefreshCw,
  Mail,
  Camera,
  Upload,
  Eye,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useStaffListQuery, queryKeys } from "@/lib/queries";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email?: string | null;
  photo_url?: string | null;
  base_salary: number;
  join_date: string;
  status: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<{
    url: string;
    name: string;
    role: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();
  const { data: cachedStaff, isLoading: queryLoading, refetch: refetchStaff } = useStaffListQuery();
  const supabase = createClient();

  // Instant zero-latency loading from cache
  useEffect(() => {
    if (cachedStaff && cachedStaff.length > 0) {
      setStaffList(cachedStaff as unknown as StaffMember[]);
      setLoading(false);
    } else if (!queryLoading) {
      setLoading(false);
    }
  }, [cachedStaff, queryLoading]);

  const fetchStaff = async () => {
    setLoading(true);
    await refetchStaff();
    setLoading(false);
  };

  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "UPVC Fabricator",
    department: "Workshop / Factory",
    phone: "",
    email: "",
    photo_url: "",
    baseSalary: 20000,
    status: "active",
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: "",
      role: "UPVC Fabricator",
      department: "Workshop / Factory",
      phone: "",
      email: "",
      photo_url: "",
      baseSalary: 20000,
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      department: staff.department,
      phone: staff.phone,
      email: staff.email || "",
      photo_url: staff.photo_url || "",
      baseSalary: Number(staff.base_salary || 0),
      status: staff.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormData((prev) => ({ ...prev, photo_url: json.url }));
        toast.success("Profile photo uploaded successfully!");
      } else {
        toast.error(json.error || "Failed to upload image", "Upload Failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Error uploading image", "Upload Error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (editingStaff) {
      // Update existing staff in Supabase
      const { data, error } = await (supabase.from("staff" as any) as any)
        .update({
          name: formData.name.trim(),
          role: formData.role.trim(),
          department: formData.department,
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          photo_url: formData.photo_url.trim() || null,
          base_salary: Number(formData.baseSalary),
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingStaff.id)
        .select();

      if (!error && data) {
        setStaffList(
          staffList.map((s) =>
            s.id === editingStaff.id ? (data[0] as unknown as StaffMember) : s
          )
        );

        // Sync salary record for current month if status changed to on_leave or inactive
        try {
          const now = new Date();
          const curMonth = now.getMonth() + 1;
          const curYear = now.getFullYear();

          if (formData.status === "on_leave" || formData.status === "inactive") {
            await (supabase.from("salary_records" as any) as any)
              .update({
                status: "on_leave",
                base_salary: 0,
                allowances: 0,
                deductions: 0,
                notes: `Staff marked ${formData.status} in directory`,
              })
              .eq("staff_id", editingStaff.id)
              .eq("month", curMonth)
              .eq("year", curYear)
              .eq("status", "pending");
          } else if (formData.status === "active") {
            await (supabase.from("salary_records" as any) as any)
              .update({
                status: "pending",
                base_salary: Number(formData.baseSalary),
                allowances: 0,
                deductions: 0,
                notes: "Reactivated to Active in directory",
              })
              .eq("staff_id", editingStaff.id)
              .eq("month", curMonth)
              .eq("year", curYear)
              .eq("status", "on_leave");
          }
        } catch (syncErr) {
          console.error("Salary sync on staff status change error:", syncErr);
        }

        toast.success("Staff profile updated successfully!");
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
        setIsModalOpen(false);
        setEditingStaff(null);
      } else if (error) {
        toast.error("Error updating staff member: " + error.message, "Update Failed");
      }
    } else {
      // Insert new staff member to Supabase
      const { data, error } = await (supabase.from("staff" as any) as any)
        .insert([
          {
            name: formData.name.trim(),
            role: formData.role.trim(),
            department: formData.department,
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            photo_url: formData.photo_url.trim() || null,
            base_salary: Number(formData.baseSalary),
            status: formData.status || "active",
          },
        ])
        .select();

      if (!error && data) {
        setStaffList([data[0] as unknown as StaffMember, ...staffList]);
        queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
        toast.success("New staff member added successfully!");
        setIsModalOpen(false);
      } else if (error) {
        toast.error("Error adding staff member: " + error.message, "Creation Failed");
      }
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PermissionGuard permission="staff">
      <div className="space-y-6">
        {/* Sub-navigation tabs: Staff Directory ↔ Attendance ↔ Salary Records */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit text-xs font-semibold">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            Staff Directory
          </div>
          <Link
            href="/admin/staff/attendance"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
            Daily Attendance & Time
          </Link>
          <Link
            href="/admin/staff/advances"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Salary Advances & Kharcha
          </Link>
          <Link
            href="/admin/staff/salaries"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Salary Records & Payroll
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Staff & Workforce Directory (Live Supabase DB)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fabricators, installers, site engineers, and field technicians in Tanuku HQ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStaff}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Refresh Staff from Database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/admin/staff/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition border border-slate-300 dark:border-slate-700"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              Staff Attendance
            </Link>
            <Link
              href="/admin/staff/salaries"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition border border-slate-300 dark:border-slate-700"
            >
              <Banknote className="w-4 h-4 text-emerald-500" />
              Salaries & Payroll
            </Link>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Staff Member
            </button>
          </div>
        </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, role, or phone..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            onClick={() => handleOpenEdit(staff)}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3.5 hover:border-amber-500/50 hover:shadow-md transition cursor-pointer group relative"
            title="Click to edit staff member"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  onClick={(e) => {
                    if (staff.photo_url) {
                      e.stopPropagation();
                      setViewPhoto({
                        url: staff.photo_url,
                        name: staff.name,
                        role: staff.role,
                      });
                    }
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm border shrink-0 overflow-hidden relative group/avatar ${
                    staff.photo_url
                      ? "border-amber-500/50 cursor-pointer hover:ring-2 hover:ring-amber-500/50"
                      : "bg-amber-500/10 text-amber-500 font-bold border-amber-500/30"
                  }`}
                  title={staff.photo_url ? "Click to view full photo" : undefined}
                >
                  {staff.photo_url ? (
                    <>
                      <img
                        src={staff.photo_url}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </>
                  ) : (
                    staff.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition flex items-center gap-1.5">
                    {staff.name}
                  </h3>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {staff.role}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                    staff.status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : staff.status === "on_leave"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {staff.status}
                </span>
                {staff.photo_url && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewPhoto({
                        url: staff.photo_url!,
                        name: staff.name,
                        role: staff.role,
                      });
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition"
                    title="View profile photo"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(staff);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition"
                  title="Edit staff details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{staff.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{staff.phone}</span>
              </div>
              {staff.email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{staff.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Joined:{" "}
                  {new Date(staff.join_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Monthly Base Salary</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  ₹{Number(staff.base_salary || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <Link
                href="/admin/staff/salaries"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Salary Records →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Modal (Add & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                {editingStaff ? (
                  <>
                    <Pencil className="w-4 h-4 text-amber-500" />
                    Edit Staff Member (Updates in Supabase)
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-amber-500" />
                    Add Staff Member (Saves to Supabase)
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingStaff(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Staff Member Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. S. Rambabu"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Role / Designation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Lead UPVC Fabricator"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <CustomSelect
                    value={formData.department}
                    onChange={(val) => setFormData({ ...formData, department: val })}
                    size="sm"
                    dark={true}
                    options={[
                      { value: "Workshop / Factory", label: "Workshop / Factory" },
                      { value: "Field Installation", label: "Field Installation" },
                      { value: "Operations", label: "Operations" },
                      { value: "Sales & Marketing", label: "Sales & Marketing" },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Employment Status
                  </label>
                  <CustomSelect
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    size="sm"
                    dark={true}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "on_leave", label: "On Leave" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98481 XXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. staff@siriwindows.in"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Base Monthly Salary (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.baseSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, baseSalary: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Profile Photo Upload / Path */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Profile Photo (Saved to Database)
                  </label>
                  {formData.photo_url && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      ✓ Image Ready
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Preview Circle */}
                  <div className="w-14 h-14 rounded-full border-2 border-amber-500/40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {formData.photo_url ? (
                      <img
                        src={formData.photo_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                    {formData.photo_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setViewPhoto({
                            url: formData.photo_url,
                            name: formData.name || "Preview",
                            role: formData.role,
                          })
                        }
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        title="View full image"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Upload controls */}
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow-xs">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {formData.photo_url ? "Change Photo" : "Upload Photo"}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.photo_url && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setViewPhoto({
                              url: formData.photo_url,
                              name: formData.name || "Preview",
                              role: formData.role,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                          title="View full photo"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, photo_url: "" }))}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm disabled:opacity-50"
                >
                  {editingStaff ? "Save Changes" : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile Image Lightbox Modal */}
      {viewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setViewPhoto(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm text-left">
                  {viewPhoto.name}
                </h4>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 text-left">
                  {viewPhoto.role}
                </p>
              </div>
              <button
                onClick={() => setViewPhoto(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <img
                src={viewPhoto.url}
                alt={viewPhoto.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="pt-2 flex justify-center">
              <a
                href={viewPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Image in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
      </div>
    </PermissionGuard>
  );
}
