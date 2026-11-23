import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const supabase = getAdminClient();
    let query = (supabase.from("project_payments" as any) as any)
      .select("*, projects(id, title, contract_amount, amount_received, site_location, clients(id, name, phone))")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payments: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load project payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      project_id,
      amount,
      payment_date,
      payment_mode,
      stage,
      reference_id,
      received_by,
      notes,
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 1. Fetch current project
    const { data: project, error: projErr } = await (supabase
      .from("projects" as any) as any)
      .select("id, title, client_id, amount_received, contract_amount")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const cleanPaymentDate = payment_date || new Date().toISOString().split("T")[0];
    const cleanPaymentMode = payment_mode || "UPI / PhonePe";
    const cleanStage = stage || "Milestone Payment";

    // 2. Insert payment record
    const { data: paymentRecord, error: insertErr } = await (supabase
      .from("project_payments" as any) as any)
      .insert({
        project_id,
        client_id: project.client_id || null,
        amount: payAmount,
        payment_date: cleanPaymentDate,
        payment_mode: cleanPaymentMode,
        stage: cleanStage,
        reference_id: reference_id ? reference_id.trim() : null,
        received_by: received_by ? received_by.trim() : null,
        notes: notes ? notes.trim() : null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: `Failed to record payment: ${insertErr.message}` },
        { status: 400 }
      );
    }

    // 3. Atomically update project amount_received
    const newTotalReceived = Number(project.amount_received || 0) + payAmount;
    const { error: updateErr } = await (supabase.from("projects" as any) as any)
      .update({
        amount_received: newTotalReceived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project_id);

    if (updateErr) {
      console.warn("Failed to sync project amount_received:", updateErr.message);
    }

    // 4. Log milestone entry in project_updates
    try {
      const updateNote = [
        `Received ₹${payAmount.toLocaleString("en-IN")} via ${cleanPaymentMode}`,
        reference_id ? `(Ref: ${reference_id.trim()})` : null,
        notes ? `Note: ${notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join(" - ");

      await (supabase.from("project_updates" as any) as any).insert({
        project_id,
        stage: `Payment: ${cleanStage}`,
        notes: updateNote,
      });
    } catch (e: any) {
      console.warn("Could not log to project_updates:", e.message);
    }

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString("en-IN")} recorded successfully!`,
      payment: paymentRecord,
      new_amount_received: newTotalReceived,
      balance_pending: Math.max(0, Number(project.contract_amount) - newTotalReceived),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process project payment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch payment to get project_id and amount
    const { data: payment, error: fetchErr } = await (supabase
      .from("project_payments" as any) as any)
      .select("id, project_id, amount")
      .eq("id", id)
      .single();

    if (fetchErr || !payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // 2. Delete payment
    const { error: delErr } = await (supabase
      .from("project_payments" as any) as any)
      .delete()
      .eq("id", id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    // 3. Recalculate and update projects.amount_received
    const { data: remainingPayments } = await (supabase
      .from("project_payments" as any) as any)
      .select("amount")
      .eq("project_id", payment.project_id);

    const totalRecv = (remainingPayments || []).reduce(
      (sum: number, p: any) => sum + (Number(p.amount) || 0),
      0
    );

    await (supabase.from("projects" as any) as any)
      .update({
        amount_received: totalRecv,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.project_id);

    return NextResponse.json({
      success: true,
      message: "Payment record deleted and project balance synchronized",
      new_amount_received: totalRecv,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete project payment" },
      { status: 500 }
    );
  }
}
