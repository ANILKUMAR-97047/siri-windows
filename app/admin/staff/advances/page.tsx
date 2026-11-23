"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Banknote,
  Plus,
  Calendar,
  Users,
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Coins,
  FileText,
  X,
  Upload,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast, confirmModal } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";
import { useQueryClient } from "@tanstack/react-query";
import { useStaffListQuery, queryKeys } from "@/lib/queries";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  phone?: string;
  photo_url?: string | null;
}

interface StaffAdvance {
  id: string;
  staff_id: string;
  advance_date: string;
  day_name: string;
  advance_month: number;
  advance_year: number;
  amount: number;
  payment_mode: string;
  reason: string;
  receipt_url?: string | null;
  status: "pending" | "settled";
  settled_salary_id?: string | null;
  created_at: string;
  staff?: StaffMember;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDayNameFromDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return "";
    return DAYS_OF_WEEK[d.getDay()];
  } catch {
    return "";
  }
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function StaffAdvancesPage() {
  const queryClient = useQueryClient();
  const { data: cachedStaff = [] } = useStaffListQuery();

  const [advances, setAdvances] = useState<StaffAdvance[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync staff list instantly from TanStack Query cache
  useEffect(() => {
    if (cachedStaff && cachedStaff.length > 0) {
      setStaffList(cachedStaff as unknown as StaffMember[]);
    }
  }, [cachedStaff]);

  // Date filters
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Additional filters
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    staff_id: "",
    advance_date: now.toISOString().split("T")[0],
    amount: "",
    payment_mode: "Cash",
    reason: "",
    receipt_url: "",
  });

  // Fetch Staff List
  const fetchStaffList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/attendance"); // attendance endpoint returns staff list
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data.staff)) {
          setStaffList(json.data.staff);
        } else if (Array.isArray(json.staff)) {
          setStaffList(json.staff);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // Fetch Advances
  const fetchAdvances = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });
      if (filterStaff !== "all") params.append("staff_id", filterStaff);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const res = await fetch(`/api/admin/staff/advances?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAdvances(json.data || []);
      } else {
        toast.error("Failed to load employee advances");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load employee advances");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, filterStaff, filterStatus]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Filtered Advances by search query
  const filteredAdvances = useMemo(() => {
    if (!searchQuery.trim()) return advances;
    const q = searchQuery.toLowerCase();
    return advances.filter(
      (a) =>
        a.staff?.name.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.payment_mode.toLowerCase().includes(q) ||
        a.day_name.toLowerCase().includes(q)
    );
  }, [advances, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalAdvances = 0;
    let pendingDeductions = 0;
    let settledInSalary = 0;
    const workerIds = new Set<string>();

    for (const a of advances) {
      const amt = Number(a.amount) || 0;
      totalAdvances += amt;
      workerIds.add(a.staff_id);
      if (a.status === "pending") {
        pendingDeductions += amt;
      } else if (a.status === "settled") {
        settledInSalary += amt;
      }
    }

    return {
      totalAdvances,
      pendingDeductions,
      settledInSalary,
      workerCount: workerIds.size,
    };
  }, [advances]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormState({
      staff_id: staffList.length > 0 ? staffList[0].id : "",
      advance_date: new Date().toISOString().split("T")[0],
      amount: "",
      payment_mode: "Cash",
      reason: "",
      receipt_url: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (advance: StaffAdvance) => {
    setModalMode("edit");
    setEditingId(advance.id);
    setFormState({
      staff_id: advance.staff_id,
      advance_date: advance.advance_date,
      amount: advance.amount.toString(),
      payment_mode: advance.payment_mode || "Cash",
      reason: advance.reason,
      receipt_url: advance.receipt_url || "",
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.staff_id) {
      toast.warning("Please select an employee");
      return;
    }
    const amt = parseFloat(formState.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning("Please enter a valid advance amount");
      return;
    }
    if (!formState.reason.trim()) {
      toast.warning("Please enter a reason or note for this advance");
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === "create") {
        const res = await fetch("/api/admin/staff/advances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });
        const json = await res.json();
        if (res.ok) {
          toast.success("Employee salary advance logged successfully!");
          queryClient.invalidateQueries({ queryKey: queryKeys.advances.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.salaries.all });
          setIsModalOpen(false);
          fetchAdvances();
        } else {
          toast.error(json.error || "Failed to log advance");
        }
      } else {
        const res = await fetch(`/api/admin/staff/advances/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });
        const json = await res.json();
        if (res.ok) {
          toast.success("Advance record updated successfully!");
          queryClient.invalidateQueries({ queryKey: queryKeys.advances.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.salaries.all });
          setIsModalOpen(false);
          fetchAdvances();
        } else {
          toast.error(json.error || "Failed to update advance");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save advance record");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (advance: StaffAdvance) => {
    const confirmed = await confirmModal({
      title: "Delete Advance Record?",
      message: `Are you sure you want to delete the ₹${Number(advance.amount).toLocaleString()} advance given to ${advance.staff?.name || "this worker"} on ${formatDateDisplay(advance.advance_date)}?`,
      type: "danger",
      confirmText: "Delete Record",
      cancelText: "Keep",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/staff/advances/${advance.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Advance record deleted successfully");
        queryClient.invalidateQueries({ queryKey: queryKeys.advances.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.salaries.all });
        fetchAdvances();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to delete advance");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting advance");
    }
  };

  // Handle Receipt Upload
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingReceipt(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "advances");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        setFormState((prev) => ({ ...prev, receipt_url: json.url }));
        toast.success("Voucher / receipt photo uploaded!");
      } else {
        toast.error("Receipt upload failed");
      }
    } catch {
      toast.error("Error uploading receipt");
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <PermissionGuard permission="salaries">
      <div className="space-y-6">
        {/* Top Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-full overflow-x-auto whitespace-nowrap scrollbar-none text-xs font-semibold">
          <Link
            href="/admin/staff"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Staff Directory
          </Link>
          <Link
            href="/admin/staff/attendance"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Daily Attendance & Time
          </Link>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold shadow-xs flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Salary Advances & Kharcha
          </div>
          <Link
            href="/admin/staff/salaries"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Salary Records & Payroll
          </Link>
        </div>

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Employee Salary Advances & Kharcha
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track individual worker cash advances with Date & Day. Automatically deducted in month-end salary payout.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Log Salary Advance
            </button>
          </div>
        </div>

        {/* Month & Year Navigation + Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Previous / Next Month Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Month & Year Pickers */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-36">
                <CustomSelect
                  value={selectedMonth.toString()}
                  onChange={(val) => setSelectedMonth(parseInt(val, 10))}
                  options={MONTH_NAMES.map((name, idx) => ({
                    value: (idx + 1).toString(),
                    label: name,
                  }))}
                  placeholder="Select Month"
                />
              </div>

              <div className="w-28">
                <CustomSelect
                  value={selectedYear.toString()}
                  onChange={(val) => setSelectedYear(parseInt(val, 10))}
                  options={[2024, 2025, 2026, 2027].map((yr) => ({
                    value: yr.toString(),
                    label: yr.toString(),
                  }))}
                  placeholder="Select Year"
                />
              </div>
            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            {/* Filter by Worker */}
            <div className="w-56">
              <CustomSelect
                value={filterStaff}
                onChange={setFilterStaff}
                options={[
                  { value: "all", label: `All Workers (${staffList.length})` },
                  ...staffList.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.role})`,
                  })),
                ]}
                placeholder="Filter by Worker"
              />
            </div>

            {/* Filter by Status */}
            <div className="w-44">
              <CustomSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "pending", label: "Pending Deduction" },
                  { value: "settled", label: "Settled in Salary" },
                ]}
                placeholder="Filter Status"
              />
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by worker, reason, day..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>

        {/* Monthly Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Total Advances ({MONTH_NAMES[selectedMonth - 1]})</span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              ₹ {summary.totalAdvances.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across {filteredAdvances.length} daily entries
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 mb-1">
              <span>Pending Salary Deductions</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              ₹ {summary.pendingDeductions.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
              To be deducted in month-end salary
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1">
              <span>Settled in Salary Payout</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹ {summary.settledInSalary.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Already deducted in salary slips
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Workers with Advances</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.workerCount} Workers
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Out of {staffList.length} total active staff
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>
                Advances Ledger for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <span className="text-xs font-normal text-slate-400">
                ({filteredAdvances.length} entries)
              </span>
            </h3>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Looking for past months?</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Use the Month Navigator above
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading employee advances...
            </div>
          ) : filteredAdvances.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm space-y-2">
              <Coins className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="font-semibold text-slate-600 dark:text-slate-300">
                No salary advances logged for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No cash advances were taken by staff during this month. Click &quot;Log Salary Advance&quot; whenever you give advance cash.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Advance Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Date & Day</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Reason / Purpose</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Settlement Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredAdvances.map((adv) => (
                    <tr
                      key={adv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Date & Day */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatDateDisplay(adv.advance_date)}
                        </div>
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 mt-0.5">
                          {adv.day_name}
                        </div>
                      </td>

                      {/* Staff Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                            {adv.staff?.name ? adv.staff.name.charAt(0).toUpperCase() : "W"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {adv.staff?.name || "Unknown Worker"}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {adv.staff?.role || "Staff Member"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-900 dark:text-white font-medium line-clamp-2">
                          {adv.reason}
                        </div>
                        {adv.receipt_url && (
                          <a
                            href={adv.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:underline mt-0.5"
                          >
                            <FileText className="w-3 h-3" />
                            View Voucher Photo
                          </a>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {adv.payment_mode || "Cash"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          ₹ {Number(adv.amount).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-slate-400">Advance Deductible</div>
                      </td>

                      {/* Settlement Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {adv.status === "settled" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" />
                            Settled in Salary
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                            <Clock className="w-3 h-3" />
                            Pending Deduction
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(adv)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title="Edit Advance"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(adv)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Delete Advance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Log / Edit Advance Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {modalMode === "create" ? "Log Employee Salary Advance" : "Edit Advance Record"}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enter cash advance / kharcha given to the worker
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Select Staff Member */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Staff Member *
                  </label>
                  <CustomSelect
                    value={formState.staff_id}
                    onChange={(val) => setFormState((prev) => ({ ...prev, staff_id: val }))}
                    options={staffList.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.role})`,
                    }))}
                    placeholder="Choose worker..."
                  />
                </div>

                {/* Date & Day Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Advance Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formState.advance_date}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, advance_date: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Day of the Week (Auto)
                    </label>
                    <div className="px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{getDayNameFromDate(formState.advance_date) || "Select a date"}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Payment Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Advance Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="e.g. 2000"
                      value={formState.amount}
                      onChange={(e) => setFormState((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Payment Mode
                    </label>
                    <CustomSelect
                      value={formState.payment_mode}
                      onChange={(val) => setFormState((prev) => ({ ...prev, payment_mode: val }))}
                      options={[
                        { value: "Cash", label: "Cash" },
                        { value: "UPI / PhonePe / GPay", label: "UPI / PhonePe / GPay" },
                        { value: "Bank Transfer", label: "Bank Transfer" },
                      ]}
                      placeholder="Select Mode"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Advance Reason / Notes *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Advance for Diwali festival / Personal emergency / Hand loan"
                    value={formState.reason}
                    onChange={(e) => setFormState((prev) => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Optional Voucher Photo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Voucher / Receipt Slip (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingReceipt ? "Uploading..." : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        disabled={uploadingReceipt}
                        className="hidden"
                      />
                    </label>
                    {formState.receipt_url && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Photo Attached
                      </span>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting && (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    )}
                    {modalMode === "create" ? "Save Advance Record" : "Update Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
