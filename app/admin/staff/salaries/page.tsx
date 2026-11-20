"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface StaffDetails {
  id: string;
  name: string;
  role: string;
  department?: string;
  base_salary: number;
  photo_url?: string | null;
  status?: string;
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
  status: "paid" | "pending";
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

function formatPaidDate(dateStr?: string | null): string {
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
  const [filterMonth, setFilterMonth] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  // Form state for Process New Salary Modal
  const [newSalary, setNewSalary] = useState({
    staff_id: "",
    month: 11,
    year: 2026,
    baseSalary: 0,
    allowance: 0,
    deduction: 0,
    paymentMode: "Bank Transfer",
  });

  // Fetch staff and salary records from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch dynamic staff
      const { data: staffData, error: staffError } = await (
        supabase.from("staff" as any) as any
      )
        .select("id, name, role, department, base_salary, photo_url, status")
        .order("name");

      if (!staffError && staffData) {
        setStaffList(staffData as StaffDetails[]);
      }

      // Fetch dynamic salary records with joined staff details
      const { data: salaryData, error: salaryError } = await (
        supabase.from("salary_records" as any) as any
      )
        .select("*, staff:staff_id(id, name, role, department, photo_url)")
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (!salaryError && salaryData) {
        setRecords(salaryData as unknown as SalaryRecord[]);
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

  // When opening modal, initialize form with default staff member if not already set
  const handleOpenModal = () => {
    const defaultStaff = staffList.length > 0 ? staffList[0] : null;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    setNewSalary({
      staff_id: defaultStaff?.id || "",
      month: currentMonth,
      year: currentYear,
      baseSalary: defaultStaff?.base_salary || 0,
      allowance: 0,
      deduction: 0,
      paymentMode: "Bank Transfer",
    });
    setIsModalOpen(true);
  };

  // When staff selection changes in modal, auto-fill base salary
  const handleStaffSelect = (staffId: string) => {
    const selected = staffList.find((s) => s.id === staffId);
    setNewSalary((prev) => ({
      ...prev,
      staff_id: staffId,
      baseSalary: selected?.base_salary ?? prev.baseSalary,
    }));
  };

  // Submit new salary payout to Supabase
  const handleRecordSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalary.staff_id) {
      alert("Please select a staff member");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        staff_id: newSalary.staff_id,
        month: Number(newSalary.month),
        year: Number(newSalary.year),
        base_salary: Number(newSalary.baseSalary) || 0,
        allowances: Number(newSalary.allowance) || 0,
        deductions: Number(newSalary.deduction) || 0,
        status: "paid",
        payment_mode: newSalary.paymentMode,
        paid_at: new Date().toISOString(),
      };

      const { data, error } = await (
        supabase.from("salary_records" as any) as any
      )
        .upsert(payload, { onConflict: "staff_id,month,year" })
        .select("*, staff:staff_id(id, name, role, department, photo_url)")
        .single();

      if (error) {
        alert("Error processing salary: " + error.message);
        return;
      }

      if (data) {
        // Prepend or replace in local state
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.id !== data.id);
          return [data as unknown as SalaryRecord, ...filtered];
        });
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert("An unexpected error occurred: " + (error?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  // Mark record as paid in Supabase
  const markAsPaid = async (id: string, mode: string) => {
    const paidAt = new Date().toISOString();

    // Optimistically update local state
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
      alert("Failed to update status: " + error.message);
      fetchData();
    }
  };

  // Distinct months present in records for filter dropdown
  const uniqueMonths = Array.from(
    new Set(records.map((r) => `${r.month}-${r.year}`))
  ).map((key) => {
    const [m, y] = key.split("-").map(Number);
    return {
      value: key,
      label: `${getMonthName(m)} ${y}`,
    };
  });

  const filteredRecords = records.filter((r) => {
    if (filterMonth === "all") return true;
    return `${r.month}-${r.year}` === filterMonth;
  });

  const totalPaid = records
    .filter((r) => r.status === "paid")
    .reduce((acc, curr) => acc + Number(curr.net_salary || 0), 0);

  const totalPending = records
    .filter((r) => r.status === "pending")
    .reduce((acc, curr) => acc + Number(curr.net_salary || 0), 0);

  return (
    <PermissionGuard permission="salaries">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/staff"
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff Directory
            </Link>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-500" />
            Monthly Staff Salaries & Payroll
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log monthly wage disbursements, overtime incentives, and advance deductions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Refresh dynamic records"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Process New Salary Payout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Disbursed (Paid Out)
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across recent months for Tanuku fabrication & installation teams
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Pending Payroll Approval
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pending payment confirmation
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Filter by Month:
            </span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400">
            {filteredRecords.length} record{filteredRecords.length === 1 ? "" : "s"}
          </span>
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading dynamic salary records from Supabase...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No salary records found for this period. Click &quot;Process New Salary Payout&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
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
                          <div className="font-bold text-slate-900 dark:text-white">
                            {rec.staff?.name || "Unknown Staff"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {rec.staff?.role || rec.staff?.department || "Staff Member"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                      {getMonthName(rec.month)} {rec.year}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      ₹{Number(rec.base_salary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                      +₹{Number(rec.allowances || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-red-500 font-medium whitespace-nowrap">
                      -₹{Number(rec.deductions || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      ₹{Number(rec.net_salary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {rec.status === "paid" ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> PAID
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {rec.payment_mode || "Paid"}
                            {rec.paid_at && ` (${formatPaidDate(rec.paid_at)})`}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {rec.status === "pending" ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => markAsPaid(rec.id, "UPI / PhonePe")}
                            className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Mark Paid (UPI)
                          </button>
                          <button
                            onClick={() => markAsPaid(rec.id, "Cash")}
                            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 text-[10px] cursor-pointer"
                          >
                            Cash
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Disbursed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Payout Modal with Dynamic Staff Data */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-500" />
                Process Staff Salary
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSalary} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Select Staff Member *
                </label>
                <select
                  value={newSalary.staff_id}
                  onChange={(e) => handleStaffSelect(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                >
                  {staffList.length === 0 ? (
                    <option value="">No active staff found in database</option>
                  ) : (
                    staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-400">
                  Selecting a staff member automatically loads their registered monthly base salary.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Salary Month
                  </label>
                  <select
                    value={newSalary.month}
                    onChange={(e) =>
                      setNewSalary({ ...newSalary, month: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Base Salary (₹) *
                  </label>
                  <input
                    type="number"
                    value={newSalary.baseSalary}
                    onChange={(e) =>
                      setNewSalary({ ...newSalary, baseSalary: Number(e.target.value) })
                    }
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Overtime / Allowance (₹)
                  </label>
                  <input
                    type="number"
                    value={newSalary.allowance}
                    onChange={(e) =>
                      setNewSalary({ ...newSalary, allowance: Number(e.target.value) })
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
                    value={newSalary.deduction}
                    onChange={(e) =>
                      setNewSalary({ ...newSalary, deduction: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <select
                  value={newSalary.paymentMode}
                  onChange={(e) =>
                    setNewSalary({ ...newSalary, paymentMode: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI / PhonePe">UPI / PhonePe / GPay</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {/* Calculated Net Payout Preview */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Net Payout:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{(
                    (Number(newSalary.baseSalary) || 0) +
                    (Number(newSalary.allowance) || 0) -
                    (Number(newSalary.deduction) || 0)
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
