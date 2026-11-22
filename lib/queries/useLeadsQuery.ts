"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  product_interest: string | null;
  estimated_budget: number | null;
  source: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "contacted" | "site_visit_scheduled" | "quote_sent" | "converted" | "lost";
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export function useLeadsQuery() {
  return useQuery<Lead[]>({
    queryKey: queryKeys.leads.list(),
    queryFn: async () => {
      const res = await fetch("/api/admin/leads");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to fetch leads");
      }
      return json.data || [];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}
