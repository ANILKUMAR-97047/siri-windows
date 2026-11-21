"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Banknote,
  Plus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  Search,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  CalendarCheck,
  UserX,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";

interface StaffDetails {
  id: string;
  name: string;
  role: string;
  department?: string;
  base_salary: number;
  photo_url?: string | null;
  status?: string;
  join_date?: string | null;
}

interface SalaryRecord {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: "paid" | "pending" | "on_leave";
  payment_mode: string | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at?: string;
  staff?: StaffDetails | null;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthName(monthNum: number): string {
  return MONTH_NAMES[monthNum - 1] || `Month ${monthNum}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function SalariesPage() {
  const [staffList, setStaffList] = useState<StaffDetails[]>([]);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "on_leave">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "pay">("create");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const [salaryForm, setSalaryForm] = useState({
    staff_id: "",
    month: 11,
    year: 2026,
    baseSalary: 0,
    allowance: 0,
    deduction: 0,
    paymentMode: "Bank Transfer",
    notes: "",
  });

  const supabase = createClient();

  // Auto-sync missing monthly salary records for staff from their join_date to current month
  const autoSyncRecords = async (currentStaff: StaffDetails[], existingRecords: SalaryRecord[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Active or on_leave staff members with base salary
    const eligibleStaff = currentStaff.filter(
      (s) => Number(s.base_salary) > 0
    );

    // Existing set of staff_id_month_year
    const existingSet = new Set(
      existingRecords.map((r) => `${r.staff_id}_${r.month}_${r.year}`)
    );

    const missingRecords: Array<{
      staff_id: string;
      month: number;
      year: number;
      base_salary: number;
      allowances: number;
      deductions: number;
      status: "pending" | "on_leave";
      payment_mode: null;
      paid_at: null;
      notes?: string | null;
    }> = [];

    for (const staff of eligibleStaff) {
      let startYear = currentYear;
      let startMonth = 1;

      if (staff.join_date) {
        const d = new Date(staff.join_date);
        if (!isNaN(d.getTime())) {
          startYear = Math.max(2020, d.getFullYear());
          startMonth = d.getMonth() + 1;
        }
      }

      let y = startYear;
      let m = startMonth;

      while (y < currentYear || (y === currentYear && m <= currentMonth)) {
        const key = `${staff.id}_${m}_${y}`;
        if (!existingSet.has(key)) {
          // If staff is marked on_leave or inactive, record as on_leave with ₹0 base salary
          const isStaffLeave = staff.status === "on_leave" || staff.status === "inactive";
          missingRecords.push({
            staff_id: staff.id,
            month: m,
            year: y,
            base_salary: isStaffLeave ? 0 : Number(staff.base_salary) || 0,
            allowances: 0,
            deductions: 0,
            status: isStaffLeave ? "on_leave" : "pending",
            payment_mode: null,
            paid_at: null,
            notes: isStaffLeave ? `Staff marked ${staff.status} in directory` : null,
          });
          existingSet.add(key);
        }

        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
    }

    if (missingRecords.length > 0) {
      setSyncing(true);
      try {
        // Upsert in batches of 50 to avoid payload limits
        const chunkSize = 50;
        for (let i = 0; i < missingRecords.length; i += chunkSize) {
          const chunk = missingRecords.slice(i, i + chunkSize);
          await (supabase.from("salary_records" as any) as any).upsert(chunk, {
            onConflict: "staff_id,month,year",
            ignoreDuplicates: true,
          });
        }
        return true;
      } catch (err) {
        console.error("Auto-sync error:", err);
      } finally {
        setSyncing(false);
      }
    }
    return false;
  };

  // Fetch staff and salary records from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch dynamic staff members
      const { data: staffData, error: staffError } = await (
        supabase.from("staff" as any) as any
      )
        .select("id, name, role, department, base_salary, photo_url, status, join_date")
        .order("name");

      let loadedStaff: StaffDetails[] = [];
      if (!staffError && staffData) {
        loadedStaff = staffData as StaffDetails[];
        setStaffList(loadedStaff);
      }

      // 2. Fetch salary records
      const { data: salaryData, error: salaryError } = await (
        supabase.from("salary_records" as any) as any
      )
        .select("*, staff:staff_id(id, name, role, department, photo_url, join_date, status)")
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (!salaryError && salaryData) {
        let currentRecords = salaryData as unknown as SalaryRecord[];

        // Check if any missing records need auto-syncing
        const hadNewInserts = await autoSyncRecords(loadedStaff, currentRecords);
        if (hadNewInserts) {
          // Re-fetch with newly inserted records
          const { data: refreshedData } = await (
            supabase.from("salary_records" as any) as any
          )
            .select("*, staff:staff_id(id, name, role, department, photo_url, join_date, status)")
            .order("year", { ascending: false })
            .order("month", { ascending: false })
            .order("created_at", { ascending: false });

          if (refreshedData) {
            currentRecords = refreshedData as unknown as SalaryRecord[];
          }
        }

        setRecords(currentRecords);
      }
    } catch (err) {
      console.error("Failed to fetch salary data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open modal to create/process a new payout
  const handleOpenCreateModal = () => {
    const defaultStaff = staffList.length > 0 ? staffList[0] : null;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    setModalMode("create");
    setActiveRecordId(null);
    setSalaryForm({
      staff_id: defaultStaff?.id || "",
      month: currentMonth,
      year: currentYear,
      baseSalary: defaultStaff?.base_salary || 0,
      allowance: 0,
      deduction: 0,
      paymentMode: "Bank Transfer",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open modal pre-filled from an existing pending or on-leave row
  const handleOpenPayModal = (rec: SalaryRecord) => {
    // If base salary is 0 (because of on_leave), find standard base salary from staffList
    const staffMember = staffList.find((s) => s.id === rec.staff_id);
    const standardBase = Number(rec.base_salary) > 0 ? Number(rec.base_salary) : Number(staffMember?.base_salary || 0);

    setModalMode("pay");
    setActiveRecordId(rec.id);
    setSalaryForm({
      staff_id: rec.staff_id,
      month: rec.month,
      year: rec.year,
      baseSalary: standardBase,
      allowance: Number(rec.allowances) || 0,
      deduction: Number(rec.deductions) || 0,
      paymentMode: rec.payment_mode || "UPI / PhonePe",
      notes: rec.notes || "",
    });
    setIsModalOpen(true);
  };

  // When staff selection changes in modal, auto-fill base salary
  const handleStaffSelect = (staffId: string) => {
    const selected = staffList.find((s) => s.id === staffId);
    setSalaryForm((prev) => ({
      ...prev,
      staff_id: staffId,
      baseSalary: selected?.base_salary ?? prev.baseSalary,
    }));
  };

  // Submit salary payout to Supabase
  const handleRecordSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.staff_id) {
      toast.warning("Please select a staff member to record salary payout.", "Selection Required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        staff_id: salaryForm.staff_id,
        month: Number(salaryForm.month),
        year: Number(salaryForm.year),
        base_salary: Number(salaryForm.baseSalary) || 0,
        allowances: Number(salaryForm.allowance) || 0,
        deductions: Number(salaryForm.deduction) || 0,
        status: "paid",
        payment_mode: salaryForm.paymentMode,
        paid_at: new Date().toISOString(),
        notes: salaryForm.notes || null,
      };

      const { data, error } = await (
        supabase.from("salary_records" as any) as any
      )
        .upsert(payload, { onConflict: "staff_id,month,year" })
        .select("*, staff:staff_id(id, name, role, department, photo_url, join_date, status)")
        .single();

      if (error) {
        toast.error("Error processing salary: " + error.message, "Payout Error");
        return;
      }

      if (data) {
        toast.success("Salary payout recorded successfully!");
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.id !== data.id);
          return [data as unknown as SalaryRecord, ...filtered];
        });
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("An unexpected error occurred: " + (error?.message || "Unknown error"), "Payout Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick 1-click mark record as paid in Supabase
  const markAsPaid = async (id: string, mode: string) => {
    const paidAt = new Date().toISOString();

    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "paid" as const,
              payment_mode: mode,
              paid_at: paidAt,
            }
          : r
      )
    );

    const { error } = await (
      supabase.from("salary_records" as any) as any
    )
      .update({
        status: "paid",
        payment_mode: mode,
        paid_at: paidAt,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status: " + error.message, "Update Failed");
      fetchData();
    } else {
      toast.success("Salary marked as PAID successfully!");
    }
  };

  // Quick 1-click mark record as ON LEAVE / INACTIVE (₹0 Net Payout)
  const markAsLeave = async (id: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "on_leave" as const,
              base_salary: 0,
              allowances: 0,
              deductions: 0,
              net_salary: 0,
              notes: "Unpaid Leave / Inactive for this month",
            }
          : r
      )
    );

    const { error } = await (
      supabase.from("salary_records" as any) as any
    )
      .update({
        status: "on_leave",
        base_salary: 0,
        allowances: 0,
        deductions: 0,
        notes: "Unpaid Leave / Inactive for this month",
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status: " + error.message, "Update Failed");
      fetchData();
    } else {
      toast.info("Staff member marked as ON LEAVE for this month.");
    }
  };

  // Chronologically sorted distinct months present in records
  const uniqueMonths = useMemo(() => {
    const map = new Map<string, { month: number; year: number }>();
    records.forEach((r) => {
      const key = `${r.month}-${r.year}`;
      if (!map.has(key)) {
        map.set(key, { month: r.month, year: r.year });
      }
    });

    return Array.from(map.entries())
      .map(([value, { month, year }]) => ({
        value,
        month,
        year,
        label: `${getMonthName(month)} ${year}`,
      }))
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [records]);

  // Filtered records based on all active criteria
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Month filter
      if (filterMonth !== "all" && `${r.month}-${r.year}` !== filterMonth) {
        return false;
      }

      // Staff filter
      if (filterStaff !== "all" && r.staff_id !== filterStaff) {
        return false;
      }

      // Status filter
      if (filterStatus !== "all" && r.status !== filterStatus) {
        return false;
      }

      // Search query (name, role, department)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const staffName = r.staff?.name?.toLowerCase() || "";
        const role = r.staff?.role?.toLowerCase() || "";
        const dept = r.staff?.department?.toLowerCase() || "";
        const monthText = `${getMonthName(r.month)} ${r.year}`.toLowerCase();
        if (
          !staffName.includes(query) &&
          !role.includes(query) &&
          !dept.includes(query) &&
          !monthText.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [records, filterMonth, filterStaff, filterStatus, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterStaff, filterStatus, searchQuery]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Overall & Filtered Stats
  const now = new Date();
  const currentMonthKey = `${now.getMonth() + 1}-${now.getFullYear()}`;

  // Totals for filtered view
  const filteredPaid = useMemo(() => {
    return filteredRecords
      .filter((r) => r.status === "paid")
      .reduce((acc, curr) => acc + Number(curr.net_salary || 0), 0);
  }, [filteredRecords]);

  const filteredPending = useMemo(() => {
    return filteredRecords
      .filter((r) => r.status === "pending")
      .reduce((acc, curr) => acc + Number(curr.net_salary || 0), 0);
  }, [filteredRecords]);

  const paidCount = useMemo(() => {
    return filteredRecords.filter((r) => r.status === "paid").length;
  }, [filteredRecords]);

  const pendingCount = useMemo(() => {
    return filteredRecords.filter((r) => r.status === "pending").length;
  }, [filteredRecords]);

  const onLeaveCount = useMemo(() => {
    return filteredRecords.filter((r) => r.status === "on_leave").length;
  }, [filteredRecords]);

  // All-time counts for badges
  const allPendingCount = useMemo(() => {
    return records.filter((r) => r.status === "pending").length;
  }, [records]);

  const allOnLeaveCount = useMemo(() => {
    return records.filter((r) => r.status === "on_leave").length;
  }, [records]);

  // Active staff count & monthly commitment
  const activeStaffMembers = useMemo(() => {
    return staffList.filter((s) => s.status === "active");
  }, [staffList]);

  const totalMonthlyCommitment = useMemo(() => {
    return activeStaffMembers.reduce((acc, s) => acc + Number(s.base_salary || 0), 0);
  }, [activeStaffMembers]);

  const hasActiveFilters =
    filterMonth !== "all" ||
    filterStaff !== "all" ||
    filterStatus !== "all" ||
    searchQuery.trim() !== "";

  const resetFilters = () => {
    setFilterMonth("all");
    setFilterStaff("all");
    setFilterStatus("all");
    setSearchQuery("");
  };

  return (
    <PermissionGuard permission="salaries">
      <div className="space-y-6">
        {/* Sub-navigation tabs: Staff Directory ↔ Attendance ↔ Salary Records */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit text-xs font-semibold">
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
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
            Daily Attendance & Time
          </Link>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Salary Records & Payroll
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/staff"
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff Directory
              </Link>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-500" />
              Monthly Staff Salaries & Payroll
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated monthly salary records calculated from each member&apos;s joining date.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              title="Refresh and auto-sync dynamic records"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading || syncing ? "animate-spin text-emerald-500" : ""}`} />
              <span className="hidden md:inline text-[11px] text-slate-500">
                {syncing ? "Syncing..." : "Sync Payroll"}
              </span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Process New Salary Payout
            </button>
          </div>
        </div>

