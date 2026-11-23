import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("material_id");
    const type = searchParams.get("type"); // IN or OUT
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const supabase = getAdminClient();
    let query = (supabase.from("stock_transactions" as any) as any)
      .select("*, materials(id, name, code, unit, current_stock, unit_cost, material_categories(id, name))")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (materialId) {
      query = query.eq("material_id", materialId);
    }

    if (type && (type === "IN" || type === "OUT" || type === "ADJUSTMENT")) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactions: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load stock transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      material_id,
      type,
      quantity,
      unit_price,
      purpose,
      reference_id,
      notes,
    } = body;

    if (!material_id) {
      return NextResponse.json({ error: "Material is required" }, { status: 400 });
    }

    if (!type || (type !== "IN" && type !== "OUT")) {
      return NextResponse.json({ error: "Transaction type must be IN or OUT" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
    }

    // Purpose is mandatory for Outward
    if (type === "OUT" && (!purpose || !purpose.trim())) {
      return NextResponse.json(
        { error: "Purpose of removal is required (e.g. Project Fabrication, Site Glazing, Cutting Scrap)" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 1. Fetch current material
    const { data: material, error: fetchErr } = await (supabase
      .from("materials" as any) as any)
      .select("id, name, code, unit, current_stock, unit_cost")
      .eq("id", material_id)
      .single();

    if (fetchErr || !material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // 2. Validate sufficient stock on OUT
    const currentStock = Number(material.current_stock) || 0;
    if (type === "OUT" && currentStock < qty) {
      return NextResponse.json(
        {
          error: `Insufficient stock! Current stock is only ${currentStock} ${material.unit}. Cannot remove ${qty} ${material.unit}.`,
        },
        { status: 400 }
      );
    }

    const newStock = type === "IN" ? currentStock + qty : currentStock - qty;
    const finalUnitPrice = unit_price !== undefined && unit_price !== null
      ? Number(unit_price)
      : Number(material.unit_cost) || 0;

    // 3. Safe UUID reference_id check
    // The reference_id column in PostgreSQL is UUID type. If a free-text location/site is provided,
    // we prefix it into notes so it's safely stored and preserved without PostgreSQL type error 22P02.
    const isUuid = reference_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference_id.trim());
    const validUuidRef = isUuid ? reference_id.trim() : null;

    let combinedNotes = notes ? notes.trim() : "";
    if (reference_id && !isUuid) {
      const siteTag = `[Site/Project: ${reference_id.trim()}]`;
      combinedNotes = combinedNotes ? `${siteTag} ${combinedNotes}` : siteTag;
    }

    // 4. Atomically update material current_stock (and sync unit_cost on IN purchases)
    const updatePayload: Record<string, any> = {
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    };

    if (type === "IN" && finalUnitPrice > 0) {
      updatePayload.unit_cost = finalUnitPrice;
    }

    if (type === "IN" && !material.supplier_name && reference_id && !isUuid) {
      updatePayload.supplier_name = reference_id.trim();
    }

    const { error: updateErr } = await (supabase.from("materials" as any) as any)
      .update(updatePayload)
      .eq("id", material_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 5. Insert transaction record (DO NOT pass total_cost as it is GENERATED ALWAYS in postgres)
    const { data: transaction, error: txErr } = await (supabase
      .from("stock_transactions" as any) as any)
      .insert({
        material_id,
        type,
        quantity: qty,
        unit_price: finalUnitPrice,
        reference_type: purpose ? purpose.trim() : (type === "IN" ? "PURCHASE" : "USAGE"),
        reference_id: validUuidRef,
        notes: combinedNotes || null,
      })
      .select("*, materials(id, name, code, unit)")
      .single();

    if (txErr) {
      console.error("Error creating transaction record:", txErr.message);
      // Rollback material current_stock update to prevent desynchronization
      await (supabase.from("materials" as any) as any)
        .update({ current_stock: currentStock })
        .eq("id", material_id);

      return NextResponse.json(
        { error: `Database failed to record movement: ${txErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type === "IN" ? "Added" : "Deducted"} ${qty} ${material.unit} successfully!`,
      new_stock: newStock,
      transaction,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process stock transaction" },
      { status: 500 }
    );
  }
}
