import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getAdminClient();

    // Fetch materials with joined category
    const { data: materials, error: matError } = await (supabase
      .from("materials" as any) as any)
      .select("*, material_categories(id, name, description)")
      .order("name", { ascending: true });

    if (matError) {
      return NextResponse.json({ error: matError.message }, { status: 400 });
    }

    // Fetch all categories for filter options
    const { data: categories, error: catError } = await (supabase
      .from("material_categories" as any) as any)
      .select("*")
      .order("name", { ascending: true });

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      materials: materials || [],
      categories: categories || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load inventory materials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      category_id,
      customCategoryName,
      unit,
      current_stock,
      reorder_level,
      unit_cost,
      supplier_name,
      supplier_phone,
      notes,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Material name is required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    let finalCategoryId = category_id;

    // Handle custom category creation if entered
    if (customCategoryName && typeof customCategoryName === "string" && customCategoryName.trim()) {
      const cleanCatName = customCategoryName.trim();
      const { data: existingCat } = await (supabase
        .from("material_categories" as any) as any)
        .select("id")
        .ilike("name", cleanCatName)
        .maybeSingle();

      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const { data: newCat, error: catCreateError } = await (supabase
          .from("material_categories" as any) as any)
          .insert({ name: cleanCatName })
          .select()
          .single();

        if (!catCreateError && newCat) {
          finalCategoryId = newCat.id;
        }
      }
    }

    // Generate SKU if empty
    const cleanCode = code && code.trim()
      ? code.trim().toUpperCase()
      : `MAT-${Date.now().toString().slice(-6)}`;

    const initialStock = Number(current_stock) || 0;
    const reorderThreshold = Number(reorder_level) || 10;
    const unitPrice = Number(unit_cost) || 0;

    const { data: newMaterial, error: insertError } = await (supabase
      .from("materials" as any) as any)
      .insert({
        name: name.trim(),
        code: cleanCode,
        category_id: finalCategoryId || null,
        unit: unit || "meters",
        current_stock: initialStock,
        reorder_level: reorderThreshold,
        unit_cost: unitPrice,
        supplier_name: supplier_name ? supplier_name.trim() : null,
        supplier_phone: supplier_phone ? supplier_phone.trim() : null,
        notes: notes ? notes.trim() : null,
      })
      .select("*, material_categories(id, name, description)")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Record initial transaction log if initial stock > 0
    if (initialStock > 0 && newMaterial) {
      await (supabase.from("stock_transactions" as any) as any).insert({
        material_id: newMaterial.id,
        type: "IN",
        quantity: initialStock,
        unit_price: unitPrice,
        reference_type: "INITIAL_STOCK",
        reference_id: null,
        notes: "Initial inventory setup on creation [Opening Balance]",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Material added to inventory successfully",
      material: newMaterial,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to add material" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      code,
      category_id,
      unit,
      reorder_level,
      unit_cost,
      supplier_name,
      supplier_phone,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code ? code.trim().toUpperCase() : null;
    if (category_id !== undefined) updates.category_id = category_id;
    if (unit !== undefined) updates.unit = unit;
    if (reorder_level !== undefined) updates.reorder_level = Number(reorder_level);
    if (unit_cost !== undefined) updates.unit_cost = Number(unit_cost);
    if (supplier_name !== undefined) updates.supplier_name = supplier_name ? supplier_name.trim() : null;
    if (supplier_phone !== undefined) updates.supplier_phone = supplier_phone ? supplier_phone.trim() : null;
    if (notes !== undefined) updates.notes = notes ? notes.trim() : null;

    const { data, error } = await (supabase.from("materials" as any) as any)
      .update(updates)
      .eq("id", id)
      .select("*, material_categories(id, name, description)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Material updated successfully",
      material: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update material" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Check if transactions exist
    const { count } = await (supabase.from("stock_transactions" as any) as any)
      .select("*", { count: "exact", head: true })
      .eq("material_id", id);

    if (count && count > 0) {
      // Clean up transactions or prevent deletion
      await (supabase.from("stock_transactions" as any) as any)
        .delete()
        .eq("material_id", id);
    }

    const { error } = await (supabase.from("materials" as any) as any)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete material" },
      { status: 500 }
    );
  }
}
