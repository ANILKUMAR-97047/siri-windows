"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import * as LucideIcons from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { productsContent } from "@/lib/content";
import { prefersReducedMotion, ANIM } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

export default function ProductsSection() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current || prefersReducedMotion()) return;

      const cards = gridRef.current.querySelectorAll(".product-card");
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: ANIM.ease,
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: gridRef }
  );

  return (
    <section id="products" className="section-padding bg-off-white">
      <div className="container-wide">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Reveal>
            <p className="section-label">{productsContent.sectionLabel}</p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {productsContent.heading}
            </h2>
            <p
              className="text-slate-600 mt-4"
              style={{ fontSize: "var(--text-body)" }}
            >
              {productsContent.subheading}
            </p>
          </Reveal>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6"
        >
          {productsContent.products.map((product) => {
            // Dynamically get the Lucide icon
            const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[product.icon] || LucideIcons.Box;

            return (
              <div
                key={product.slug}
                className="product-card group relative bg-white rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-48 sm:h-52 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className="text-xs font-semibold text-white bg-gold-500/90 px-3 py-1.5 rounded-md">
                      Learn More
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-navy-600">
                      <IconComponent className="w-5 h-5" />
                    </span>
                    <h3
                      className="font-semibold text-navy-950"
                      style={{
                        fontSize: "var(--text-h4)",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
