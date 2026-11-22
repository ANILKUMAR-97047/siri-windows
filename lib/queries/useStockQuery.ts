"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";

export interface Material {
  id: string;
  name: string;
  code: string | null;
  current_stock: number;
  reorder_level: number;
  unit: string;
  unit_cost: number;
  supplier_name: string | null;
}

export function useMaterialsQuery() {
  const supabase = createClient();

  return useQuery<Material[]>({
    queryKey: queryKeys.materials.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as unknown as Material[];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}
