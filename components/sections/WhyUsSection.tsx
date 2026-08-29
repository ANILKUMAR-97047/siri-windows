"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import * as LucideIcons from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/providers/LanguageProvider";
import { prefersReducedMotion, ANIM } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

export default function WhyUsSection() {
  const { whyUsContent } = useContent();
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current || prefersReducedMotion()) return;

      const items = gridRef.current.querySelectorAll(".feature-item");
      gsap.fromTo(
        items,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
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
    <section id="why-us" className="section-padding bg-white">
      <div className="container-wide">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Reveal>
            <p className="section-label">{whyUsContent.sectionLabel}</p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {whyUsContent.heading}
            </h2>
          </Reveal>
        </div>

        {/* Feature Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {whyUsContent.features.map((feature, i) => {
            const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[feature.icon] || LucideIcons.CheckCircle;

            return (
              <div
                key={i}
                className="feature-item flex gap-4 p-6 rounded-[var(--radius-md)] bg-off-white/70 hover:bg-blue-100/50 border border-transparent hover:border-blue-200 transition-all duration-300 group"
              >
                {/* Icon */}
                <div className="shrink-0 w-12 h-12 rounded-[var(--radius-sm)] bg-navy-900/5 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-all duration-300">
                  <IconComponent className="w-5 h-5 text-navy-600 group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Text */}
                <div>
                  <h3
                    className="font-semibold text-navy-950 mb-1.5"
                    style={{
                      fontSize: "var(--text-h4)",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
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
