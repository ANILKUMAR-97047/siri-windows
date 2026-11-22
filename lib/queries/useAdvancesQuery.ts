"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";

export interface StaffAdvance {
  id: string;
  staff_id: string;
  advance_date: string;
  day_name: string;
  advance_month: number;
  advance_year: number;
  amount: number;
  payment_mode?: string;
  reason: string;
  receipt_url?: string | null;
  status: "pending" | "settled";
  settled_salary_id?: string | null;
  created_at: string;
  staff?: {
    id: string;
    name: string;
    role: string;
    department?: string;
  };
}

export function useStaffAdvancesQuery(params?: {
  month?: number;
  year?: number;
  staffId?: string;
}) {
  const supabase = createClient();
  const month = params?.month;
  const year = params?.year;
  const staffId = params?.staffId;

  return useQuery<StaffAdvance[]>({
    queryKey: queryKeys.advances.byMonthYear(month, year, staffId),
    queryFn: async () => {
      let query = (supabase.from("staff_advances" as any) as any)
        .select("*, staff:staff_id(id, name, role, department)")
        .order("advance_date", { ascending: false });

      if (month) query = query.eq("advance_month", month);
      if (year) query = query.eq("advance_year", year);
      if (staffId && staffId !== "all") query = query.eq("staff_id", staffId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as unknown as StaffAdvance[];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}
