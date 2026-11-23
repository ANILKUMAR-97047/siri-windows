"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  X,
  RefreshCw,
  CheckCircle2,
  History,
  FolderPlus,
  Layers,
  Building2,
  Trash2,
  Calendar,
  Filter,
  RotateCcw,
  Info,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast, confirmModal } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMaterialsQuery,
  useMaterialCategoriesQuery,
  useStockTransactionsQuery,
  queryKeys,
  type Material,
} from "@/lib/queries";

export default function StockPage() {
  const queryClient = useQueryClient();

  // Prevent SSR date hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Queries
  const {
    data: materials = [],
    isLoading: materialsLoading,
    refetch: refetchMaterials,
  } = useMaterialsQuery();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useMaterialCategoriesQuery();

  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTransactions,
  } = useStockTransactionsQuery();

  // UI Navigation Tabs: 'inventory' | 'history'
  const [activeTab, setActiveTab] = useState<"inventory" | "history">("inventory");

  // Tab 1 (Inventory) Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"ALL" | "LOW" | "IN_STOCK">("ALL");

  // Tab 2 (Audit Trail) Filters
  const [txSearchQuery, setTxSearchQuery] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [txMonthFilter, setTxMonthFilter] = useState<string>("ALL");
  const [txYearFilter, setTxYearFilter] = useState<string>("ALL");
  const [txDateFilter, setTxDateFilter] = useState<string>("");

  // Modals
  const [isNewItemModal, setIsNewItemModal] = useState(false);
  const [isNewCategoryModal, setIsNewCategoryModal] = useState(false);
  const [customCatInput, setCustomCatInput] = useState("");
  const [customCatDesc, setCustomCatDesc] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Quick Action Modal (Inward or Outward)
  const [transactionModal, setTransactionModal] = useState<{
    open: boolean;
    type: "IN" | "OUT";
    material?: Material;
  }>({ open: false, type: "IN" });

  const [transactionForm, setTransactionForm] = useState({
    quantity: 10,
    unitPrice: 0,
    purposePreset: "Project Fabrication",
    customPurpose: "",
    siteOrProject: "",
    notes: "",
  });
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // New Material Form State (Simplified for new catalog registration)
  const [newItem, setNewItem] = useState({
    name: "",
    code: "",
    categoryId: "",
    isCustomCategory: false,
    customCategoryName: "",
    unit: "meters",
    reorderLevel: 20,
    notes: "",
  });
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Refresh all data
  const handleRefreshAll = async () => {
    await Promise.all([
      refetchMaterials(),
      refetchCategories(),
      refetchTransactions(),
    ]);
    toast.success("Stock inventory synced from database");
  };

  // Open transaction modal
  const openTransactionModal = (type: "IN" | "OUT", material: Material) => {
    setTransactionModal({ open: true, type, material });
    setTransactionForm({
      quantity: 1,
      unitPrice: material.unit_cost || 0,
      purposePreset: type === "IN" ? "Supplier Purchase" : "Project Fabrication",
      customPurpose: "",
      siteOrProject: "",
      notes: "",
    });
  };

  // Handle Quick Transaction Submit
  const handleApplyTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionModal.material) return;
    const { material, type } = transactionModal;
    const qty = Number(transactionForm.quantity);

    if (!qty || qty <= 0) {
      toast.warning("Please enter a valid quantity greater than 0");
      return;
    }

    if (type === "OUT" && qty > material.current_stock) {
      toast.error(
        `Cannot remove ${qty} ${material.unit}. Current available stock is only ${material.current_stock} ${material.unit}.`,
        "Insufficient Stock"
      );
      return;
    }

    const finalPurpose =
      type === "OUT"
        ? transactionForm.purposePreset === "Other / Custom Purpose"
          ? transactionForm.customPurpose.trim()
          : transactionForm.purposePreset
        : "Supplier Purchase";

    if (type === "OUT" && !finalPurpose) {
      toast.warning("Please specify the purpose of material removal");
      return;
    }

    setIsSubmittingTx(true);
    try {
      const res = await fetch("/api/admin/stock/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: material.id,
          type,
          quantity: qty,
          unit_price: Number(transactionForm.unitPrice) || material.unit_cost,
          purpose: finalPurpose,
          reference_id: transactionForm.siteOrProject.trim() || null,
          notes: transactionForm.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record transaction");
      }

      toast.success(
        `Recorded ${type === "IN" ? "Inward (+)" : "Outward (↗)"} of ${qty} ${material.unit} successfully!`
      );

      // Invalidate queries to refresh live data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stockTransactions.all }),
      ]);

      setTransactionModal({ open: false, type: "IN" });
    } catch (err: any) {
      toast.error(err.message || "Failed to process stock movement", "Transaction Error");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Handle Add New Material Item
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      toast.warning("Please provide a material name");
      return;
    }

    if (newItem.isCustomCategory && !newItem.customCategoryName.trim()) {
      toast.warning("Please provide the custom category name");
      return;
    }

    setIsSavingItem(true);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItem.name.trim(),
          code: newItem.code.trim() || undefined,
          category_id: !newItem.isCustomCategory && newItem.categoryId ? newItem.categoryId : undefined,
          customCategoryName: newItem.isCustomCategory ? newItem.customCategoryName.trim() : undefined,
          unit: newItem.unit,
          current_stock: 0,
          reorder_level: Number(newItem.reorderLevel) || 10,
          unit_cost: 0,
          notes: newItem.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add material");
      }

      toast.success(`"${newItem.name}" added to inventory successfully! Use "+ Inward" to record new stock arrivals.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.materialCategories.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stockTransactions.all }),
      ]);

      setIsNewItemModal(false);
      setNewItem({
        name: "",
        code: "",
        categoryId: "",
        isCustomCategory: false,
        customCategoryName: "",
        unit: "meters",
        reorderLevel: 20,
        notes: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save material", "Stock Error");
    } finally {
      setIsSavingItem(false);
    }
  };

  // Handle Add Custom Category Standalone
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCatInput.trim()) {
      toast.warning("Category name is required");
      return;
    }

    setIsSavingCategory(true);
    try {
      const res = await fetch("/api/admin/stock/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customCatInput.trim(),
          description: customCatDesc.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      toast.success(`Category "${customCatInput}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.materialCategories.all });
      setCustomCatInput("");
      setCustomCatDesc("");
      setIsNewCategoryModal(false);
    } catch (err: any) {
      toast.error(err.message || "Error creating category", "Category Error");
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Delete Material with Beautiful Confirmation Modal
  const handleDeleteMaterial = async (mat: Material) => {
    const confirmed = await confirmModal({
      title: "Delete Material from Inventory?",
      message: `Are you sure you want to delete "${mat.name}" (${mat.code || "No Code"})?\n\nThis will permanently remove this material and its associated stock audit records from the warehouse inventory.`,
      type: "danger",
      confirmText: "Delete Material",
      cancelText: "Keep Material",
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/stock?id=${mat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      toast.success(`Material "${mat.name}" deleted`);
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockTransactions.all });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete material");
    }
  };

  // Helper to extract Site Destination and clean notes
  const parseDestinationAndNotes = (rawNotes: string | null, referenceId: string | null) => {
    let destination = referenceId || "";
    let cleanNotes = rawNotes || "";

    if (rawNotes) {
      const match = rawNotes.match(/\[(?:Site\/Project|Destination|Ref):\s*([^\]]+)\]/i);
      if (match) {
        if (!destination) destination = match[1].trim();
        cleanNotes = rawNotes.replace(match[0], "").trim();
      }
    }

    return {
      destination: destination || "Central Workshop",
      notes: cleanNotes || "—",
    };
  };

  // Filtered materials for Tab 1
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.supplier_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.material_categories?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || m.category_id === selectedCategory;

      const isLow = m.reorder_level > 0 && m.current_stock <= m.reorder_level;
      const matchesStatus =
        stockStatusFilter === "ALL"
          ? true
          : stockStatusFilter === "LOW"
            ? isLow
            : !isLow;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, searchQuery, selectedCategory, stockStatusFilter]);

  // Extract distinct years from transactions for Year filter (including current & recent years)
  const transactionYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYear = new Date().getFullYear();
    for (let yr = currentYear; yr >= currentYear - 3; yr--) {
      yearsSet.add(yr.toString());
    }
    transactions.forEach((tx) => {
      if (tx.created_at) {
        const y = new Date(tx.created_at).getFullYear().toString();
        if (y && !isNaN(Number(y))) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [transactions]);

  // Filtered transactions for Tab 2 (Audit Trail with Search, Type, Date, Month, Year Combination)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      const isDateValid = !isNaN(txDate.getTime());
      const { destination, notes } = parseDestinationAndNotes(tx.notes, tx.reference_id);

      // Search Query filter (matches Material Name, SKU/Code, Purpose, Destination, Notes, and Date/Month/Year text)
      if (txSearchQuery.trim()) {
        const query = txSearchQuery.toLowerCase().trim();
        const matchesName = (tx.materials?.name || "").toLowerCase().includes(query);
        const matchesCode = (tx.materials?.code || "").toLowerCase().includes(query);
        const matchesPurpose = (tx.reference_type || "").toLowerCase().includes(query);
        const matchesDest = destination.toLowerCase().includes(query);
        const matchesNotes = notes.toLowerCase().includes(query);

        // Date & Month & Year matching (e.g. "Nov 2026", "November 2026", "Nov", "November", "2026", "23 Nov")
        let matchesDate = false;
        if (isDateValid) {
          const formattedDate = formatTxDate(tx.created_at).toLowerCase();
          const yearStr = txDate.getFullYear().toString();
          const monthFull = txDate.toLocaleString("en-IN", { month: "long" }).toLowerCase();
          const monthShort = txDate.toLocaleString("en-IN", { month: "short" }).toLowerCase();
          const monthYearFull = `${monthFull} ${yearStr}`;
          const monthYearShort = `${monthShort} ${yearStr}`;
          const yearMonthFull = `${yearStr} ${monthFull}`;
          const yearMonthShort = `${yearStr} ${monthShort}`;

          matchesDate =
            formattedDate.includes(query) ||
            monthYearFull.includes(query) ||
            monthYearShort.includes(query) ||
            yearMonthFull.includes(query) ||
            yearMonthShort.includes(query) ||
            monthFull.includes(query) ||
            monthShort.includes(query) ||
            yearStr.includes(query);
        }

        if (!matchesName && !matchesCode && !matchesPurpose && !matchesDest && !matchesNotes && !matchesDate) {
          return false;
        }
      }

      // Movement Type filter
      if (txTypeFilter !== "ALL" && tx.type !== txTypeFilter) {
        return false;
      }

      // Year filter (Combines with Month)
      if (txYearFilter !== "ALL") {
        if (!isDateValid || txDate.getFullYear().toString() !== txYearFilter) {
          return false;
        }
      }

      // Month filter (0-11, Combines with Year)
      if (txMonthFilter !== "ALL") {
        if (!isDateValid || txDate.getMonth().toString() !== txMonthFilter) {
          return false;
        }
      }

      // Exact Date filter (YYYY-MM-DD local or UTC)
      if (txDateFilter) {
        if (!isDateValid) return false;
        const localDateString = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}-${String(txDate.getDate()).padStart(2, "0")}`;
        const utcDateString = tx.created_at.slice(0, 10);
        if (localDateString !== txDateFilter && utcDateString !== txDateFilter) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, txSearchQuery, txTypeFilter, txYearFilter, txMonthFilter, txDateFilter]);

  // Check if any Audit Trail filter is currently active
  const isTxFiltered =
    Boolean(txSearchQuery.trim()) ||
    txTypeFilter !== "ALL" ||
    txYearFilter !== "ALL" ||
    txMonthFilter !== "ALL" ||
    Boolean(txDateFilter);

  const resetTxFilters = () => {
    setTxSearchQuery("");
    setTxTypeFilter("ALL");
    setTxMonthFilter("ALL");
    setTxYearFilter("ALL");
    setTxDateFilter("");
  };

  // Safe Date Formatting to eliminate hydration mismatch
  const formatTxDate = (isoString: string) => {
    if (!isMounted) return isoString.slice(0, 10);
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Calculate Metrics
  const lowStockCount = materials.filter(
    (m) => m.reorder_level > 0 && m.current_stock <= m.reorder_level
  ).length;
  const totalValuation = materials.reduce(
    (acc, m) => acc + (Number(m.current_stock) || 0) * (Number(m.unit_cost) || 0),
    0
  );

  return (
    <PermissionGuard permission="stock">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Stock & Raw Materials Inventory
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live inventory tracking for Tanuku fabrication warehouse: profiles, glass, hardware fittings, reinforcements & gaskets.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleRefreshAll}
              disabled={materialsLoading || txLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Refresh Stock from Database"
            >
              <RefreshCw
                className={`w-4 h-4 ${materialsLoading || txLoading ? "animate-spin text-amber-500" : ""
                  }`}
              />
            </button>

            <button
              onClick={() => setIsNewCategoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              + Custom Category
            </button>

            <button
              onClick={() => setIsNewItemModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Material Item
            </button>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  {lowStockCount} Material{lowStockCount > 1 ? "s are" : " is"} below Reorder Threshold!
                </div>
                <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  Replenish these items to avoid workshop bottlenecks during ongoing fabrication.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab("inventory");
                setStockStatusFilter("LOW");
              }}
              className="self-start sm:self-auto text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline px-2 py-1"
            >
              View Low Stock Items &rarr;
            </button>
          </div>
        )}

        {/* Navigation Tabs & KPI Counters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "inventory"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
            >
              <Layers className="w-4 h-4" />
              Current Inventory ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "history"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
            >
              <History className="w-4 h-4" />
              Movement Records & Audit ({transactions.length})
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Total Valuation:{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{totalValuation.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: CURRENT INVENTORY */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            {/* Dynamic Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${selectedCategory === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
              >
                All Categories ({materials.length})
              </button>
              {categories.map((cat) => {
                const count = materials.filter((m) => m.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${selectedCategory === cat.id
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search material SKU, name, or supplier..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                <button
                  onClick={() => setStockStatusFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${stockStatusFilter === "ALL"
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockStatusFilter("IN_STOCK")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${stockStatusFilter === "IN_STOCK"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setStockStatusFilter("LOW")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${stockStatusFilter === "LOW"
                      ? "bg-red-500/20 text-red-600 dark:text-red-400 font-bold"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  Low Stock
                </button>
              </div>
            </div>

            {/* Materials Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Material & Category</th>
                      <th className="py-3 px-4 font-semibold">SKU Code</th>
                      <th className="py-3 px-4 font-semibold">Current Live Stock</th>
                      <th className="py-3 px-4 font-semibold">Reorder Alert</th>
                      <th className="py-3 px-4 font-semibold">Est. Unit Cost</th>
                      <th className="py-3 px-4 font-semibold">Supplier / Brand</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Quick Stock Movement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No materials match your current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredMaterials.map((mat) => {
                        const isLow = mat.reorder_level > 0 && mat.current_stock <= mat.reorder_level;
                        const categoryName =
                          mat.material_categories?.name ||
                          categories.find((c) => c.id === mat.category_id)?.name ||
                          "Standard";

                        return (
                          <tr
                            key={mat.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {mat.name}
                              </div>
                              <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                {categoryName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                {mat.code || "SKU-AUTO"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-baseline gap-1">
                                <span
                                  className={`text-base font-extrabold ${mat.current_stock === 0
                                      ? "text-slate-400 dark:text-slate-500"
                                      : isLow
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-slate-900 dark:text-white"
                                    }`}
                                >
                                  {mat.current_stock}
                                </span>
                                <span className="text-slate-400 text-[11px] font-medium">
                                  {mat.unit}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                              {mat.reorder_level > 0 ? `${mat.reorder_level} ${mat.unit}` : "—"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {mat.unit_cost > 0 ? (
                                <>
                                  ₹{mat.unit_cost.toLocaleString("en-IN")}{" "}
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    / {mat.unit}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-400 text-[11px] font-normal italic">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                              <div>{mat.supplier_name || "—"}</div>
                              {mat.supplier_phone && (
                                <div className="text-[10px] text-slate-400">
                                  {mat.supplier_phone}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {mat.current_stock === 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  <Package className="w-3 h-3 text-slate-400" /> 0 Stock (Add Inward)
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                  <AlertTriangle className="w-3 h-3" /> LOW STOCK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" /> IN STOCK
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => openTransactionModal("IN", mat)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white font-bold text-[11px] transition shadow-2xs"
                                title="Add New Stock (Inward)"
                              >
                                <ArrowDownRight className="w-3.5 h-3.5" /> + Inward
                              </button>
                              <button
                                onClick={() => openTransactionModal("OUT", mat)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-[11px] transition shadow-2xs"
                                title="Record Material Usage (Outward with Purpose)"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" /> ↗ Outward
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(mat)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Delete Material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MOVEMENT RECORDS & AUDIT TRAIL */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 shadow-xs">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    Complete Stock Inward & Outward Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live chronological ledger tracking every addition and removal with purpose and site destinations.
                  </p>
                </div>
                {isTxFiltered && (
                  <button
                    onClick={resetTxFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Comprehensive Filter Bar (Search + Movement Type + Year + Month + Date) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* 1. Search Query */}
                <div className="relative sm:col-span-2 lg:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    placeholder="Search material, SKU, purpose, destination, month, year..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  {txSearchQuery && (
                    <button
                      onClick={() => setTxSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Movement Type */}
                <div>
                  <CustomSelect
                    value={txTypeFilter}
                    onChange={(val) => setTxTypeFilter(val as any)}
                    size="sm"
                    dark={true}
                    options={[
                      { value: "ALL", label: "All Movements" },
                      { value: "IN", label: "+ Inward Only" },
                      { value: "OUT", label: "↗ Outward Only" },
                    ]}
                  />
                </div>

                {/* 3. Year Filter (Combines with Month) */}
                <div>
                  <CustomSelect
                    value={txYearFilter}
                    onChange={(val) => {
                      setTxYearFilter(val);
                      if (txDateFilter) setTxDateFilter("");
                    }}
                    size="sm"
                    dark={true}
                    options={[
                      { value: "ALL", label: "All Years" },
                      ...transactionYears.map((y) => ({ value: y, label: y })),
                    ]}
                  />
                </div>

                {/* 4. Month Filter (Combines with Year) */}
                <div>
                  <CustomSelect
                    value={txMonthFilter}
                    onChange={(val) => {
                      setTxMonthFilter(val);
                      if (txDateFilter) setTxDateFilter("");
                    }}
                    size="sm"
                    dark={true}
                    options={[
                      { value: "ALL", label: "All Months" },
                      { value: "0", label: "January" },
                      { value: "1", label: "February" },
                      { value: "2", label: "March" },
                      { value: "3", label: "April" },
                      { value: "4", label: "May" },
                      { value: "5", label: "June" },
                      { value: "6", label: "July" },
                      { value: "7", label: "August" },
                      { value: "8", label: "September" },
                      { value: "9", label: "October" },
                      { value: "10", label: "November" },
                      { value: "11", label: "December" },
                    ]}
                  />
                </div>

                {/* 5. Exact Date Picker */}
                <div className="relative">
                  <input
                    type="date"
                    value={txDateFilter}
                    onChange={(e) => setTxDateFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    title="Filter by exact date"
                  />
                  {txDateFilter && (
                    <button
                      onClick={() => setTxDateFilter("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-700 rounded-full p-0.5"
                      title="Clear exact date"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter summary status */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Showing{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {filteredTransactions.length}
                  </strong>{" "}
                  of {transactions.length} total movement records
                </span>
                {isTxFiltered && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Active Filters Applied
                  </span>
                )}
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3 font-semibold">Date & Time</th>
                      <th className="py-3 px-3 font-semibold">Material & SKU</th>
                      <th className="py-3 px-3 font-semibold">Movement Type</th>
                      <th className="py-3 px-3 font-semibold">Quantity</th>
                      <th className="py-3 px-3 font-semibold">Valuation</th>
                      <th className="py-3 px-3 font-semibold">Purpose of Removal / Reason</th>
                      <th className="py-3 px-3 font-semibold">Site / Project Destination</th>
                      <th className="py-3 px-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <div>No stock transactions match your search and filter criteria.</div>
                          {isTxFiltered && (
                            <button
                              onClick={resetTxFilters}
                              className="mt-2 text-xs font-bold text-amber-500 hover:underline"
                            >
                              Reset all filters
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isInward = tx.type === "IN";
                        const { destination, notes } = parseDestinationAndNotes(
                          tx.notes,
                          tx.reference_id
                        );

                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {formatTxDate(tx.created_at)}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {tx.materials?.name || "Material Item"}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {tx.materials?.code || "SKU-AUTO"}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {isInward ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                  <ArrowDownRight className="w-3 h-3" /> + INWARD
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300">
                                  <ArrowUpRight className="w-3 h-3" /> ↗ OUTWARD
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {isInward ? `+${tx.quantity}` : `-${tx.quantity}`}{" "}
                              <span className="text-slate-400 text-[11px] font-normal">
                                {tx.materials?.unit || "units"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                              ₹{(tx.total_cost || tx.quantity * tx.unit_price).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                                {tx.reference_type || (isInward ? "Supplier Purchase" : "Usage")}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{destination}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                              {notes}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* QUICK STOCK MOVEMENT MODAL (INWARD / OUTWARD) */}
        {transactionModal.open && transactionModal.material && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 my-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {transactionModal.type === "IN" ? (
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <ArrowDownRight className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                      <ArrowUpRight className="w-5 h-5" />
                    </span>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {transactionModal.type === "IN"
                        ? "Record Inward Stock (Purchase / Arrival)"
                        : "Record Outward Stock (Material Removal)"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Updates live inventory balance and logs audit trail.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransactionModal({ open: false, type: "IN" })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Material preview card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {transactionModal.material.name}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>SKU: {transactionModal.material.code || "SKU-AUTO"}</span>
                  <span>
                    Current Stock:{" "}
                    <strong className="text-slate-900 dark:text-white">
                      {transactionModal.material.current_stock} {transactionModal.material.unit}
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleApplyTransaction} className="space-y-3.5 text-xs">
                {/* Quantity */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Quantity to {transactionModal.type === "IN" ? "Add" : "Remove"} ({transactionModal.material.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={transactionModal.type === "OUT" ? transactionModal.material.current_stock : undefined}
                    required
                    value={transactionForm.quantity}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, quantity: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500/20"
                  />
                  {transactionModal.type === "OUT" && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Max available: {transactionModal.material.current_stock} {transactionModal.material.unit}</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Remaining balance: {Math.max(0, transactionModal.material.current_stock - transactionForm.quantity)} {transactionModal.material.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* For Outward: MANDATORY PURPOSE */}
                {transactionModal.type === "OUT" ? (
                  <>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        Purpose of Removal *
                        <span className="text-[10px] text-amber-500 font-normal">(Why is this material being used?)</span>
                      </label>
                      <CustomSelect
                        value={transactionForm.purposePreset}
                        onChange={(val) =>
                          setTransactionForm({ ...transactionForm, purposePreset: val })
                        }
                        size="sm"
                        dark={true}
                        options={[
                          { value: "Project Fabrication", label: "Project Fabrication (Workshop window/door assembly)" },
                          { value: "Site Glazing / Installation", label: "Site Glazing / Onsite Installation" },
                          { value: "Cutting Scrap / Wastage", label: "Cutting Scrap / Offcut Wastage" },
                          { value: "Damaged / Defective Material", label: "Damaged / Defective Material" },
                          { value: "Showroom / Sample Demo", label: "Showroom Sample / Client Mockup" },
                          { value: "Other / Custom Purpose", label: "Other / Specify Custom Reason..." },
                        ]}
                      />
                    </div>

                    {transactionForm.purposePreset === "Other / Custom Purpose" && (
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">
                          Custom Purpose Description *
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionForm.customPurpose}
                          onChange={(e) =>
                            setTransactionForm({ ...transactionForm, customPurpose: e.target.value })
                          }
                          placeholder="e.g. Prototype testing for 3-track sliding system"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        Project / Site Location Destination
                        <span className="text-[10px] text-slate-400 font-normal">(Where is it used?)</span>
                      </label>
                      <input
                        type="text"
                        value={transactionForm.siteOrProject}
                        onChange={(e) =>
                          setTransactionForm({ ...transactionForm, siteOrProject: e.target.value })
                        }
                        placeholder="e.g. Tanuku Residency Villa #4 / G+2 Commercial Site"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  /* For Inward: Rate and Supplier Invoice */
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">
                          Unit Purchase Rate (₹)
                        </label>
                        <input
                          type="number"
                          value={transactionForm.unitPrice}
                          onChange={(e) =>
                            setTransactionForm({ ...transactionForm, unitPrice: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">
                          Total Invoice Value
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                          ₹{(transactionForm.quantity * transactionForm.unitPrice).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Supplier Bill / PO Reference
                      </label>
                      <input
                        type="text"
                        value={transactionForm.siteOrProject}
                        onChange={(e) =>
                          setTransactionForm({ ...transactionForm, siteOrProject: e.target.value })
                        }
                        placeholder="e.g. PO-8921 / NCL Invoice #4412"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {/* Additional Notes */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={transactionForm.notes}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, notes: e.target.value })
                    }
                    placeholder="e.g. Inspected profile thickness; approved by workshop lead"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTransactionModal({ open: false, type: "IN" })}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className={`px-5 py-2 rounded-xl font-bold transition shadow-sm ${transactionModal.type === "IN"
                        ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      }`}
                  >
                    {isSubmittingTx ? "Saving to Database..." : `Confirm ${transactionModal.type === "IN" ? "Inward (+)" : "Outward (↗)"}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD NEW MATERIAL MODAL */}
        {isNewItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 my-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Plus className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Add Material to Catalog
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Registers material item into warehouse catalog.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewItemModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewItem} className="space-y-3.5 text-xs">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Material Category *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setNewItem({
                          ...newItem,
                          isCustomCategory: !newItem.isCustomCategory,
                        })
                      }
                      className="text-[11px] text-amber-500 hover:underline font-semibold"
                    >
                      {newItem.isCustomCategory ? "Select Existing Category" : "+ Create Custom Category"}
                    </button>
                  </div>

                  {newItem.isCustomCategory ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={newItem.customCategoryName}
                        onChange={(e) =>
                          setNewItem({ ...newItem, customCategoryName: e.target.value })
                        }
                        placeholder="e.g. Soundproof Double Glazing / Acoustic Seals"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-amber-500/50 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="text-[10px] text-slate-400">
                        This custom category will be created and saved automatically.
                      </span>
                    </div>
                  ) : (
                    <CustomSelect
                      value={newItem.categoryId || (categories[0]?.id ?? "")}
                      onChange={(val) => setNewItem({ ...newItem, categoryId: val })}
                      size="sm"
                      dark={true}
                      options={categories.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                    />
                  )}
                </div>

                {/* Material Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g. Aluminium 27mm Outer Frame (Anthracite Grey)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                {/* SKU Code & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      SKU Code (Auto-generated if empty)
                    </label>
                    <input
                      type="text"
                      value={newItem.code}
                      onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                      placeholder="e.g. PRF-AL-27"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Unit of Measurement *
                    </label>
                    <CustomSelect
                      value={newItem.unit}
                      onChange={(val) => setNewItem({ ...newItem, unit: val })}
                      size="sm"
                      dark={true}
                      options={[
                        { value: "meters", label: "Meters (Profiles / Gaskets)" },
                        { value: "sheets", label: "Sheets (Glass Panes)" },
                        { value: "pieces", label: "Pieces (Locks / Handles)" },
                        { value: "pairs", label: "Pairs (Friction Stays / Rollers)" },
                        { value: "boxes", label: "Boxes (Screws / Fasteners)" },
                        { value: "bundles", label: "Bundles (Steel Reinforcements)" },
                        { value: "kg", label: "Kilograms (Bulk Material)" },
                        { value: "liters", label: "Liters (Silicon Sealant)" },
                      ]}
                    />
                  </div>
                </div>

                {/* Reorder Threshold & Warehouse Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Reorder Alert Threshold *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newItem.reorderLevel}
                      onChange={(e) =>
                        setNewItem({ ...newItem, reorderLevel: Number(e.target.value) })
                      }
                      placeholder="e.g. 10"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Storage Location / Rack (Optional)
                    </label>
                    <input
                      type="text"
                      value={newItem.notes}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                      placeholder="e.g. Bay-2 Rack A"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Helpful Stock Inward Notice */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-300 text-[11px] flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    This material will be registered with <strong>0 stock</strong>. You can record incoming stock arrivals, supplier bills, and purchase rates whenever goods arrive using <strong>+ Inward</strong>.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewItemModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingItem}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
                  >
                    {isSavingItem ? "Saving Material..." : "Save Material to Inventory"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE CUSTOM CATEGORY MODAL */}
        {isNewCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 my-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <FolderPlus className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Create Custom Category
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Organize your raw materials & hardware components.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewCategoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCatInput}
                    onChange={(e) => setCustomCatInput(e.target.value)}
                    placeholder="e.g. Thermal Break Aluminium / Soundproof Glass"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customCatDesc}
                    onChange={(e) => setCustomCatDesc(e.target.value)}
                    placeholder="Brief description of materials in this category"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewCategoryModal(false)}
                    className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCategory}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
                  >
                    {isSavingCategory ? "Creating..." : "Create Category"}
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
