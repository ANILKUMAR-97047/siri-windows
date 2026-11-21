"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";

interface Material {
  id: string;
  name: string;
  code: string | null;
  current_stock: number;
  reorder_level: number;
  unit: string;
  unit_cost: number;
  supplier_name: string | null;
}

export default function StockPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewItemModal, setIsNewItemModal] = useState(false);
  const [transactionModal, setTransactionModal] = useState<{
    open: boolean;
    type: "IN" | "OUT";
    material?: Material;
  }>({ open: false, type: "IN" });

  const [transactionQty, setTransactionQty] = useState(10);

  const supabase = createClient();

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMaterials(data as unknown as Material[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // New Item State
  const [newItem, setNewItem] = useState({
    name: "",
    code: "",
    currentStock: 50,
    reorderLevel: 20,
    unit: "meters",
    unitCost: 150,
    supplier: "Local Distributor",
  });

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    const { data, error } = await (supabase.from("materials" as any) as any)
      .insert([
        {
          name: newItem.name.trim(),
          code: newItem.code ? newItem.code.trim() : `SKU-${Date.now().toString().slice(-4)}`,
          current_stock: Number(newItem.currentStock),
          reorder_level: Number(newItem.reorderLevel),
          unit: newItem.unit,
          unit_cost: Number(newItem.unitCost),
          supplier_name: newItem.supplier || null,
        },
      ])
      .select();

    if (!error && data) {
      setMaterials([data[0], ...materials]);
      toast.success("New material added to inventory successfully!");
      setIsNewItemModal(false);
      setNewItem({
        name: "",
        code: "",
        currentStock: 50,
        reorderLevel: 20,
        unit: "meters",
        unitCost: 150,
        supplier: "Local Distributor",
      });
    } else if (error) {
      toast.error("Error adding material: " + error.message, "Stock Error");
    }
  };

  const handleApplyTransaction = async () => {
    if (!transactionModal.material) return;
    const { material, type } = transactionModal;
    const qty = Number(transactionQty);
    if (!qty || qty <= 0) {
      toast.warning("Please enter a valid quantity greater than 0");
      return;
    }
    const newStock =
      type === "IN" ? material.current_stock + qty : Math.max(0, material.current_stock - qty);

    // Optimistic UI update
    setMaterials(
      materials.map((m) => (m.id === material.id ? { ...m, current_stock: newStock } : m))
    );

    // Update stock in Supabase
    await (supabase.from("materials" as any) as any)
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", material.id);

    // Log stock transaction
    await (supabase.from("stock_transactions" as any) as any).insert([
      {
        material_id: material.id,
        type: type,
        quantity: qty,
        unit_price: material.unit_cost,
        notes: `Quick ${type} adjustment from Admin Portal`,
      },
    ]);

    toast.success(`Inventory updated: ${type} ${qty} ${material.unit} recorded!`);
    setTransactionModal({ open: false, type: "IN" });
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.supplier_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const lowStockCount = materials.filter((m) => m.current_stock <= m.reorder_level).length;

  return (
    <PermissionGuard permission="stock">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Stock & Raw Materials Inventory (Live Supabase DB)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tanuku fabrication warehouse: profiles, reinforcements, hardware locks, gaskets & glass.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMaterials}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Stock from Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-amber-900 dark:text-amber-200">
                {lowStockCount} Items are below Reorder Level in Supabase!
              </div>
              <div className="text-[11px] text-amber-800/80 dark:text-amber-300/70">
                Replenish inventory to avoid slowing down ongoing window fabrication.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search material SKU or name..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Material & SKU</th>
                <th className="py-3 px-4 font-semibold">Current Stock</th>
                <th className="py-3 px-4 font-semibold">Reorder Threshold</th>
                <th className="py-3 px-4 font-semibold">Unit Cost</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Quick Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMaterials.map((mat) => {
                const isLow = mat.current_stock <= mat.reorder_level;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {mat.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {mat.code || "SKU-AUTO"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {mat.current_stock}
                      </span>{" "}
                      <span className="text-slate-400 text-[11px]">{mat.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {mat.reorder_level} {mat.unit}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      ₹{mat.unit_cost} / {mat.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {mat.supplier_name || "Factory Direct"}
                    </td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() =>
                          setTransactionModal({ open: true, type: "IN", material: mat })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white font-bold text-[11px] transition"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" /> + Inward
                      </button>
                      <button
                        onClick={() =>
                          setTransactionModal({ open: true, type: "OUT", material: mat })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 font-bold text-[11px] transition"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> - Outward
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transaction (Inward/Outward) Modal */}
      {transactionModal.open && transactionModal.material && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {transactionModal.type === "IN" ? "Record Stock Inward (Purchase)" : "Record Stock Outward (Project Usage)"}
              </h3>
              <button
                onClick={() => setTransactionModal({ open: false, type: "IN" })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {transactionModal.material.name}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Current Stock: {transactionModal.material.current_stock} {transactionModal.material.unit}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Quantity ({transactionModal.material.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={transactionQty}
                  onChange={(e) => setTransactionQty(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionModal({ open: false, type: "IN" })}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyTransaction}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save to Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {isNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Add Material to Inventory (Saves to Supabase)
              </h3>
              <button
                onClick={() => setIsNewItemModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Aluminium 27mm Outer Frame"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={newItem.code}
                    onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    placeholder="PRF-AL-27"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Unit of Measurement
                  </label>
                  <CustomSelect
                    value={newItem.unit}
                    onChange={(val) => setNewItem({ ...newItem, unit: val })}
                    size="sm"
                    dark={true}
                    options={[
                      { value: "meters", label: "Meters" },
                      { value: "sheets", label: "Sheets" },
                      { value: "pieces", label: "Pieces" },
                      { value: "pairs", label: "Pairs" },
                      { value: "boxes", label: "Boxes" },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Reorder Minimum Level
                  </label>
                  <input
                    type="number"
                    value={newItem.reorderLevel}
                    onChange={(e) => setNewItem({ ...newItem, reorderLevel: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Estimated Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Supplier / Brand
                  </label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewItemModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
                >
                  Save Material
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
