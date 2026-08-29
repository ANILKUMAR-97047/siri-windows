"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { galleryContent } from "@/lib/content";
import { prefersReducedMotion, ANIM } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

type FilterType = (typeof galleryContent.filters)[number];

export default function GallerySection() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredImages =
    activeFilter === "All"
      ? galleryContent.images
      : galleryContent.images.filter(
        (img) => img.category === activeFilter.toLowerCase()
      );

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
          stagger: 0.06,
          ease: ANIM.ease,
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: gridRef, dependencies: [activeFilter] }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, filteredImages.length]);

  const navigateLightbox = useCallback(
    (dir: number) => {
      if (lightboxIndex === null) return;
      const newIndex =
        (lightboxIndex + dir + filteredImages.length) % filteredImages.length;
      setLightboxIndex(newIndex);
    },
    [lightboxIndex, filteredImages.length]
  );

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
            >
              {galleryContent.heading}
            </h2>
          </Reveal>
        </div>

        {/* Filter Tabs */}
        <Reveal>
          <div className="flex items-center justify-center gap-2 mb-10">
            {galleryContent.filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 min-h-[44px] ${activeFilter === filter
                  ? "bg-navy-900 text-white shadow-lg"
                  : "bg-off-white text-slate-600 hover:bg-blue-100"
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Image Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredImages.map((image, i) => (
            <div
              key={image.src}
              className="gallery-item relative rounded-[var(--radius-md)] overflow-hidden cursor-pointer group aspect-[4/3]"
              onClick={() => setLightboxIndex(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && setLightboxIndex(i)
              }
              aria-label={`View: ${image.alt}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/30 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  View
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
          aria-label="Image lightbox"
          aria-modal="true"
        >
          <div
            className="relative max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filteredImages[lightboxIndex].src}
              alt={filteredImages[lightboxIndex].alt}
              width={filteredImages[lightboxIndex].width}
              height={filteredImages[lightboxIndex].height}
              className="object-contain max-h-[85vh] rounded-lg"
              sizes="90vw"
              priority
            />

            {/* Close */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev/Next */}
            <button
              onClick={() => navigateLightbox(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-navy-950/50 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigateLightbox(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-navy-950/50 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Caption */}
            <p className="absolute -bottom-10 left-0 right-0 text-center text-white/60 text-sm">
              {filteredImages[lightboxIndex].alt}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
