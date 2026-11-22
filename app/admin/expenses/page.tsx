"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wallet,
  Plus,
  Calendar,
  Building2,
  User,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  FileText,
  X,
  Upload,
  Receipt,
  Tag,
  CreditCard,
  Layers,
  Wrench,
  Coffee,
  Truck,
  Zap,
  ShoppingBag,
  HeartPulse,
  Home,
  Fuel,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast, confirmModal } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries";

interface AdminExpense {
  id: string;
  expense_date: string;
  day_name: string;
  expense_month: number;
  expense_year: number;
  expense_type: "company" | "personal";
  category: string;
  title: string;
  amount: number;
  payment_mode: string;
  description?: string | null;
  receipt_url?: string | null;
  created_at: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const COMPANY_CATEGORIES = [
  "Site Travel & Fuel",
  "Site Food & Refreshments",
  "Site Materials & Hardware",
  "Machinery & Workshop Maintenance",
  "Factory Utilities & Bills",
  "Freight & Loading Charges",
  "Workshop Tools & Consumables",
  "Premises Rent & Upkeep",
  "Miscellaneous Business",
];

const PERSONAL_CATEGORIES = [
  "Groceries & Household Food",
  "Home Electricity & Utility Bills",
  "Family & Children Education",
  "Medical & Healthcare",
  "Personal Vehicle Fuel & Service",
  "Personal Shopping & Lifestyle",
  "Cash Withdrawal / Hand Expense",
  "Miscellaneous Personal",
];

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

export default function AdminExpensesPage() {
  const queryClient = useQueryClient();
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Scope & Category filters
  const [activeTab, setActiveTab] = useState<"all" | "company" | "personal">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    expense_date: now.toISOString().split("T")[0],
    expense_type: "company" as "company" | "personal",
    category: COMPANY_CATEGORIES[0],
    title: "",
    amount: "",
    payment_mode: "UPI / PhonePe",
    description: "",
    receipt_url: "",
  });

  // Fetch Expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });
      if (activeTab !== "all") params.append("type", activeTab);
      if (filterCategory !== "all") params.append("category", filterCategory);

      const res = await fetch(`/api/admin/expenses?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data || []);
      } else {
        toast.error("Failed to load admin expenses");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, activeTab, filterCategory]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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

  // Filtered by Search Query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.day_name.toLowerCase().includes(q) ||
        e.payment_mode.toLowerCase().includes(q)
    );
  }, [expenses, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalAll = 0;
    let totalCompany = 0;
    let totalPersonal = 0;

    for (const item of expenses) {
      const amt = Number(item.amount) || 0;
      totalAll += amt;
      if (item.expense_type === "company") {
        totalCompany += amt;
      } else if (item.expense_type === "personal") {
        totalPersonal += amt;
      }
    }

    // Days in current selected month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dailyAvg = totalAll > 0 ? Math.round(totalAll / daysInMonth) : 0;

    return {
      totalAll,
      totalCompany,
      totalPersonal,
      dailyAvg,
    };
  }, [expenses, selectedMonth, selectedYear]);

  // Open Create Modal
  const openCreateModal = (defaultType?: "company" | "personal") => {
    const type = defaultType || (activeTab === "personal" ? "personal" : "company");
    setModalMode("create");
    setEditingId(null);
    setFormState({
      expense_date: new Date().toISOString().split("T")[0],
      expense_type: type,
      category: type === "company" ? COMPANY_CATEGORIES[0] : PERSONAL_CATEGORIES[0],
      title: "",
      amount: "",
      payment_mode: "UPI / PhonePe",
      description: "",
      receipt_url: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (expense: AdminExpense) => {
    setModalMode("edit");
    setEditingId(expense.id);
    setFormState({
      expense_date: expense.expense_date,
      expense_type: expense.expense_type,
      category: expense.category,
      title: expense.title,
      amount: expense.amount.toString(),
      payment_mode: expense.payment_mode || "UPI / PhonePe",
      description: expense.description || "",
      receipt_url: expense.receipt_url || "",
    });
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.warning("Please enter an expense title / description");
      return;
    }
    const amt = parseFloat(formState.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning("Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === "create") {
        const res = await fetch("/api/admin/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });
        const json = await res.json();
        if (res.ok) {
          toast.success("Daily expense logged successfully!");
          queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
          setIsModalOpen(false);
          fetchExpenses();
        } else {
          toast.error(json.error || "Failed to log expense");
        }
      } else {
        const res = await fetch(`/api/admin/expenses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });
        const json = await res.json();
        if (res.ok) {
          toast.success("Expense updated successfully!");
          queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
          setIsModalOpen(false);
          fetchExpenses();
        } else {
          toast.error(json.error || "Failed to update expense");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving expense record");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (expense: AdminExpense) => {
    const confirmed = await confirmModal({
      title: "Delete Expense Record?",
      message: `Are you sure you want to delete "${expense.title}" (₹${expense.amount.toLocaleString()}) logged on ${formatDateDisplay(expense.expense_date)}?`,
      type: "danger",
      confirmText: "Delete Record",
      cancelText: "Keep",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/expenses/${expense.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Expense record deleted successfully");
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
        fetchExpenses();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to delete expense");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting expense");
    }
  };

  // Receipt Upload
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingReceipt(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        setFormState((prev) => ({ ...prev, receipt_url: json.url }));
        toast.success("Bill / Receipt photo attached!");
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
    <PermissionGuard permission="overview">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Admin Daily Expenses & Maintenance
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maintain your daily spending & maintenance ledger with Date & Day. Company and Personal expenses kept strictly separate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openCreateModal("company")}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              + Company Expense
            </button>
            <button
              onClick={() => openCreateModal("personal")}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              + Personal Expense
            </button>
          </div>
        </div>

        {/* Scope Tabs & Month Archive Navigator */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Scope Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs font-semibold max-w-full overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => {
                  setActiveTab("all");
                  setFilterCategory("all");
                }}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Spends ({expenses.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("company");
                  setFilterCategory("all");
                }}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === "company"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-blue-600"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                🏢 Company / Workshop
              </button>
              <button
                onClick={() => {
                  setActiveTab("personal");
                  setFilterCategory("all");
                }}
                className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === "personal"
                    ? "bg-purple-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                👤 Personal Expenses
              </button>
            </div>

            {/* Month & Year Navigator */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
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

              {/* Direct Jump Dropdowns */}
              <div className="w-32">
                <CustomSelect
                  value={selectedMonth.toString()}
                  onChange={(val) => setSelectedMonth(parseInt(val, 10))}
                  options={MONTH_NAMES.map((name, idx) => ({
                    value: (idx + 1).toString(),
                    label: name,
                  }))}
                  placeholder="Month"
                />
              </div>

              <div className="w-24">
                <CustomSelect
                  value={selectedYear.toString()}
                  onChange={(val) => setSelectedYear(parseInt(val, 10))}
                  options={[2024, 2025, 2026, 2027].map((yr) => ({
                    value: yr.toString(),
                    label: yr.toString(),
                  }))}
                  placeholder="Year"
                />
              </div>
            </div>
          </div>

          {/* Secondary Row: Category Filter + Search */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            {/* Category Filter */}
            <div className="w-64">
              <CustomSelect
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { value: "all", label: "All Categories" },
                  ...(activeTab === "personal"
                    ? PERSONAL_CATEGORIES.map((c) => ({ value: c, label: c }))
                    : activeTab === "company"
                    ? COMPANY_CATEGORIES.map((c) => ({ value: c, label: c }))
                    : [
                        ...COMPANY_CATEGORIES.map((c) => ({ value: c, label: `🏢 ${c}` })),
                        ...PERSONAL_CATEGORIES.map((c) => ({ value: c, label: `👤 ${c}` })),
                      ]),
                ]}
                placeholder="Filter Category"
              />
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, shop/vendor, day name..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>

        {/* Monthly Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Spent */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Total Spent ({MONTH_NAMES[selectedMonth - 1]})</span>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              ₹ {summary.totalAll.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across {filteredExpenses.length} entries in this month
            </div>
          </div>

          {/* Company / Workshop Total */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs">
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 mb-1">
              <span>🏢 Company & Workshop Spends</span>
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              ₹ {summary.totalCompany.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">
              Factory bills, site travel/food, machinery & materials
            </div>
          </div>

          {/* Personal Total */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/30 bg-purple-50/20 dark:bg-purple-950/10 shadow-xs">
            <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 mb-1">
              <span>👤 Personal / Household Spends</span>
              <User className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ₹ {summary.totalPersonal.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-purple-600/80 dark:text-purple-400/80 mt-1">
              Groceries, home bills, family, medical & private
            </div>
          </div>

          {/* Daily Average */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Daily Average Spent</span>
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              ₹ {summary.dailyAvg.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-slate-400 ml-1">/ day</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Based on days in {MONTH_NAMES[selectedMonth - 1]}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              <span>
                Expense Ledger for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <span className="text-xs font-normal text-slate-400">
                ({filteredExpenses.length} records)
              </span>
            </h3>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Need past months data?</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Use the Month Navigator above
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="font-semibold text-slate-600 dark:text-slate-300">
                No expenses logged for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No entries found under {activeTab === "all" ? "this month" : `${activeTab} scope`}. Click below to add an expense entry.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => openCreateModal("company")}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  + Company Expense
                </button>
                <button
                  onClick={() => openCreateModal("personal")}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
                >
                  <User className="w-3.5 h-3.5" />
                  + Personal Expense
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Date & Day</th>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Vendor / Notes</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Date & Day */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatDateDisplay(exp.expense_date)}
                        </div>
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mt-0.5">
                          {exp.day_name}
                        </div>
                      </td>

                      {/* Scope Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {exp.expense_type === "company" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            Company
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                            <User className="w-3 h-3 text-purple-500" />
                            Personal
                          </span>
                        )}
                      </td>

                      {/* Title & Category */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {exp.title}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{exp.category}</span>
                        </div>
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {exp.payment_mode || "UPI"}
                        </span>
                      </td>

                      {/* Description / Vendor */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-600 dark:text-slate-300 line-clamp-2">
                          {exp.description || "—"}
                        </div>
                        {exp.receipt_url && (
                          <a
                            href={exp.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-0.5"
                          >
                            <FileText className="w-3 h-3" />
                            View Bill / Receipt
                          </a>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          ₹ {Number(exp.amount).toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Delete Record"
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

        {/* Log / Edit Expense Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      formState.expense_type === "company"
                        ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                        : "bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {modalMode === "create" ? "Log Daily Expense" : "Edit Expense Record"}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Record company maintenance or personal daily spend
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
                {/* Scope Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Expense Scope *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          expense_type: "company",
                          category: COMPANY_CATEGORIES[0],
                        }))
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        formState.expense_type === "company"
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-blue-500" />
                      🏢 Company / Workshop
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          expense_type: "personal",
                          category: PERSONAL_CATEGORIES[0],
                        }))
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        formState.expense_type === "personal"
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <User className="w-4 h-4 text-purple-500" />
                      👤 Personal / Household
                    </button>
                  </div>
                </div>

                {/* Date & Day Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Expense Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formState.expense_date}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, expense_date: e.target.value }))
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
                      <span>{getDayNameFromDate(formState.expense_date) || "Select a date"}</span>
                    </div>
                  </div>
                </div>

                {/* Category & Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <CustomSelect
                    value={formState.category}
                    onChange={(val) => setFormState((prev) => ({ ...prev, category: val }))}
                    options={(formState.expense_type === "company"
                      ? COMPANY_CATEGORIES
                      : PERSONAL_CATEGORIES
                    ).map((c) => ({ value: c, label: c }))}
                    placeholder="Choose category"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Title / Item Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formState.expense_type === "company"
                        ? "e.g. Tanuku site worker tiffin / Saw blade sharpening / Silicon 5 tubes"
                        : "e.g. D-Mart household groceries / Home electricity bill / Medical pharmacy"
                    }
                    value={formState.title}
                    onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Amount & Payment Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="e.g. 1500"
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
                        { value: "UPI / PhonePe", label: "UPI / PhonePe" },
                        { value: "Google Pay", label: "Google Pay" },
                        { value: "Cash", label: "Cash" },
                        { value: "Bank NetBanking", label: "Bank NetBanking" },
                        { value: "Credit / Debit Card", label: "Credit / Debit Card" },
                      ]}
                      placeholder="Select Mode"
                    />
                  </div>
                </div>

                {/* Vendor / Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Vendor / Shop / Extra Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paid at Sri Sai Hardware / Auto fare for 2 workers Tanuku site"
                    value={formState.description}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Optional Bill / Receipt Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bill / Voucher Photo (Optional)
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
                        Bill Attached
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
                    {modalMode === "create" ? "Save Expense" : "Update Record"}
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
