import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getAdminClient();

    // 1. Fetch categories
    const { data: categories, error: catError } = await (supabase
      .from("gallery_categories" as any) as any)
      .select("id, name, slug, display_order")
      .order("display_order", { ascending: true });

    if (catError) {
      console.warn("Could not query gallery_categories:", catError.message);
    }

    // 2. Fetch images
    const { data: images, error: imgError } = await (supabase
      .from("gallery_images" as any) as any)
      .select("id, title, description, image_url, is_featured, display_order, created_at, category_id, gallery_categories(id, name, slug)")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (imgError) {
      console.warn("Could not query gallery_images:", imgError.message);
    }

    const formattedImages = (images || []).map((img: any) => ({
      id: img.id,
      title: img.title,
      description: img.description,
      src: img.image_url,
      alt: img.title,
      isFeatured: Boolean(img.is_featured),
      category: img.gallery_categories?.slug || "other",
      categoryName: img.gallery_categories?.name || "Other",
      categoryId: img.category_id,
      width: 800,
      height: 600,
    }));

    return NextResponse.json(
      {
        success: true,
        categories: categories || [],
        images: formattedImages,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load gallery" },
      { status: 500 }
    );
  }
}
