import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase.from("website_content" as any) as any)
      .select("section, content, is_active");

    if (error || !data) {
      return NextResponse.json(
        { success: true, data: {} },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const contentMap: Record<string, any> = {};
    for (const item of (data as any[])) {
      if (item.is_active !== false && item.section && item.content) {
        contentMap[item.section] = item.content;
      }
    }

    return NextResponse.json(
      { success: true, data: contentMap },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: true, data: {} },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
