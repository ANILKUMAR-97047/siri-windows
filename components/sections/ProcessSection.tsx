"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import * as LucideIcons from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { processContent } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

export default function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Animated line draw on scroll
  useGSAP(
    () => {
      if (!lineRef.current || prefersReducedMotion()) return;

      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 60%",
            scrub: 1,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="process"
      className="section-padding bg-off-white"
    >
      <div className="container-wide">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Reveal>
            <p className="section-label">{processContent.sectionLabel}</p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {processContent.heading}
            </h2>
          </Reveal>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line — desktop horizontal */}
          <div
            ref={lineRef}
            className="hidden md:block absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-gold-500 origin-left"
            style={{ transformOrigin: "left center" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 relative">
            {processContent.steps.map((step, i) => {
              const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[step.icon] || LucideIcons.Circle;

              return (
                <Reveal key={i} delay={0.1 * i}>
                  <div className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-0">
                    {/* Step Circle */}
                    <div className="relative z-10 shrink-0">
                      <div className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full bg-white border-2 border-navy-900/10 flex flex-col items-center justify-center shadow-[var(--shadow-card)] group hover:border-gold-500 transition-colors duration-300">
                        <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-navy-600 mb-0.5" />
                        <span className="text-[0.6rem] font-bold text-gold-500">
                          0{step.number}
                        </span>
                      </div>
                      {/* Vertical connector for mobile */}
                      {i < processContent.steps.length - 1 && (
                        <div className="md:hidden absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-8 bg-gold-500/30" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="md:mt-5">
                      <h3
                        className="font-semibold text-navy-950 mb-1"
                        style={{
                          fontSize: "var(--text-h4)",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed max-w-[200px] mx-auto">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
