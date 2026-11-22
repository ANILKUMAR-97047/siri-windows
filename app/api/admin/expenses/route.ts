import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const expenseType = searchParams.get("type"); // 'all' | 'company' | 'personal'
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const supabase = getAdminClient();

    let query = (supabase.from("admin_expenses" as any) as any)
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (month && month !== "all") {
      query = query.eq("expense_month", parseInt(month, 10));
    }
    if (year && year !== "all") {
      query = query.eq("expense_year", parseInt(year, 10));
    }
    if (expenseType && expenseType !== "all") {
      query = query.eq("expense_type", expenseType);
    }
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (search && search.trim() !== "") {
      const term = search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute month summary statistics
    const records = data || [];
    let totalAll = 0;
    let totalCompany = 0;
    let totalPersonal = 0;

    for (const item of records) {
      const amt = Number(item.amount) || 0;
      totalAll += amt;
      if (item.expense_type === "company") {
        totalCompany += amt;
      } else if (item.expense_type === "personal") {
        totalPersonal += amt;
      }
    }

    return NextResponse.json({
      data: records,
      summary: {
        totalAll,
        totalCompany,
        totalPersonal,
        count: records.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch admin expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      expense_date,
      expense_type,
      category,
      title,
      amount,
      payment_mode,
      description,
      receipt_url,
    } = body;

    if (!expense_date || !expense_type || !category || !title || !amount) {
      return NextResponse.json(
        { error: "Date, expense type (company/personal), category, title, and amount are required" },
        { status: 400 }
      );
    }

    if (expense_type !== "company" && expense_type !== "personal") {
      return NextResponse.json(
        { error: "expense_type must be either 'company' or 'personal'" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const dateObj = new Date(`${expense_date}T00:00:00`);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    const expenseMonth = dateObj.getMonth() + 1;
    const expenseYear = dateObj.getFullYear();

    const supabase = getAdminClient();

    const { data, error } = await (supabase.from("admin_expenses" as any) as any)
      .insert({
        expense_date,
        day_name: dayName,
        expense_month: expenseMonth,
        expense_year: expenseYear,
        expense_type,
        category: category.trim(),
        title: title.trim(),
        amount: numAmount,
        payment_mode: payment_mode || "UPI / PhonePe",
        description: description ? description.trim() : null,
        receipt_url: receipt_url || null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log admin expense" },
      { status: 500 }
    );
  }
}
