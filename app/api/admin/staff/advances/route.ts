import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const staffId = searchParams.get("staff_id");
    const status = searchParams.get("status");

    const supabase = getAdminClient();

    let query = (supabase.from("staff_advances" as any) as any)
      .select(`
        id,
        staff_id,
        advance_date,
        day_name,
        advance_month,
        advance_year,
        amount,
        payment_mode,
        reason,
        receipt_url,
        status,
        settled_salary_id,
        created_at,
        updated_at,
        staff:staff_id (
          id,
          name,
          role,
          department,
          phone,
          photo_url
        )
      `)
      .order("advance_date", { ascending: false });

    if (month && month !== "all") {
      query = query.eq("advance_month", parseInt(month, 10));
    }
    if (year && year !== "all") {
      query = query.eq("advance_year", parseInt(year, 10));
    }
    if (staffId && staffId !== "all") {
      query = query.eq("staff_id", staffId);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch staff advances" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { staff_id, advance_date, amount, payment_mode, reason, receipt_url } = body;

    if (!staff_id || !advance_date || !amount || !reason) {
      return NextResponse.json(
        { error: "Staff, date, amount, and reason are required" },
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

    const dateObj = new Date(`${advance_date}T00:00:00`);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    const advanceMonth = dateObj.getMonth() + 1;
    const advanceYear = dateObj.getFullYear();

    const supabase = getAdminClient();

    const { data, error } = await (supabase.from("staff_advances" as any) as any)
      .insert({
        staff_id,
        advance_date,
        day_name: dayName,
        advance_month: advanceMonth,
        advance_year: advanceYear,
        amount: numAmount,
        payment_mode: payment_mode || "Cash",
        reason: reason.trim(),
        receipt_url: receipt_url || null,
        status: "pending",
      })
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          role,
          department,
          phone,
          photo_url
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to log staff advance" }, { status: 500 });
  }
}
