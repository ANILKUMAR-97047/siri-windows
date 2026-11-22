import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getAdminClient();

    // 1. Fetch categories
    const { data: categories, error: catError } = await (supabase
      .from("gallery_categories" as any) as any)
      .select("*")
      .order("display_order", { ascending: true });

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 400 });
    }

    // 2. Fetch images with joined category info
    const { data: images, error: imgError } = await (supabase
      .from("gallery_images" as any) as any)
      .select("*, gallery_categories(id, name, slug)")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (imgError) {
      return NextResponse.json({ error: imgError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
      images: images || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load gallery items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, image_url, category_id, is_featured, customCategoryName } = body;

    if (!title || !image_url) {
      return NextResponse.json(
        { error: "Title and Image URL are required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    let finalCategoryId = category_id;

    // If admin entered a custom category name, create or find it
    if (customCategoryName && typeof customCategoryName === "string" && customCategoryName.trim()) {
      const cleanName = customCategoryName.trim();
      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { data: existingCat } = await (supabase.from("gallery_categories" as any) as any)
        .select("id")
        .or(`slug.eq.${slug},name.ilike.${cleanName}`)
        .maybeSingle();

      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const { data: lastItem } = await (supabase.from("gallery_categories" as any) as any)
          .select("display_order")
          .order("display_order", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextOrder = (lastItem?.display_order || 0) + 1;

        const { data: newCat, error: createCatError } = await (supabase
          .from("gallery_categories" as any) as any)
          .insert({
            name: cleanName,
            slug,
            display_order: nextOrder,
          })
          .select()
          .single();

        if (!createCatError && newCat) {
          finalCategoryId = newCat.id;
        }
      }
    }

    // Insert image
    const { data: newImage, error: insertError } = await (supabase
      .from("gallery_images" as any) as any)
      .insert({
        title: title.trim(),
        description: description ? description.trim() : null,
        image_url: image_url.trim(),
        category_id: finalCategoryId || null,
        is_featured: Boolean(is_featured),
        display_order: 0,
      })
      .select("*, gallery_categories(id, name, slug)")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Photo added to gallery successfully",
      data: newImage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create gallery item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, is_featured, title, category_id, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const updateData: Record<string, any> = {};

    if (typeof is_featured === "boolean") updateData.is_featured = is_featured;
    if (typeof title === "string") updateData.title = title.trim();
    if (category_id !== undefined) updateData.category_id = category_id;
    if (typeof display_order === "number") updateData.display_order = display_order;

    const { data, error } = await (supabase.from("gallery_images" as any) as any)
      .update(updateData)
      .eq("id", id)
      .select("*, gallery_categories(id, name, slug)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Photo updated successfully",
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update gallery item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await (supabase.from("gallery_images" as any) as any)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Photo deleted from gallery successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete gallery item" }, { status: 500 });
  }
}
