import { contentByLanguage } from "./content";

// In-memory cache for fast repeated translations
const translationCache = new Map<string, string>();

// Seed common translations from contentByLanguage for instant 0ms lookups
function initSeedCache() {
  const te = contentByLanguage.te;
  const hi = contentByLanguage.hi;
  const en = contentByLanguage.en;

  const pairs: [string, string, "te" | "hi"][] = [
    [en.heroContent.headline, te.heroContent.headline, "te"],
    [en.heroContent.subheadline, te.heroContent.subheadline, "te"],
    [en.heroContent.ctaPrimary, te.heroContent.ctaPrimary, "te"],
    [en.heroContent.ctaSecondary, te.heroContent.ctaSecondary, "te"],
    [en.aboutContent.sectionLabel, te.aboutContent.sectionLabel, "te"],
    [en.aboutContent.heading, te.aboutContent.heading, "te"],
    [en.ctaBannerContent.heading, te.ctaBannerContent.heading, "te"],
    [en.ctaBannerContent.subheading, te.ctaBannerContent.subheading, "te"],
    [en.ctaBannerContent.cta, te.ctaBannerContent.cta, "te"],
    [en.productsContent.heading, te.productsContent.heading, "te"],
    [en.productsContent.subheading, te.productsContent.subheading, "te"],
    [en.whyUsContent.heading, te.whyUsContent.heading, "te"],
    [en.processContent.heading, te.processContent.heading, "te"],
    [en.testimonialsContent.heading, te.testimonialsContent.heading, "te"],
    [en.faqContent.heading, te.faqContent.heading, "te"],
    [en.faqContent.subheading, te.faqContent.subheading, "te"],

    [en.heroContent.headline, hi.heroContent.headline, "hi"],
    [en.heroContent.subheadline, hi.heroContent.subheadline, "hi"],
    [en.heroContent.ctaPrimary, hi.heroContent.ctaPrimary, "hi"],
    [en.heroContent.ctaSecondary, hi.heroContent.ctaSecondary, "hi"],
    [en.aboutContent.sectionLabel, hi.aboutContent.sectionLabel, "hi"],
    [en.aboutContent.heading, hi.aboutContent.heading, "hi"],
    [en.ctaBannerContent.heading, hi.ctaBannerContent.heading, "hi"],
    [en.ctaBannerContent.subheading, hi.ctaBannerContent.subheading, "hi"],
    [en.ctaBannerContent.cta, hi.ctaBannerContent.cta, "hi"],
    [en.productsContent.heading, hi.productsContent.heading, "hi"],
    [en.productsContent.subheading, hi.productsContent.subheading, "hi"],
    [en.whyUsContent.heading, hi.whyUsContent.heading, "hi"],
    [en.processContent.heading, hi.processContent.heading, "hi"],
    [en.testimonialsContent.heading, hi.testimonialsContent.heading, "hi"],
    [en.faqContent.heading, hi.faqContent.heading, "hi"],
    [en.faqContent.subheading, hi.faqContent.subheading, "hi"],
  ];

  for (const [source, target, lang] of pairs) {
    if (source && target) {
      translationCache.set(`${lang}:${source.trim().toLowerCase()}`, target);
    }
  }
}

initSeedCache();

/**
 * Translates a given English string into Telugu (te) or Hindi (hi).
 */
export async function translateText(text: string, targetLang: "te" | "hi"): Promise<string> {
  if (!text || typeof text !== "string" || !text.trim()) {
    return text;
  }

  const cleanText = text.trim();
  const cacheKey = `${targetLang}:${cleanText.toLowerCase()}`;

  // 1. Check in-memory cache / seeded translations
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 2. Fetch from translation engine with 3.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const encoded = encodeURIComponent(cleanText);
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${targetLang}`,
      {
        signal: controller.signal,
        cache: "no-store",
      }
    );

    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const translated = json?.responseData?.translatedText;
      if (translated && typeof translated === "string" && !translated.startsWith("MYMEMORY WARNING")) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (err: any) {
    console.warn(`[AutoTranslate] Fallback used for ${targetLang}:`, err?.message);
  }

  return cleanText;
}

/**
 * Translates specific keys of a section object into targetLang.
 */
export async function translateSectionFields<T extends Record<string, any>>(
  obj: T,
  targetLang: "te" | "hi",
  keys: (keyof T)[]
): Promise<Partial<T>> {
  const result: any = {};
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim().length > 0) {
      result[key] = await translateText(val, targetLang);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}
