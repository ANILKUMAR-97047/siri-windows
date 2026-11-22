"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { useContent, useLanguage } from "@/components/providers/LanguageProvider";
import { prefersReducedMotion, ANIM } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

interface GalleryItemData {
  id?: string;
  src: string;
  alt: string;
  title?: string;
  category: string;
  categoryName?: string;
  width?: number;
  height?: number;
  isFeatured?: boolean;
}

interface GalleryCategoryTab {
  slug: string;
  name: string;
}

const standardCategoryTranslations: Record<string, Record<string, string>> = {
  all: { en: "All", te: "అన్నీ", hi: "सभी" },
  windows: { en: "Windows", te: "కిటికీలు", hi: "विंडोज़" },
  doors: { en: "Doors", te: "తలుపులు", hi: "डोर्स" },
  residential: { en: "Residential", te: "నివాసాలు", hi: "आवासीय" },
  commercial: { en: "Commercial", te: "కమర్షియల్", hi: "कमर्शियल" },
};

export default function GallerySection() {
  const { galleryContent } = useContent();
  const { language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Dynamic gallery images and categories from database
  const [dynamicImages, setDynamicImages] = useState<GalleryItemData[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<GalleryCategoryTab[]>([]);

  // Fetch latest database gallery
  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          if (Array.isArray(res.images) && res.images.length > 0) {
            setDynamicImages(res.images);
          }
          if (Array.isArray(res.categories) && res.categories.length > 0) {
            setDynamicCategories(
              res.categories.map((c: any) => ({
                slug: c.slug,
                name: c.name,
              }))
            );
          }
        }
      })
      .catch((err) => console.warn("Could not load dynamic gallery:", err));
  }, []);

  // Use database images if available, otherwise fall back to static content
  const allImages: GalleryItemData[] =
    dynamicImages.length > 0
      ? dynamicImages
      : galleryContent.images.map((img) => ({
          src: img.src,
          alt: img.alt,
          category: img.category,
          width: img.width,
          height: img.height,
        }));

  // Build category filter tabs
  const categoryTabs: GalleryCategoryTab[] = [
    { slug: "all", name: "All" },
    ...(dynamicCategories.length > 0
      ? dynamicCategories
      : [
          { slug: "windows", name: "Windows" },
          { slug: "doors", name: "Doors" },
          { slug: "residential", name: "Residential" },
          { slug: "commercial", name: "Commercial" },
        ]),
  ];

  // Helper to get translated or custom category label
  const getCategoryLabel = (cat: GalleryCategoryTab) => {
    const slug = cat.slug.toLowerCase();
    if (standardCategoryTranslations[slug]?.[language]) {
      return standardCategoryTranslations[slug][language];
    }
    return cat.name;
  };

  const filteredImages =
    activeFilter === "all"
      ? allImages
      : allImages.filter((img) => img.category.toLowerCase() === activeFilter.toLowerCase());

  useGSAP(
    () => {
      if (!gridRef.current || prefersReducedMotion()) return;

      const items = gridRef.current.querySelectorAll(".gallery-item");
      gsap.fromTo(
        items,
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: ANIM.ease,
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: gridRef, dependencies: [activeFilter, filteredImages.length] }
  );

  const navigateLightbox = useCallback(
    (dir: number) => {
      if (lightboxIndex === null || filteredImages.length === 0) return;
      const newIndex =
        (lightboxIndex + dir + filteredImages.length) % filteredImages.length;
      setLightboxIndex(newIndex);
    },
    [lightboxIndex, filteredImages.length]
  );

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, navigateLightbox]);

  return (
    <section id="gallery" className="section-padding bg-white">
      <div className="container-wide">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Reveal>
            <p className="section-label">{galleryContent.sectionLabel}</p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
              className="text-navy-950 font-bold"
            >
              {galleryContent.heading}
            </h2>
          </Reveal>
        </div>

        {/* Dynamic Category Filter Tabs */}
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            {categoryTabs.map((cat) => {
              const label = getCategoryLabel(cat);
              const isActive = activeFilter === cat.slug;

              return (
                <button
                  key={cat.slug}
                  onClick={() => setActiveFilter(cat.slug)}
                  className={`px-5 py-2 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 min-h-[44px] shrink-0 ${
                    isActive
                      ? "bg-navy-900 text-white shadow-lg shadow-navy-900/20 scale-105"
                      : "bg-off-white text-slate-600 hover:bg-blue-100/70 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Image Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredImages.map((image, i) => (
            <div
              key={`${image.src}-${i}`}
              className="gallery-item relative rounded-[var(--radius-md)] overflow-hidden cursor-pointer group aspect-4/3 bg-slate-100"
              onClick={() => setLightboxIndex(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLightboxIndex(i)}
              aria-label={`View: ${image.alt || image.title || "Gallery photo"}`}
            >
              <Image
                src={image.src}
                alt={image.alt || image.title || "Siri Windows installation"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                unoptimized={image.src.startsWith("http")}
              />
              <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/40 transition-colors duration-300 flex flex-col justify-between p-4">
                <span className="self-end text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {image.categoryName || image.category}
                </span>
                <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 line-clamp-1">
                  {image.title || image.alt || "View Photo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && filteredImages[lightboxIndex] && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-label={galleryContent.lightboxLabel}
          aria-modal="true"
        >
          <div
            className="relative max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filteredImages[lightboxIndex].src}
              alt={filteredImages[lightboxIndex].alt || "Gallery preview"}
              width={filteredImages[lightboxIndex].width || 900}
              height={filteredImages[lightboxIndex].height || 650}
              className="object-contain max-h-[85vh] rounded-xl shadow-2xl"
              sizes="90vw"
              priority
              unoptimized={filteredImages[lightboxIndex].src.startsWith("http")}
            />

            {/* Close */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label={galleryContent.close}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev/Next */}
            <button
              onClick={() => navigateLightbox(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-navy-950/60 hover:bg-navy-950 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition"
              aria-label={galleryContent.previous}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigateLightbox(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-navy-950/60 hover:bg-navy-950 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition"
              aria-label={galleryContent.next}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Caption */}
            <p className="absolute -bottom-10 left-0 right-0 text-center text-white/80 text-sm font-medium">
              {filteredImages[lightboxIndex].title || filteredImages[lightboxIndex].alt}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
