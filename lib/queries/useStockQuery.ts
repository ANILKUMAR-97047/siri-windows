"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface Material {
  id: string;
  category_id?: string | null;
  name: string;
  code: string | null;
  current_stock: number;
  reorder_level: number;
  unit: string;
  unit_cost: number;
  supplier_name: string | null;
  supplier_phone?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  material_categories?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export interface StockTransaction {
  id: string;
  material_id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  unit_price: number;
  total_cost: number;
  reference_type: string | null; // Purpose (e.g. Project Fabrication, Site Glazing, etc.)
  reference_id: string | null;   // Project / Site Name
  notes: string | null;
  created_at: string;
  materials?: {
    id: string;
    name: string;
    code: string | null;
    unit: string;
    current_stock?: number;
    unit_cost?: number;
    material_categories?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export function useMaterialsQuery() {
  return useQuery<Material[]>({
    queryKey: queryKeys.materials.list(),
    queryFn: async () => {
      const res = await fetch("/api/admin/stock");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load materials");
      }
      const data = await res.json();
      return (data.materials || []) as Material[];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}

export function useMaterialCategoriesQuery() {
  return useQuery<MaterialCategory[]>({
    queryKey: queryKeys.materialCategories.list(),
    queryFn: async () => {
      const res = await fetch("/api/admin/stock/categories");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load categories");
      }
      const data = await res.json();
      return (data.categories || []) as MaterialCategory[];
    },
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
}

export function useStockTransactionsQuery(filters?: { material_id?: string; type?: string }) {
  return useQuery<StockTransaction[]>({
    queryKey: queryKeys.stockTransactions.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.material_id) params.set("material_id", filters.material_id);
      if (filters?.type) params.set("type", filters.type);
      const res = await fetch(`/api/admin/stock/transactions?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load stock movements");
      }
      const data = await res.json();
      return (data.transactions || []) as StockTransaction[];
    },
    staleTime: 1000 * 30, // Fresh for 30s
  });
}
