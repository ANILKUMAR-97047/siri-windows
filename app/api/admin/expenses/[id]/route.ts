import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const supabase = getAdminClient();
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (expense_type !== undefined) {
      if (expense_type !== "company" && expense_type !== "personal") {
        return NextResponse.json({ error: "Invalid expense type" }, { status: 400 });
      }
      updateData.expense_type = expense_type;
    }
    if (category !== undefined) updateData.category = category.trim();
    if (title !== undefined) updateData.title = title.trim();
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      updateData.amount = numAmount;
    }
    if (payment_mode !== undefined) updateData.payment_mode = payment_mode;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url;

    if (expense_date) {
      const dateObj = new Date(`${expense_date}T00:00:00`);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
      updateData.expense_date = expense_date;
      updateData.day_name = DAYS_OF_WEEK[dateObj.getDay()];
      updateData.expense_month = dateObj.getMonth() + 1;
      updateData.expense_year = dateObj.getFullYear();
    }

    const { data, error } = await (supabase.from("admin_expenses" as any) as any)
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getAdminClient();

    const { error } = await (supabase.from("admin_expenses" as any) as any)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
