"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";

export interface AdminExpense {
  id: string;
  expense_date: string;
  day_name: string;
  expense_month: number;
  expense_year: number;
  expense_type: "company" | "personal";
  category: string;
  title: string;
  amount: number;
  payment_mode?: string;
  description?: string | null;
  receipt_url?: string | null;
  created_at: string;
}

export function useAdminExpensesQuery(params?: {
  month?: number;
  year?: number;
  type?: string;
}) {
  const supabase = createClient();
  const month = params?.month;
  const year = params?.year;
  const type = params?.type;

  return useQuery<AdminExpense[]>({
    queryKey: queryKeys.expenses.byMonthYear(month, year, type),
    queryFn: async () => {
      let query = (supabase.from("admin_expenses" as any) as any)
        .select("*")
        .order("expense_date", { ascending: false });

      if (month) query = query.eq("expense_month", month);
      if (year) query = query.eq("expense_year", year);
      if (type && type !== "all") query = query.eq("expense_type", type);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as unknown as AdminExpense[];
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}
