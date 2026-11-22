"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";

export interface StaffRef {
  id: string;
  name: string;
  phone?: string;
  role: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  contract_amount: number;
  amount_received: number;
  site_location?: string;
  project_type?: string;
  expected_completion?: string | null;
  supervisor_name?: string | null;
  supervisor_id?: string | null;
  staff?: StaffRef | null;
  created_at?: string;
}

export interface QuoteSummary {
  id: string;
  quote_number: string | null;
  total_amount: number;
  status: string;
  total_sqft?: number;
  rate_per_sqft?: number;
  materials_cost?: number;
  labor_cost?: number;
  notes?: string | null;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  projects?: ProjectSummary[];
  client_quotes?: QuoteSummary[];
}

export function useClientsQuery() {
  const supabase = createClient();

  return useQuery<Client[]>({
    queryKey: queryKeys.clients.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          projects (
            id,
            title,
            status,
            contract_amount,
            amount_received,
            site_location,
            project_type,
            expected_completion,
            supervisor_name,
            supervisor_id,
            staff:supervisor_id (
              id,
              name,
              phone,
              role
            ),
            created_at
          ),
          client_quotes (
            id,
            quote_number,
            total_amount,
            status,
            total_sqft,
            rate_per_sqft,
            materials_cost,
            labor_cost,
            notes,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as unknown as Client[];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}
