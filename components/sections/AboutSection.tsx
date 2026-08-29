"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/providers/LanguageProvider";
import { prefersReducedMotion } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const { aboutContent } = useContent();
  const statsRef = useRef<HTMLDivElement>(null);

  // Count-up animation for stats
  useGSAP(
    () => {
      if (!statsRef.current || prefersReducedMotion()) return;

      const statValues = statsRef.current.querySelectorAll(".stat-value");

      statValues.forEach((el, i) => {
        const target = aboutContent.stats[i].value;
        const obj = { value: 0 };

        gsap.to(obj, {
          value: target,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            (el as HTMLElement).textContent = Math.round(obj.value).toString();
          },
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        });
      });
    },
    { scope: statsRef }
  );

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <Reveal direction="left" className="relative">
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-glass)] aspect-[4/3]">
              <Image
                src="/images/about.jpg"
                alt="Siri Enterprises — premium window installation workshop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Decorative corner accent */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-gold-500 rounded-tl-[var(--radius-lg)]" />
            </div>
          </Reveal>

          {/* Text */}
          <div>
            <Reveal>
              <p className="section-label">{aboutContent.sectionLabel}</p>
              <h2
                className="mb-6"
                style={{
                  fontSize: "var(--text-h1)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {aboutContent.heading}
              </h2>
            </Reveal>
            {aboutContent.paragraphs.map((p, i) => (
              <Reveal key={i} delay={0.1 * (i + 1)}>
                <p
                  className="text-slate-600 mb-4"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {p}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 lg:mt-20 pt-10 border-t border-blue-200"
        >
          {aboutContent.stats.map((stat, i) => (
            <Reveal key={i} delay={0.1 * i}>
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-0.5">
                  <span
                    className="stat-value text-navy-900 font-bold"
                    style={{
                      fontSize: "var(--text-h1)",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    0
                  </span>
                  <span
                    className="text-gold-500 font-bold"
                    style={{ fontSize: "var(--text-h2)" }}
                  >
                    {stat.suffix}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
