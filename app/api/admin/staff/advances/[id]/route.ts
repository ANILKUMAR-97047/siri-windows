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
    const { staff_id, advance_date, amount, payment_mode, reason, receipt_url, status } = body;

    const supabase = getAdminClient();
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (staff_id !== undefined) updateData.staff_id = staff_id;
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      updateData.amount = numAmount;
    }
    if (payment_mode !== undefined) updateData.payment_mode = payment_mode;
    if (reason !== undefined) updateData.reason = reason.trim();
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url;
    if (status !== undefined) updateData.status = status;

    if (advance_date) {
      const dateObj = new Date(`${advance_date}T00:00:00`);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
      updateData.advance_date = advance_date;
      updateData.day_name = DAYS_OF_WEEK[dateObj.getDay()];
      updateData.advance_month = dateObj.getMonth() + 1;
      updateData.advance_year = dateObj.getFullYear();
    }

    const { data, error } = await (supabase.from("staff_advances" as any) as any)
      .update(updateData)
      .eq("id", id)
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

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update advance" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getAdminClient();

    const { error } = await (supabase.from("staff_advances" as any) as any)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete advance" }, { status: 500 });
  }
}
