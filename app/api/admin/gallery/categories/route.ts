import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase.from("gallery_categories" as any) as any)
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const supabase = getAdminClient();

    // Check if category or slug already exists
    const { data: existing } = await (supabase.from("gallery_categories" as any) as any)
      .select("id, name, slug")
      .or(`slug.eq.${slug},name.ilike.${cleanName}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Category already exists",
        data: existing,
      });
    }

    // Get highest display order
    const { data: lastItem } = await (supabase.from("gallery_categories" as any) as any)
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastItem?.display_order || 0) + 1;

    const { data, error } = await (supabase.from("gallery_categories" as any) as any)
      .insert({
        name: cleanName,
        slug,
        display_order: nextOrder,
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
    return NextResponse.json({ error: err?.message || "Failed to create category" }, { status: 500 });
  }
}
