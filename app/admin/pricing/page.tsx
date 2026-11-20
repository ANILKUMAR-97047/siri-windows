"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  CheckCircle2,
  X,
  Layers,
  Shield,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface PricingPackage {
  id: string;
  name: string;
  material_type: string;
  profile_series: string | null;
  glass_type: string | null;
  price_per_sqft: number;
  features: string[] | null;
  warranty_years: number;
  is_active: boolean;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PricingPackage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pricing_packages")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setPackages(data as unknown as PricingPackage[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    materialType: "UPVC",
    profileSeries: "",
    glassType: "",
    pricePerSqft: 450,
    featuresStr: "Double Weatherstripping, Multi-Point Lock, Smooth Rollers",
    warrantyYears: 10,
  });

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setFormData({
      name: "",
      materialType: "UPVC",
      profileSeries: "",
      glassType: "",
      pricePerSqft: 450,
      featuresStr: "Double Weatherstripping, Multi-Point Lock, Smooth Rollers",
      warrantyYears: 10,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: PricingPackage) => {
    setEditingPkg(pkg);
    setFormData({
      name: pkg.name || "",
      materialType: pkg.material_type || "UPVC",
      profileSeries: pkg.profile_series || "",
      glassType: pkg.glass_type || "",
      pricePerSqft: Number(pkg.price_per_sqft) || 0,
      featuresStr: (pkg.features || []).join(", "),
      warrantyYears: Number(pkg.warranty_years) || 10,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a package title");
      return;
    }

    setSubmitting(true);
    const feats = formData.featuresStr
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingPkg) {
        // Update existing package in Supabase
        const { data, error } = await (
          supabase.from("pricing_packages" as any) as any
        )
          .update({
            name: formData.name.trim(),
            material_type: formData.materialType,
            profile_series: formData.profileSeries.trim() || "Standard Profile",
            glass_type: formData.glassType.trim() || "5mm Float Glass",
            price_per_sqft: Number(formData.pricePerSqft),
            features: feats,
            warranty_years: Number(formData.warrantyYears),
          })
          .eq("id", editingPkg.id)
          .select();

        if (error) {
          alert("Error updating package: " + error.message);
          return;
        }

        if (data && data[0]) {
          setPackages((prev) =>
            prev.map((p) =>
              p.id === editingPkg.id ? (data[0] as PricingPackage) : p
            )
          );
          setIsModalOpen(false);
          setEditingPkg(null);
        }
      } else {
        // Insert new package in Supabase
        const { data, error } = await (
          supabase.from("pricing_packages" as any) as any
        )
          .insert([
            {
              name: formData.name.trim(),
              material_type: formData.materialType,
              profile_series: formData.profileSeries.trim() || "Standard Profile",
              glass_type: formData.glassType.trim() || "5mm Float Glass",
              price_per_sqft: Number(formData.pricePerSqft),
              features: feats,
              warranty_years: Number(formData.warrantyYears),
              is_active: true,
              display_order: packages.length + 1,
            },
          ])
          .select();

        if (error) {
          alert("Error adding package: " + error.message);
          return;
        }

        if (data && data[0]) {
          setPackages((prev) => [...prev, data[0] as PricingPackage]);
          setIsModalOpen(false);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert("An unexpected error occurred: " + (error?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const targetId = deleteTarget.id;

    // Optimistic delete
    setPackages((prev) => prev.filter((p) => p.id !== targetId));

    try {
      const { error } = await (
        supabase.from("pricing_packages" as any) as any
      )
        .delete()
        .eq("id", targetId);

      if (error) {
        alert("Error deleting package: " + error.message);
        fetchPackages(); // Revert on failure
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error deleting package: " + (error?.message || "Unknown error"));
      fetchPackages();
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const next = !currentActive;
    setPackages(packages.map((p) => (p.id === id ? { ...p, is_active: next } : p)));
    await (supabase.from("pricing_packages" as any) as any)
      .update({ is_active: next })
      .eq("id", id);
  };

  return (
    <PermissionGuard permission="pricing">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            Pricing Packages & Rates per Sq.Ft (Live Supabase DB)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define standard price matrices for customer quotes, estimations, and website pricing cards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPackages}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh Packages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Pricing Package
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && packages.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-amber-500" />
          Loading pricing packages from database...
        </div>
      ) : packages.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
          <Tag className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No pricing packages found.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" /> Add First Package
          </button>
        </div>
      ) : (
        /* Packages Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition group relative ${
                pkg.is_active
                  ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60"
              }`}
            >
              <div>
                {/* Card Top Bar with Material pill and Status Badge */}
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      pkg.material_type === "UPVC"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                    }`}
                  >
                    {pkg.material_type}
                  </span>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      pkg.is_active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {pkg.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3 group-hover:text-amber-500 transition">
                  {pkg.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {pkg.profile_series}
                </p>

                {/* Price display */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Starting Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      ₹{Number(pkg.price_per_sqft).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ sq.ft</span>
                  </div>
                </div>

                {/* Glass & Warranty */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{pkg.glass_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{pkg.warranty_years} Years Frame Warranty</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {(pkg.features || []).map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => toggleActive(pkg.id, pkg.is_active)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {pkg.is_active ? "Pause Listing" : "Enable"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg)}
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: pkg.id, name: pkg.name })}
                    className="text-[11px] font-semibold text-red-500 hover:text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                {editingPkg ? (
                  <>
                    <Pencil className="w-4 h-4 text-amber-500" />
                    Edit Window/Door Pricing Package
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-amber-500" />
                    Add Window/Door Pricing Package
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPkg(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Package Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Premium Soundproof UPVC"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Material Type
                  </label>
                  <select
                    value={formData.materialType}
                    onChange={(e) =>
                      setFormData({ ...formData, materialType: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  >
                    <option value="UPVC">UPVC</option>
                    <option value="Aluminium">Aluminium</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Price per Sq.Ft (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.pricePerSqft}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerSqft: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Profile Series
                  </label>
                  <input
                    type="text"
                    value={formData.profileSeries}
                    onChange={(e) =>
                      setFormData({ ...formData, profileSeries: e.target.value })
                    }
                    placeholder="e.g. 70 Series Casement"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Glass Specification
                  </label>
                  <input
                    type="text"
                    value={formData.glassType}
                    onChange={(e) =>
                      setFormData({ ...formData, glassType: e.target.value })
                    }
                    placeholder="5mm Toughened Clear"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Warranty (Years)
                </label>
                <input
                  type="number"
                  value={formData.warrantyYears}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warrantyYears: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Key Features (comma separated)
                </label>
                <textarea
                  rows={3}
                  value={formData.featuresStr}
                  onChange={(e) =>
                    setFormData({ ...formData, featuresStr: e.target.value })
                  }
                  placeholder="Bug mesh, Multi-point locking, Sound barrier"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPkg(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingPkg ? "Save Changes to Supabase" : "Save Package to Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Custom Dialog Box */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Delete Pricing Package?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">&quot;{deleteTarget.name}&quot;</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PermissionGuard>
  );
}
