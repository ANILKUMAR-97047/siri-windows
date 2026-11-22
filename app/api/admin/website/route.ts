import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { translateSectionFields } from "@/lib/translate";

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
    const {
      hero,
      contact,
      stats,
      about,
      products,
      testimonials,
      cta,
      why_us,
      process,
    } = body;

    // Automatic translation for sections if not explicitly provided
    if (hero) {
      hero.translations = hero.translations || {};
      if (!hero.translations.te?.heading && hero.heading) {
        hero.translations.te = {
          ...hero.translations.te,
          ...(await translateSectionFields(hero, "te", ["badgeText", "heading", "subheading", "ctaText", "secondaryText"])),
        };
      }
      if (!hero.translations.hi?.heading && hero.heading) {
        hero.translations.hi = {
          ...hero.translations.hi,
          ...(await translateSectionFields(hero, "hi", ["badgeText", "heading", "subheading", "ctaText", "secondaryText"])),
        };
      }
    }

    if (about) {
      about.translations = about.translations || {};
      if (!about.translations.te?.heading && about.heading) {
        about.translations.te = {
          ...about.translations.te,
          ...(await translateSectionFields(about, "te", ["sectionLabel", "heading", "tagline", "story"])),
        };
      }
      if (!about.translations.hi?.heading && about.heading) {
        about.translations.hi = {
          ...about.translations.hi,
          ...(await translateSectionFields(about, "hi", ["sectionLabel", "heading", "tagline", "story"])),
        };
      }
    }

    if (cta) {
      cta.translations = cta.translations || {};
      if (!cta.translations.te?.heading && cta.heading) {
        cta.translations.te = {
          ...cta.translations.te,
          ...(await translateSectionFields(cta, "te", ["heading", "subheading", "ctaText"])),
        };
      }
      if (!cta.translations.hi?.heading && cta.heading) {
        cta.translations.hi = {
          ...cta.translations.hi,
          ...(await translateSectionFields(cta, "hi", ["heading", "subheading", "ctaText"])),
        };
      }
    }

    if (products) {
      products.translations = products.translations || {};
      if (!products.translations.te?.heading && products.heading) {
        products.translations.te = {
          ...products.translations.te,
          ...(await translateSectionFields(products, "te", ["heading", "subheading"])),
        };
      }
      if (!products.translations.hi?.heading && products.heading) {
        products.translations.hi = {
          ...products.translations.hi,
          ...(await translateSectionFields(products, "hi", ["heading", "subheading"])),
        };
      }
    }

    if (why_us) {
      why_us.translations = why_us.translations || {};
      if (!why_us.translations.te?.heading && why_us.heading) {
        why_us.translations.te = {
          ...why_us.translations.te,
          ...(await translateSectionFields(why_us, "te", ["heading"])),
        };
      }
      if (!why_us.translations.hi?.heading && why_us.heading) {
        why_us.translations.hi = {
          ...why_us.translations.hi,
          ...(await translateSectionFields(why_us, "hi", ["heading"])),
        };
      }
    }

    if (process) {
      process.translations = process.translations || {};
      if (!process.translations.te?.heading && process.heading) {
        process.translations.te = {
          ...process.translations.te,
          ...(await translateSectionFields(process, "te", ["heading"])),
        };
      }
      if (!process.translations.hi?.heading && process.heading) {
        process.translations.hi = {
          ...process.translations.hi,
          ...(await translateSectionFields(process, "hi", ["heading"])),
        };
      }
    }

    if (testimonials) {
      testimonials.translations = testimonials.translations || {};
      if (!testimonials.translations.te?.heading && testimonials.heading) {
        testimonials.translations.te = {
          ...testimonials.translations.te,
          ...(await translateSectionFields(testimonials, "te", ["heading"])),
        };
      }
      if (!testimonials.translations.hi?.heading && testimonials.heading) {
        testimonials.translations.hi = {
          ...testimonials.translations.hi,
          ...(await translateSectionFields(testimonials, "hi", ["heading"])),
        };
      }
    }

    const supabase = getAdminClient();

    const updates = [
      { section: "hero", content: hero },
      { section: "contact", content: contact },
      { section: "stats", content: stats },
      { section: "about", content: about },
      { section: "products", content: products },
      { section: "testimonials", content: testimonials },
      { section: "cta", content: cta },
      { section: "why_us", content: why_us },
      { section: "process", content: process },
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
      message: "Website dynamic content updated and auto-translated successfully!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update content" },
      { status: 500 }
    );
  }
}
