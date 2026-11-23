import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase.from("material_categories" as any) as any)
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, categories: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load material categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const supabase = getAdminClient();

    // Check if category already exists
    const { data: existing } = await (supabase.from("material_categories" as any) as any)
      .select("id, name")
      .ilike("name", cleanName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Category already exists",
        data: existing,
      });
    }

    const { data, error } = await (supabase.from("material_categories" as any) as any)
      .insert({
        name: cleanName,
        description: description ? description.trim() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create material category" },
      { status: 500 }
    );
  }
}
