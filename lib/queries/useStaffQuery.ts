"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email?: string | null;
  photo_url?: string | null;
  base_salary: number;
  join_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryRecord {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: "paid" | "pending" | "on_leave";
  payment_mode: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  staff?: {
    id: string;
    name: string;
    role: string;
    department?: string;
    photo_url?: string | null;
    join_date?: string | null;
    status?: string;
  };
}

/**
 * Hook to fetch the full staff list with global caching
 */
export function useStaffListQuery() {
  const supabase = createClient();

  return useQuery<StaffMember[]>({
    queryKey: queryKeys.staff.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as unknown as StaffMember[];
    },
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
}

/**
 * Hook to fetch salary records with global caching
 */
export function useSalaryRecordsQuery(month?: number | string, year?: number | string) {
  const supabase = createClient();

  return useQuery<SalaryRecord[]>({
    queryKey: queryKeys.salaries.byMonthYear(month, year),
    queryFn: async () => {
      let query = supabase
        .from("salary_records")
        .select("*, staff:staff_id(id, name, role, department, photo_url, join_date, status)")
        .order("created_at", { ascending: false });

      if (month && month !== "all") {
        query = query.eq("month", Number(month));
      }
      if (year && year !== "all") {
        query = query.eq("year", Number(year));
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as unknown as SalaryRecord[];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}

/**
 * Hook to fetch all unsettled advances for a staff member across their running ledger
 */
export function useStaffPendingAdvancesQuery(staffId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.advances.byStaff(staffId),
    enabled: !!staffId,
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await (supabase.from("staff_advances" as any) as any)
        .select("id, staff_id, amount, reason, advance_date, day_name, advance_month, advance_year, payment_mode")
        .eq("staff_id", staffId)
        .eq("status", "pending")
        .order("advance_date", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}