        {/* 3 Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Disbursed */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Total Disbursed (Paid Out)
              </span>
              <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              ₹{filteredPaid.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{paidCount} monthly payouts disbursed</span>
              {filterMonth !== "all" && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  • in selected filter
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Pending Payroll Approval */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 relative overflow-hidden shadow-xs bg-gradient-to-br from-white via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">
                Pending Payroll Approval
              </span>
              <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              ₹{filteredPending.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 flex items-center gap-1">
              <span>{pendingCount} monthly salaries awaiting disbursement</span>
            </div>
          </div>

          {/* Card 3: Monthly Staff Commitment */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Active Monthly Payroll
              </span>
              <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              ₹{totalMonthlyCommitment.toLocaleString("en-IN")}
              <span className="text-xs text-slate-400 font-normal ml-1">/ mo</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Standard base commitment across {activeStaffMembers.length} active staff
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          {/* Top row: Status tabs + quick jump */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  filterStatus === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All Records ({records.length})
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending ({allPendingCount})
              </button>
              <button
                onClick={() => setFilterStatus("paid")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "paid"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Paid Out ({paidCount})
              </button>
              <button
                onClick={() => setFilterStatus("on_leave")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "on_leave"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                On Leave ({allOnLeaveCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Jump to Current Month */}
              <button
                onClick={() => setFilterMonth(currentMonthKey)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  filterMonth === currentMonthKey
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Current Month ({MONTH_NAMES[now.getMonth()]} {now.getFullYear()})
              </button>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: Search input, Month dropdown, Staff dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Filter by Month */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <CustomSelect
                value={filterMonth}
                onChange={(val) => setFilterMonth(val)}
                size="sm"
                options={[
                  { value: "all", label: "All Months (Career History)" },
                  ...uniqueMonths.map((m) => ({
                    value: m.value,
                    label: `${m.label}${m.value === currentMonthKey ? " • (Current)" : ""}`,
                  })),
                ]}
              />
            </div>

            {/* Filter by Staff Member */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <CustomSelect
                value={filterStaff}
                onChange={(val) => setFilterStaff(val)}
                size="sm"
                options={[
                  { value: "all", label: `All Staff Members (${staffList.length})` },
                  ...staffList.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.role})${
                      s.status === "on_leave"
                        ? " • (On Leave)"
                        : s.status === "inactive"
                        ? " • (Inactive)"
                        : ""
                    }`,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Salary Records Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Monthly Salary Disbursements
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                ({filteredRecords.length} record{filteredRecords.length === 1 ? "" : "s"} shown)
              </span>
            </div>
            {filterStaff !== "all" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Tracking full career payroll from joining month
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Staff Member</th>
                  <th className="py-3 px-4 font-semibold">Month / Year</th>
                  <th className="py-3 px-4 font-semibold">Base Salary</th>
                  <th className="py-3 px-4 font-semibold">Allowances</th>
                  <th className="py-3 px-4 font-semibold">Deductions</th>
                  <th className="py-3 px-4 font-semibold">Net Payout</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Payment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading dynamic salary records from Supabase...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Banknote className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          No matching salary records found
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Try adjusting your filters or click &quot;Reset Filters&quot; to view all records.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Staff Member Details with Join Date & Directory status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {rec.staff?.photo_url ? (
                            <img
                              src={rec.staff.photo_url}
                              alt={rec.staff?.name || "Staff"}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {rec.staff?.name ? rec.staff.name.charAt(0) : "S"}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {rec.staff?.name || "Unknown Staff"}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{rec.staff?.role || rec.staff?.department || "Staff Member"}</span>
                              {rec.staff?.join_date && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  Joined {formatDate(rec.staff.join_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Month / Year */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {getMonthName(rec.month)} {rec.year}
                          </span>
                        </div>
                      </td>

                      {/* Base Salary */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                        ₹{Number(rec.base_salary || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Allowances */}
                      <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                        {Number(rec.allowances || 0) > 0 ? (
                          `+₹${Number(rec.allowances).toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      {/* Deductions */}
                      <td className="py-3.5 px-4 text-red-500 font-medium whitespace-nowrap">
                        {Number(rec.deductions || 0) > 0 ? (
                          `-₹${Number(rec.deductions).toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      {/* Net Payout */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm">
                        ₹{Number(rec.net_salary || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.status === "paid" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> PAID
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {rec.payment_mode || "Disbursed"}
                              {rec.paid_at && ` (${formatDate(rec.paid_at)})`}
                            </div>
                          </div>
                        ) : rec.status === "on_leave" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                              <UserX className="w-3 h-3" /> ON LEAVE (₹0)
                            </span>
                            {rec.notes && (
                              <div className="text-[10px] text-slate-400 mt-0.5 max-w-[130px] truncate" title={rec.notes}>
                                {rec.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>

                      {/* Payment Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {rec.status === "pending" ? (
                          <div className="inline-flex items-center gap-1.5">
                            {/* Pay Salary with Modal (Allows adjusting allowances/deductions) */}
                            <button
                              onClick={() => handleOpenPayModal(rec)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer transition shadow-xs flex items-center gap-1"
                              title="Process full payout with allowances/deductions"
                            >
                              <Banknote className="w-3 h-3" />
                              Pay Salary
                            </button>

                            {/* Quick UPI */}
                            <button
                              onClick={() => markAsPaid(rec.id, "UPI / PhonePe")}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 font-semibold text-[10px] cursor-pointer transition"
                              title="1-click mark as paid via UPI"
                            >
                              UPI
                            </button>

                            {/* Quick Cash */}
                            <button
                              onClick={() => markAsPaid(rec.id, "Cash")}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-[10px] cursor-pointer transition"
                              title="1-click mark as paid via Cash"
                            >
                              Cash
                            </button>

                            {/* 1-Click Mark as Leave (₹0 Net) */}
                            <button
                              onClick={() => markAsLeave(rec.id)}
                              className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 font-semibold text-[10px] cursor-pointer transition"
                              title="1-click mark as on leave / inactive for this month (sets ₹0 net pay)"
                            >
                              Leave (₹0)
                            </button>
                          </div>
                        ) : rec.status === "on_leave" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenPayModal(rec)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] cursor-pointer transition flex items-center gap-1"
                              title="Reactivate and disburse payout if staff returned"
                            >
                              <Banknote className="w-3 h-3 text-emerald-500" />
                              Reactivate / Pay
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-500" /> Disbursed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Process Salary Payout Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-500" />
                  {modalMode === "pay" ? "Confirm Salary Payout" : "Process New Salary Payout"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordSalary} className="space-y-3.5 text-xs">
                {/* Staff Member Selection */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Select Staff Member *
                  </label>
                  <CustomSelect
                    value={salaryForm.staff_id}
                    onChange={(val) => handleStaffSelect(val)}
                    disabled={modalMode === "pay"}
                    placeholder="Choose staff member..."
                    size="sm"
                    options={staffList.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.role})${
                        s.join_date ? ` • Joined ${formatDate(s.join_date)}` : ""
                      }`,
                    }))}
                  />
                </div>

                {/* Month and Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Salary Month
                    </label>
                    <CustomSelect
                      value={String(salaryForm.month)}
                      onChange={(val) =>
                        setSalaryForm({ ...salaryForm, month: Number(val) })
                      }
                      disabled={modalMode === "pay"}
                      size="sm"
                      options={MONTH_NAMES.map((name, i) => ({
                        value: String(i + 1),
                        label: name,
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Base Salary (₹) *
                    </label>
                    <input
                      type="number"
                      value={salaryForm.baseSalary}
                      onChange={(e) =>
                        setSalaryForm({ ...salaryForm, baseSalary: Number(e.target.value) })
                      }
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 font-semibold"
                    />
                  </div>
                </div>

                {/* Allowances & Deductions */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Overtime / Allowance (₹)
                    </label>
                    <input
                      type="number"
                      value={salaryForm.allowance}
                      onChange={(e) =>
                        setSalaryForm({ ...salaryForm, allowance: Number(e.target.value) })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Deductions / Advance (₹)
                    </label>
                    <input
                      type="number"
                      value={salaryForm.deduction}
                      onChange={(e) =>
                        setSalaryForm({ ...salaryForm, deduction: Number(e.target.value) })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method *
                  </label>
                  <CustomSelect
                    value={salaryForm.paymentMode}
                    onChange={(val) =>
                      setSalaryForm({ ...salaryForm, paymentMode: val })
                    }
                    size="sm"
                    options={[
                      { value: "UPI / PhonePe", label: "UPI / PhonePe / GPay" },
                      { value: "Bank Transfer", label: "Bank Transfer (NEFT/IMPS)" },
                      { value: "Cash", label: "Cash" },
                      { value: "Cheque", label: "Cheque" },
                    ]}
                  />
                </div>

                {/* Optional Notes */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Notes / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Transaction No. or Site Bonus"
                    value={salaryForm.notes}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, notes: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Calculated Net Payout Preview */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                      Net Payout Amount:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Base (₹{Number(salaryForm.baseSalary) || 0}) + Allowance (₹
                      {Number(salaryForm.allowance) || 0}) - Deduction (₹
                      {Number(salaryForm.deduction) || 0})
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    ₹{(
                      (Number(salaryForm.baseSalary) || 0) +
                      (Number(salaryForm.allowance) || 0) -
                      (Number(salaryForm.deduction) || 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirm Payout
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
