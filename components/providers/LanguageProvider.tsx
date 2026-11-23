"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  contentByLanguage,
  languages,
  type LanguageCode,
  type WebsiteContent,
} from "@/lib/content";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  content: WebsiteContent;
  languages: typeof languages;
}

const STORAGE_KEY = "siri-windows-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguageCode(value: string | null): value is LanguageCode {
  return value === "en" || value === "te" || value === "hi";
}

export default function LanguageProvider({
  children,
  initialContent,
}: {
  children: React.ReactNode;
  initialContent?: Record<string, any>;
}) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return isLanguageCode(savedLanguage) ? savedLanguage : "en";
  });

  const [dynamicContent, setDynamicContent] = useState<Record<string, any> | null>(() => {
    if (initialContent && Object.keys(initialContent).length > 0) {
      return initialContent;
    }
    return null;
  });

  useEffect(() => {
    if (initialContent && Object.keys(initialContent).length > 0) {
      setDynamicContent(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    fetch("/api/website/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.data && typeof res.data === "object") {
          setDynamicContent(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const base = contentByLanguage[language];
    if (!dynamicContent) {
      return {
        language,
        setLanguage,
        content: base,
        languages,
      };
    }

    const hero = dynamicContent.hero;
    const about = dynamicContent.about;
    const stats = dynamicContent.stats;
    const contact = dynamicContent.contact;
    const products = dynamicContent.products;
    const testimonials = dynamicContent.testimonials;
    const cta = dynamicContent.cta;
    const whyUs = dynamicContent.why_us;
    const process = dynamicContent.process;
    const faq = dynamicContent.faq;

    const isEn = language === "en";
    const heroTr = hero?.translations?.[language];
    const aboutTr = about?.translations?.[language];
    const contactTr = contact?.translations?.[language];
    const productsTr = products?.translations?.[language];
    const testimonialsTr = testimonials?.translations?.[language];
    const ctaTr = cta?.translations?.[language];
    const whyUsTr = whyUs?.translations?.[language];
    const processTr = process?.translations?.[language];
    const faqTr = faq?.translations?.[language];

    const statLabels: Record<LanguageCode, string[]> = {
      en: ["Years Experience", "Projects Completed", "Happy Clients", "Districts Covered"],
      te: ["సంవత్సరాల అనుభవం", "పూర్తైన ప్రాజెక్టులు", "సంతోషకర కస్టమర్లు", "జిల్లాలు విస్తరించి"],
      hi: ["वर्षों का अनुभव", "पूरे प्रोजेक्ट", "खुश ग्राहक", "जिलों में सेवा"],
    };

    const mergedContent: WebsiteContent = {
      ...base,
      // 1. Hero Section
      heroContent: hero
        ? {
            ...base.heroContent,
            headline: isEn
              ? (hero.heading || base.heroContent.headline)
              : (heroTr?.heading || base.heroContent.headline),
            subheadline: isEn
              ? (hero.subheading || base.heroContent.subheadline)
              : (heroTr?.subheading || base.heroContent.subheadline),
            ctaPrimary: isEn
              ? (hero.ctaText || base.heroContent.ctaPrimary)
              : (heroTr?.ctaText || base.heroContent.ctaPrimary),
            ctaSecondary: isEn
              ? (hero.secondaryText || base.heroContent.ctaSecondary)
              : (heroTr?.secondaryText || base.heroContent.ctaSecondary),
            badges: isEn
              ? (Array.isArray(hero.badges) && hero.badges.length > 0
                  ? hero.badges
                  : base.heroContent.badges)
              : (Array.isArray(heroTr?.badges) && heroTr.badges.length > 0
                  ? heroTr.badges
                  : base.heroContent.badges),
          }
        : base.heroContent,

      // 2. About & Statistics
      aboutContent: {
        ...base.aboutContent,
        sectionLabel: isEn
          ? (about?.sectionLabel || base.aboutContent.sectionLabel)
          : (aboutTr?.sectionLabel || base.aboutContent.sectionLabel),
        heading: isEn
          ? (about?.heading || base.aboutContent.heading)
          : (aboutTr?.heading || base.aboutContent.heading),
        paragraphs: isEn
          ? (about?.story
              ? [about.story, ...(about.tagline ? [about.tagline] : [])]
              : base.aboutContent.paragraphs)
          : (aboutTr?.story
              ? [aboutTr.story, ...(aboutTr.tagline ? [aboutTr.tagline] : [])]
              : base.aboutContent.paragraphs),
        stats: stats
          ? [
              {
                value: Number(stats.yearsExperience) || 10,
                suffix: "+",
                label: statLabels[language][0],
              },
              {
                value: Number(stats.projectsCompleted) || 500,
                suffix: "+",
                label: statLabels[language][1],
              },
              {
                value: Number(stats.happyClients) || 450,
                suffix: "+",
                label: statLabels[language][2],
              },
              {
                value: Number(stats.districtsCovered) || 8,
                suffix: "+",
                label: statLabels[language][3],
              },
            ]
          : base.aboutContent.stats,
      },

      // 3. Contact & Showroom Details
      contactInfo: contact
        ? {
            ...base.contactInfo,
            phones:
              [contact.phonePrimary, contact.phoneSecondary].filter(Boolean).length > 0
                ? [contact.phonePrimary, contact.phoneSecondary]
                    .filter(Boolean)
                    .map((p) => {
                      const clean = String(p).trim().replace(/^(\+91\s*)+/, "+91 ");
                      return clean.startsWith("+") ? clean : `+91 ${clean}`;
                    })
                : base.contactInfo.phones.map((p) => {
                    const clean = String(p).trim().replace(/^(\+91\s*)+/, "+91 ");
                    return clean.startsWith("+") ? clean : `+91 ${clean}`;
                  }),
            whatsappNumber: contact.whatsappNumber || base.contactInfo.whatsappNumber,
            address: isEn
              ? (contact.address || base.contactInfo.address)
              : (contactTr?.address || base.contactInfo.address),
            businessHours: isEn
              ? (contact.businessHours || base.contactInfo.businessHours)
              : (contactTr?.businessHours || base.contactInfo.businessHours),
            mapEmbedUrl: contact.mapEmbedUrl || base.contactInfo.mapEmbedUrl,
          }
        : base.contactInfo,

      // 4. Products Section
      productsContent: products
        ? {
            ...base.productsContent,
            heading: isEn
              ? (products.heading || base.productsContent.heading)
              : (productsTr?.heading || base.productsContent.heading),
            subheading: isEn
              ? (products.subheading || base.productsContent.subheading)
              : (productsTr?.subheading || base.productsContent.subheading),
            products: isEn
              ? (Array.isArray(products.items) && products.items.length > 0
                  ? products.items
                  : base.productsContent.products)
              : (Array.isArray(productsTr?.items) && productsTr.items.length > 0
                  ? productsTr.items
                  : base.productsContent.products),
          }
        : base.productsContent,

      // 5. Testimonials Section
      testimonialsContent: testimonials
        ? {
            ...base.testimonialsContent,
            heading: isEn
              ? (testimonials.heading || base.testimonialsContent.heading)
              : (testimonialsTr?.heading || base.testimonialsContent.heading),
            testimonials: isEn
              ? (Array.isArray(testimonials.items) && testimonials.items.length > 0
                  ? testimonials.items
                  : base.testimonialsContent.testimonials)
              : (Array.isArray(testimonialsTr?.items) && testimonialsTr.items.length > 0
                  ? testimonialsTr.items
                  : base.testimonialsContent.testimonials),
          }
        : base.testimonialsContent,

      // 6. Promotional CTA Banner
      ctaBannerContent: cta
        ? {
            ...base.ctaBannerContent,
            heading: isEn
              ? (cta.heading || base.ctaBannerContent.heading)
              : (ctaTr?.heading || base.ctaBannerContent.heading),
            subheading: isEn
              ? (cta.subheading || base.ctaBannerContent.subheading)
              : (ctaTr?.subheading || base.ctaBannerContent.subheading),
            cta: isEn
              ? (cta.ctaText || base.ctaBannerContent.cta)
              : (ctaTr?.ctaText || base.ctaBannerContent.cta),
          }
        : base.ctaBannerContent,

      // 7. Why Choose Us Advantages
      whyUsContent: whyUs
        ? {
            ...base.whyUsContent,
            heading: isEn
              ? (whyUs.heading || base.whyUsContent.heading)
              : (whyUsTr?.heading || base.whyUsContent.heading),
            features: isEn
              ? (Array.isArray(whyUs.features) && whyUs.features.length > 0
                  ? whyUs.features
                  : base.whyUsContent.features)
              : (Array.isArray(whyUsTr?.features) && whyUsTr.features.length > 0
                  ? whyUsTr.features
                  : base.whyUsContent.features),
          }
        : base.whyUsContent,

      // 8. 5-Step Process
      processContent: process
        ? {
            ...base.processContent,
            heading: isEn
              ? (process.heading || base.processContent.heading)
              : (processTr?.heading || base.processContent.heading),
            steps: isEn
              ? (Array.isArray(process.steps) && process.steps.length > 0
                  ? process.steps
                  : base.processContent.steps)
              : (Array.isArray(processTr?.steps) && processTr.steps.length > 0
                  ? processTr.steps
                  : base.processContent.steps),
          }
        : base.processContent,

      // 9. FAQ Section
      faqContent: faq
        ? {
            ...base.faqContent,
            sectionLabel: isEn
              ? (faq.sectionLabel || base.faqContent.sectionLabel)
              : (faqTr?.sectionLabel || base.faqContent.sectionLabel),
            heading: isEn
              ? (faq.heading || base.faqContent.heading)
              : (faqTr?.heading || base.faqContent.heading),
            subheading: isEn
              ? (faq.subheading || base.faqContent.subheading)
              : (faqTr?.subheading || base.faqContent.subheading),
            items: isEn
              ? (Array.isArray(faq.items) && faq.items.length > 0
                  ? faq.items
                  : base.faqContent.items)
              : (Array.isArray(faqTr?.items) && faqTr.items.length > 0
                  ? (Array.isArray(faq.items)
                      ? faq.items.map((it: any, i: number) => faqTr.items[i] || it)
                      : faqTr.items)
                  : (Array.isArray(faq.items) && faq.items.length > 0
                      ? faq.items
                      : base.faqContent.items)),
          }
        : base.faqContent,
    };

    return {
      language,
      setLanguage,
      content: mergedContent,
      languages,
    };
  }, [language, dynamicContent]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

export function useContent() {
  return useLanguage().content;
}
