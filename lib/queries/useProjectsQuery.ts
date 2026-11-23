"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";

export interface ProjectRecord {
  id: string;
  title: string;
  client_id: string;
  lead_id?: string | null;
  site_location: string;
  project_type: string;
  status: "planning" | "fabrication" | "installation" | "completed" | "on_hold";
  start_date: string | null;
  expected_completion: string | null;
  actual_completion?: string | null;
  contract_amount: number;
  amount_received: number;
  supervisor_name: string | null;
  supervisor_id?: string | null;
  notes: string | null;
  created_at: string;
  clients?: {
    id: string;
    name: string;
    company_name: string | null;
    phone: string;
    city: string;
    address: string | null;
  };
  staff?: {
    id: string;
    name: string;
    phone: string;
    role: string;
  } | null;
}

export interface ProjectPayment {
  id: string;
  project_id: string;
  client_id?: string | null;
  amount: number;
  payment_date: string;
  payment_mode: "UPI / PhonePe" | "Cash" | "Bank Transfer" | "Cheque" | string;
  stage: string | null;
  reference_id: string | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
}

export function useProjectsQuery() {
  const supabase = createClient();

  return useQuery<ProjectRecord[]>({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients (
            id,
            name,
            company_name,
            phone,
            city,
            address
          ),
          staff:supervisor_id (
            id,
            name,
            phone,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as unknown as ProjectRecord[];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}

export function useProjectPaymentsQuery(projectId?: string) {
  return useQuery<ProjectPayment[]>({
    queryKey: queryKeys.projectPayments.byProject(projectId),
    queryFn: async () => {
      const url = projectId
        ? `/api/admin/projects/payments?project_id=${projectId}`
        : `/api/admin/projects/payments`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load project payments");
      }
      const data = await res.json();
      return (data.payments || []) as ProjectPayment[];
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 30, // Fresh for 30s
  });
}
