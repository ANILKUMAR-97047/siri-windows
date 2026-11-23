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
  Coins,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";
import { useQueryClient } from "@tanstack/react-query";
import { useStaffListQuery, queryKeys } from "@/lib/queries";

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
  const queryClient = useQueryClient();
  const { data: cachedStaff = [] } = useStaffListQuery();

  const [staffList, setStaffList] = useState<StaffDetails[]>([]);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Sync staff list instantly from TanStack Query cache
  useEffect(() => {
    if (cachedStaff && cachedStaff.length > 0) {
      setStaffList(cachedStaff as unknown as StaffDetails[]);
    }
  }, [cachedStaff]);

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

  const [pendingAdvancesInfo, setPendingAdvancesInfo] = useState<{
    count: number;
    totalAll: number;
    currentMonthTotal: number;
    pastMonthTotal: number;
    currentMonthCount: number;
    pastMonthCount: number;
    items: Array<{
      id: string;
      staff_id?: string;
      amount: number;
      reason: string;
      advance_date: string;
      day_name: string;
      advance_month: number;
      advance_year: number;
      payment_mode?: string;
    }>;
  }>({
    count: 0,
    totalAll: 0,
    currentMonthTotal: 0,
    pastMonthTotal: 0,
    currentMonthCount: 0,
    pastMonthCount: 0,
    items: [],
  });

  // Selected Staff Details
  const selectedStaffMember = useMemo(() => {
    return staffList.find((s) => s.id === salaryForm.staff_id) || null;
  }, [staffList, salaryForm.staff_id]);

  // Check if selected month/year is before staff join date
  const joinDateInfo = useMemo(() => {
    if (!selectedStaffMember?.join_date) return null;
    const d = new Date(selectedStaffMember.join_date);
    if (isNaN(d.getTime())) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      formatted: formatDate(selectedStaffMember.join_date),
    };
  }, [selectedStaffMember]);

  const isBeforeJoinDate = useMemo(() => {
    if (!joinDateInfo) return false;
    if (salaryForm.year < joinDateInfo.year) return true;
    if (salaryForm.year === joinDateInfo.year && salaryForm.month < joinDateInfo.month) return true;
    return false;
  }, [joinDateInfo, salaryForm.year, salaryForm.month]);

  // Check if already paid for the selected employee, month, and year
  const existingPaidRecord = useMemo(() => {
    if (!salaryForm.staff_id) return null;
    return (
      records.find(
        (r) =>
          r.staff_id === salaryForm.staff_id &&
          Number(r.month) === Number(salaryForm.month) &&
          Number(r.year) === Number(salaryForm.year) &&
          r.status === "paid"
      ) || null
    );
  }, [records, salaryForm.staff_id, salaryForm.month, salaryForm.year]);

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

  // Fetch all pending advances for an employee's running ledger (across all dates/months)
  const fetchStaffPendingAdvances = async (staffId: string, month?: number, year?: number) => {
    try {
      const { data, error } = await (supabase.from("staff_advances" as any) as any)
        .select("id, staff_id, amount, reason, advance_date, day_name, advance_month, advance_year, payment_mode")
        .eq("staff_id", staffId)
        .eq("status", "pending")
        .order("advance_date", { ascending: true });

      if (!error && data && data.length > 0) {
        let currentMonthTotal = 0;
        let otherMonthsTotal = 0;
        let currentMonthCount = 0;
        let otherMonthsCount = 0;

        for (const item of data) {
          const amt = Number(item.amount) || 0;
          if (
            month &&
            year &&
            Number(item.advance_year) === year &&
            Number(item.advance_month) === month
          ) {
            currentMonthTotal += amt;
            currentMonthCount++;
          } else {
            otherMonthsTotal += amt;
            otherMonthsCount++;
          }
        }

        const totalAll = currentMonthTotal + otherMonthsTotal;

        setPendingAdvancesInfo({
          count: data.length,
          totalAll,
          currentMonthTotal,
          pastMonthTotal: otherMonthsTotal,
          currentMonthCount,
          pastMonthCount: otherMonthsCount,
          items: data,
        });

        return totalAll;
      }
    } catch {
      // ignore
    }

    setPendingAdvancesInfo({
      count: 0,
      totalAll: 0,
      currentMonthTotal: 0,
      pastMonthTotal: 0,
      currentMonthCount: 0,
      pastMonthCount: 0,
      items: [],
    });
    return 0;
  };

  // Open modal to create/process a new payout
  const handleOpenCreateModal = async () => {
    const defaultStaff = staffList.length > 0 ? staffList[0] : null;
    const now = new Date();
    let currentMonth = now.getMonth() + 1;
    let currentYear = now.getFullYear();

    if (defaultStaff?.join_date) {
      const d = new Date(defaultStaff.join_date);
      if (!isNaN(d.getTime())) {
        const jYear = d.getFullYear();
        const jMonth = d.getMonth() + 1;
        if (currentYear < jYear || (currentYear === jYear && currentMonth < jMonth)) {
          currentYear = jYear;
          currentMonth = jMonth;
        }
      }
    }

    let advTotal = 0;
    if (defaultStaff?.id) {
      advTotal = await fetchStaffPendingAdvances(defaultStaff.id, currentMonth, currentYear);
    }

    setModalMode("create");
    setActiveRecordId(null);
    setSalaryForm({
      staff_id: defaultStaff?.id || "",
      month: currentMonth,
      year: currentYear,
      baseSalary: defaultStaff?.base_salary || 0,
      allowance: 0,
      deduction: advTotal,
      paymentMode: "Bank Transfer",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open modal pre-filled from an existing pending or on-leave row
  const handleOpenPayModal = async (rec: SalaryRecord) => {
    // If base salary is 0 (because of on_leave), find standard base salary from staffList
    const staffMember = staffList.find((s) => s.id === rec.staff_id);
    const standardBase = Number(rec.base_salary) > 0 ? Number(rec.base_salary) : Number(staffMember?.base_salary || 0);

    const advTotal = await fetchStaffPendingAdvances(rec.staff_id, rec.month, rec.year);
    const initialDeduction = Number(rec.deductions) > 0 ? Number(rec.deductions) : advTotal;

    setModalMode("pay");
    setActiveRecordId(rec.id);
    setSalaryForm({
      staff_id: rec.staff_id,
      month: rec.month,
      year: rec.year,
      baseSalary: standardBase,
      allowance: Number(rec.allowances) || 0,
      deduction: initialDeduction,
      paymentMode: rec.payment_mode || "UPI / PhonePe",
      notes: rec.notes || "",
    });
    setIsModalOpen(true);
  };

  // When staff selection changes in modal, auto-fill base salary and pending advances for that specific staff member
  const handleStaffSelect = async (staffId: string) => {
    const selected = staffList.find((s) => s.id === staffId);
    let targetMonth = salaryForm.month;
    let targetYear = salaryForm.year;

    // If currently selected month/year is before this staff member's join date, automatically jump to their join month/year or current
    if (selected?.join_date) {
      const d = new Date(selected.join_date);
      if (!isNaN(d.getTime())) {
        const jYear = d.getFullYear();
        const jMonth = d.getMonth() + 1;
        if (targetYear < jYear || (targetYear === jYear && targetMonth < jMonth)) {
          const now = new Date();
          targetYear = now.getFullYear();
          targetMonth = now.getMonth() + 1;
          if (targetYear < jYear || (targetYear === jYear && targetMonth < jMonth)) {
            targetYear = jYear;
            targetMonth = jMonth;
          }
        }
      }
    }

    const advTotal = await fetchStaffPendingAdvances(staffId, targetMonth, targetYear);
    setSalaryForm((prev) => ({
      ...prev,
      staff_id: staffId,
      month: targetMonth,
      year: targetYear,
      baseSalary: selected?.base_salary ?? 0,
      deduction: advTotal,
    }));
  };

  // When salary month changes in modal, auto-update pending advances for that specific month
  const handleMonthChange = async (newMonth: number) => {
    const advTotal = await fetchStaffPendingAdvances(salaryForm.staff_id, newMonth, salaryForm.year);
    setSalaryForm((prev) => ({
      ...prev,
      month: newMonth,
      deduction: advTotal,
    }));
  };

  // When salary year changes in modal, auto-update pending advances for that specific year
  const handleYearChange = async (newYear: number) => {
    const advTotal = await fetchStaffPendingAdvances(salaryForm.staff_id, salaryForm.month, newYear);
    setSalaryForm((prev) => ({
      ...prev,
      year: newYear,
      deduction: advTotal,
    }));
  };

  // Submit salary payout to Supabase
  const handleRecordSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.staff_id) {
      toast.warning("Please select a staff member to record salary payout.", "Selection Required");
      return;
    }

    if (isBeforeJoinDate) {
      toast.error(
        `Cannot process salary for months prior to joining. ${selectedStaffMember?.name || "Staff"} joined on ${joinDateInfo?.formatted || "a later date"}.`,
        "Pre-Joining Date Blocked"
      );
      return;
    }

    if (modalMode === "create" && existingPaidRecord) {
      toast.warning(
        `Salary for ${selectedStaffMember?.name || "this employee"} for ${getMonthName(salaryForm.month)} ${salaryForm.year} is already paid.`,
        "Duplicate Payout Blocked"
      );
      return;
    }

    setSubmitting(true);
    try {
      const deductionAmt = Number(salaryForm.deduction) || 0;
      const carryForwardAmt =
        pendingAdvancesInfo.totalAll > deductionAmt
          ? pendingAdvancesInfo.totalAll - deductionAmt
          : 0;

      let finalNotes = salaryForm.notes;
      if (!finalNotes && deductionAmt > 0 && carryForwardAmt > 0) {
        finalNotes = `Partial advance installment of ₹${deductionAmt.toLocaleString("en-IN")}. Balance ₹${carryForwardAmt.toLocaleString("en-IN")} carried forward.`;
      }

      const payload = {
        staff_id: salaryForm.staff_id,
        month: Number(salaryForm.month),
        year: Number(salaryForm.year),
        base_salary: Number(salaryForm.baseSalary) || 0,
        allowances: Number(salaryForm.allowance) || 0,
        deductions: deductionAmt,
        status: "paid",
        payment_mode: salaryForm.paymentMode,
        paid_at: new Date().toISOString(),
        notes: finalNotes || null,
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
        // Settle advances according to the actual deduction amount (supports partial installments & carry-forward)
        if (deductionAmt > 0 && pendingAdvancesInfo.items.length > 0) {
          try {
            let remainingDeduction = deductionAmt;
            for (const item of pendingAdvancesInfo.items) {
              if (remainingDeduction <= 0) break;
              const itemAmt = Number(item.amount) || 0;
              if (remainingDeduction >= itemAmt) {
                // Entire advance item is covered by deduction
                await (supabase.from("staff_advances" as any) as any)
                  .update({ status: "settled", settled_salary_id: data.id })
                  .eq("id", item.id);
                remainingDeduction -= itemAmt;
              } else {
                // Partial installment deduction on this advance item
                // Calculate unpaid portion that carries forward
                const unpaidBalance = Math.round((itemAmt - remainingDeduction) * 100) / 100;

                // 1) Update original record with the remaining pending balance
                await (supabase.from("staff_advances" as any) as any)
                  .update({ amount: unpaidBalance })
                  .eq("id", item.id);

                // 2) Insert a settled split record for the portion deducted in this salary payout
                await (supabase.from("staff_advances" as any) as any)
                  .insert({
                    staff_id: item.staff_id || salaryForm.staff_id,
                    advance_date: item.advance_date,
                    day_name: item.day_name,
                    advance_month: item.advance_month,
                    advance_year: item.advance_year,
                    amount: remainingDeduction,
                    payment_mode: item.payment_mode || "Cash",
                    reason: `${item.reason} (Partial installment settled in ${getMonthName(salaryForm.month)} ${salaryForm.year} salary)`,
                    status: "settled",
                    settled_salary_id: data.id,
                  });

                remainingDeduction = 0;
                break;
              }
            }
          } catch (settleErr) {
            console.error("Error settling advances installment:", settleErr);
          }
        }
        // NOTE: If deductionAmt === 0 (skipped this month),
        // zero advances are marked settled! They remain pending and carry forward to next month automatically.

        toast.success("Salary payout recorded successfully!");
        queryClient.invalidateQueries({ queryKey: queryKeys.salaries.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.advances.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.salaries.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.salaries.all });
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
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-full overflow-x-auto whitespace-nowrap text-xs font-semibold scrollbar-none">
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
          <Link
            href="/admin/staff/advances"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Salary Advances & Kharcha
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
                      Loading salary records...
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
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

                {/* Month, Year and Base Salary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Salary Month *
                    </label>
                    <CustomSelect
                      value={String(salaryForm.month)}
                      onChange={(val) => handleMonthChange(Number(val))}
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
                      Salary Year *
                    </label>
                    <CustomSelect
                      value={String(salaryForm.year)}
                      onChange={(val) => handleYearChange(Number(val))}
                      disabled={modalMode === "pay"}
                      size="sm"
                      options={[2024, 2025, 2026, 2027].map((yr) => ({
                        value: String(yr),
                        label: String(yr),
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

                {/* Pre-Joining Date Warning Banner */}
                {isBeforeJoinDate && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Cannot Process Salary Prior to Joining</div>
                      <div className="mt-0.5">
                        {selectedStaffMember?.name || "This staff member"} joined Siri Windows on{" "}
                        <strong>{joinDateInfo?.formatted}</strong>. Salaries can only be processed from{" "}
                        <strong>
                          {getMonthName(joinDateInfo?.month || 1)} {joinDateInfo?.year}
                        </strong>{" "}
                        onwards.
                      </div>
                    </div>
                  </div>
                )}

                {/* Already Paid Notification Banner */}
                {!isBeforeJoinDate && existingPaidRecord && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        Salary Already Paid for {getMonthName(salaryForm.month)} {salaryForm.year}
                      </div>
                      <div className="mt-0.5">
                        Disbursed on{" "}
                        <strong>{formatDate(existingPaidRecord.paid_at || existingPaidRecord.created_at)}</strong> •
                        Net Paid:{" "}
                        <strong>₹{Number(existingPaidRecord.net_salary).toLocaleString("en-IN")}</strong> via{" "}
                        <span className="font-semibold">{existingPaidRecord.payment_mode || "Bank Transfer"}</span>.
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Outstanding Advances & Carry-Forward Control */}
                {!isBeforeJoinDate && !existingPaidRecord && pendingAdvancesInfo.totalAll > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                        <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Outstanding Advances: ₹{pendingAdvancesInfo.totalAll.toLocaleString("en-IN")}</span>
                        <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                          ({pendingAdvancesInfo.count} item{pendingAdvancesInfo.count > 1 ? "s" : ""})
                        </span>
                      </div>
                      <Link
                        href={`/admin/staff/advances?staff_id=${salaryForm.staff_id}&month=${salaryForm.month}&year=${salaryForm.year}`}
                        target="_blank"
                        className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 underline hover:text-amber-900"
                      >
                        View Full Ledger
                      </Link>
                    </div>

                    {/* Breakdown of Current Month vs Other Unsettled Advances */}
                    <div className="text-[11px] text-amber-800/90 dark:text-amber-300/90 flex items-center gap-2 flex-wrap">
                      {pendingAdvancesInfo.currentMonthTotal > 0 && (
                        <span>
                          • {getMonthName(salaryForm.month)} Advances: <strong>₹{pendingAdvancesInfo.currentMonthTotal.toLocaleString("en-IN")}</strong>
                        </span>
                      )}
                      {pendingAdvancesInfo.pastMonthTotal > 0 && (
                        <span>
                          • {pendingAdvancesInfo.currentMonthTotal > 0 ? "Other Unsettled Advances" : "Unsettled Advances (Other Months)"}: <strong>₹{pendingAdvancesInfo.pastMonthTotal.toLocaleString("en-IN")}</strong>
                        </span>
                      )}
                    </div>

                    {/* 1-Click Action Buttons */}
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      {/* Button 1: Deduct All Outstanding */}
                      <button
                        type="button"
                        onClick={() =>
                          setSalaryForm((prev) => ({
                            ...prev,
                            deduction: pendingAdvancesInfo.totalAll,
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          salaryForm.deduction === pendingAdvancesInfo.totalAll
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200"
                        }`}
                      >
                        ✓ Deduct All (₹{pendingAdvancesInfo.totalAll.toLocaleString("en-IN")})
                      </button>

                      {/* Button 2: Deduct Current Month Only (if past exists) */}
                      {pendingAdvancesInfo.pastMonthTotal > 0 && pendingAdvancesInfo.currentMonthTotal > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSalaryForm((prev) => ({
                              ...prev,
                              deduction: pendingAdvancesInfo.currentMonthTotal,
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            salaryForm.deduction === pendingAdvancesInfo.currentMonthTotal
                              ? "bg-amber-600 text-white shadow-xs"
                              : "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200"
                          }`}
                        >
                          Deduct {getMonthName(salaryForm.month)} Only (₹{pendingAdvancesInfo.currentMonthTotal.toLocaleString("en-IN")})
                        </button>
                      )}

                      {/* Button 3: Skip Advances Deduction this month (Defer to next month) */}
                      <button
                        type="button"
                        onClick={() =>
                          setSalaryForm((prev) => {
                            const deferNote = "Advance deduction deferred to next month.";
                            const newNotes = prev.notes
                              ? prev.notes.includes(deferNote)
                                ? prev.notes
                                : `${prev.notes} • ${deferNote}`
                              : deferNote;
                            return {
                              ...prev,
                              deduction: 0,
                              notes: newNotes,
                            };
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          salaryForm.deduction === 0
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                        title="Do not deduct advances this month. Advances will remain pending and carry forward to next month."
                      >
                        Skip Deduction This Month (₹0)
                      </button>
                    </div>

                    {/* Live Status / Installment Preview Badges */}
                    {salaryForm.deduction > 0 && salaryForm.deduction < pendingAdvancesInfo.totalAll && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1 mt-1">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Partial Installment: ₹{salaryForm.deduction.toLocaleString("en-IN")} Deducted Now
                          </span>
                          <span className="text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full text-[10px]">
                            ₹{(pendingAdvancesInfo.totalAll - salaryForm.deduction).toLocaleString("en-IN")} Carries Forward
                          </span>
                        </div>
                        <p className="text-[10.5px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                          ₹{salaryForm.deduction.toLocaleString("en-IN")} will be settled from the oldest advances without financial burden on the employee. The remaining balance of ₹{(pendingAdvancesInfo.totalAll - salaryForm.deduction).toLocaleString("en-IN")} carries forward automatically to next month.
                        </p>
                      </div>
                    )}

                    {salaryForm.deduction === 0 && (
                      <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium pt-0.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>Advance deduction skipped: full salary paid. All ₹{pendingAdvancesInfo.totalAll.toLocaleString("en-IN")} advances remain pending and carry forward to next month automatically.</span>
                      </div>
                    )}

                    {salaryForm.deduction === pendingAdvancesInfo.totalAll && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>All ₹{pendingAdvancesInfo.totalAll.toLocaleString("en-IN")} outstanding advances will be fully settled this month.</span>
                      </div>
                    )}

                    {salaryForm.deduction > pendingAdvancesInfo.totalAll && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-0.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Deduction covers all ₹{pendingAdvancesInfo.totalAll.toLocaleString("en-IN")} advances + ₹{(salaryForm.deduction - pendingAdvancesInfo.totalAll).toLocaleString("en-IN")} additional deductions.</span>
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={
                      submitting ||
                      isBeforeJoinDate ||
                      (modalMode === "create" && !!existingPaidRecord)
                    }
                    className={`px-5 py-2 rounded-lg font-bold transition shadow-sm flex items-center gap-1.5 ${
                      isBeforeJoinDate
                        ? "bg-rose-600/70 dark:bg-rose-700/70 text-white cursor-not-allowed opacity-80"
                        : modalMode === "create" && existingPaidRecord
                        ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    }`}
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isBeforeJoinDate
                      ? "Cannot Pay (Prior to Join Date)"
                      : modalMode === "create" && existingPaidRecord
                      ? "Already Paid for this Month"
                      : modalMode === "pay" && existingPaidRecord
                      ? "Update Paid Record"
                      : "Confirm Payout"}
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
