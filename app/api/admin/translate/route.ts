import { NextResponse } from "next/server";
import { translateText, translateSectionFields } from "@/lib/translate";

export async function POST(request: Request) {
  try {
    const { text, targetLang, section, data } = await request.json();

    if (!targetLang || (targetLang !== "te" && targetLang !== "hi")) {
      return NextResponse.json({ error: "Invalid target language" }, { status: 400 });
    }

    if (text) {
      const translated = await translateText(text, targetLang);
      return NextResponse.json({ success: true, translated });
    }

    if (data && section) {
      let keys: string[] = ["heading"];
      if (section === "hero") keys = ["badgeText", "heading", "subheading", "ctaText", "secondaryText"];
      else if (section === "about") keys = ["sectionLabel", "heading", "tagline", "story"];
      else if (section === "cta") keys = ["heading", "subheading", "ctaText"];
      else if (section === "products") keys = ["heading", "subheading"];
      else if (section === "why_us") keys = ["heading"];
      else if (section === "process") keys = ["heading"];
      else if (section === "testimonials") keys = ["heading"];

      const translated = await translateSectionFields(data, targetLang, keys);
      return NextResponse.json({ success: true, translated });
    }

    return NextResponse.json({ error: "Missing text or data" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Translation failed" }, { status: 500 });
  }
}
