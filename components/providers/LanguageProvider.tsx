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

    const mergedContent: WebsiteContent = {
      ...base,
      // 1. Hero Section
      heroContent: hero
        ? {
            ...base.heroContent,
            headline: hero.heading || base.heroContent.headline,
            subheadline: hero.subheading || base.heroContent.subheadline,
            ctaPrimary: hero.ctaText || base.heroContent.ctaPrimary,
            ctaSecondary: hero.secondaryText || base.heroContent.ctaSecondary,
            badges:
              Array.isArray(hero.badges) && hero.badges.length > 0
                ? hero.badges
                : base.heroContent.badges,
          }
        : base.heroContent,

      // 2. About & Statistics
      aboutContent: {
        ...base.aboutContent,
        sectionLabel: about?.sectionLabel || base.aboutContent.sectionLabel,
        heading: about?.heading || base.aboutContent.heading,
        paragraphs: about?.story
          ? [about.story, ...(about.tagline ? [about.tagline] : [])]
          : base.aboutContent.paragraphs,
        stats: stats
          ? [
              {
                value: Number(stats.yearsExperience) || 10,
                suffix: "+",
                label: "Years Experience",
              },
              {
                value: Number(stats.projectsCompleted) || 500,
                suffix: "+",
                label: "Projects Completed",
              },
              {
                value: Number(stats.happyClients) || 450,
                suffix: "+",
                label: "Happy Clients",
              },
              {
                value: Number(stats.districtsCovered) || 8,
                suffix: "+",
                label: "Districts Covered",
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
                ? [contact.phonePrimary, contact.phoneSecondary].filter(Boolean)
                : base.contactInfo.phones,
            whatsappNumber: contact.whatsappNumber || base.contactInfo.whatsappNumber,
            address: contact.address || base.contactInfo.address,
            businessHours: contact.businessHours || base.contactInfo.businessHours,
            mapEmbedUrl: contact.mapEmbedUrl || base.contactInfo.mapEmbedUrl,
          }
        : base.contactInfo,

      // 4. Products Section
      productsContent: products
        ? {
            ...base.productsContent,
            heading: products.heading || base.productsContent.heading,
            subheading: products.subheading || base.productsContent.subheading,
            products:
              Array.isArray(products.items) && products.items.length > 0
                ? products.items
                : base.productsContent.products,
          }
        : base.productsContent,

      // 5. Testimonials Section
      testimonialsContent: testimonials
        ? {
            ...base.testimonialsContent,
            heading: testimonials.heading || base.testimonialsContent.heading,
            testimonials:
              Array.isArray(testimonials.items) && testimonials.items.length > 0
                ? testimonials.items
                : base.testimonialsContent.testimonials,
          }
        : base.testimonialsContent,

      // 6. Promotional CTA Banner
      ctaBannerContent: cta
        ? {
            ...base.ctaBannerContent,
            heading: cta.heading || base.ctaBannerContent.heading,
            subheading: cta.subheading || base.ctaBannerContent.subheading,
            cta: cta.ctaText || base.ctaBannerContent.cta,
          }
        : base.ctaBannerContent,

      // 7. Why Choose Us Advantages
      whyUsContent: whyUs
        ? {
            ...base.whyUsContent,
            heading: whyUs.heading || base.whyUsContent.heading,
            features:
              Array.isArray(whyUs.features) && whyUs.features.length > 0
                ? whyUs.features
                : base.whyUsContent.features,
          }
        : base.whyUsContent,

      // 8. 5-Step Process
      processContent: process
        ? {
            ...base.processContent,
            heading: process.heading || base.processContent.heading,
            steps:
              Array.isArray(process.steps) && process.steps.length > 0
                ? process.steps
                : base.processContent.steps,
          }
        : base.processContent,
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
