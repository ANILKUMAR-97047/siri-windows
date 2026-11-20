import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("website_content").select("*");

    if (error) {
      console.warn("Could not query website_content from Supabase:", error.message);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hero, contact, stats, about } = body;

    const supabase = getAdminClient();

    const updates = [
      { section: "hero", content: hero },
      { section: "contact", content: contact },
      { section: "stats", content: stats },
      { section: "about", content: about },
    ].filter((item) => item.content !== undefined);

    for (const item of updates) {
      const { error } = await (supabase.from("website_content" as any) as any)
        .upsert(
          {
            section: item.section,
            content: item.content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "section" }
        );

      if (error) {
        console.warn(`Error updating section ${item.section}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Website dynamic content updated successfully!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update content" },
      { status: 500 }
    );
  }
}
