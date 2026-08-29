"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Award, Shield, Zap, ChevronDown } from "lucide-react";
import { useContent } from "@/components/providers/LanguageProvider";
import { prefersReducedMotion } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

const badgeIcons: Record<string, React.ReactNode> = {
  Award: <Award className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
};

export default function HeroSection() {
  const { heroContent } = useContent();
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Ken Burns background zoom
      if (bgRef.current) {
        gsap.to(bgRef.current, {
          scale: 1.1,
          duration: 20,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
      }

      // Headline word-by-word reveal
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll(".hero-word");
        tl.fromTo(
          words,
          { y: 60, opacity: 0, rotateX: -15 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.12 },
          0.3
        );
      }

      // Sub-headline
      if (subRef.current) {
        tl.fromTo(
          subRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.3"
        );
      }

      // CTAs
      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
          "-=0.3"
        );
      }

      // Badges
      if (badgesRef.current) {
        tl.fromTo(
          badgesRef.current.children,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
          "-=0.2"
        );
      }
    },
    { scope: sectionRef }
  );

  // Split headline into words for animation
  const headlineWords = heroContent.headline.split(" ");

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0">
        <div
          ref={bgRef}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
            transform: "scale(1.02)",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-950/60 to-navy-950/85" />
        {/* Window pane pattern */}
        <div className="absolute inset-0 window-pane-pattern opacity-[0.02]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container-wide text-center px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-white mb-6"
            style={{
              fontSize: "var(--text-hero)",
              fontFamily: "var(--font-heading)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {headlineWords.map((word, i) => (
              <span
                key={i}
                className="hero-word inline-block mr-[0.3em]"
                style={{ perspective: "400px" }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Sub-headline */}
          <p
            ref={subRef}
            className="text-white/75 max-w-2xl mx-auto mb-10"
            style={{ fontSize: "var(--text-body)", lineHeight: 1.7 }}
          >
            {heroContent.subheadline}
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="#contact"
              className="inline-flex items-center px-8 py-3.5 text-base font-semibold rounded-lg bg-gold-500 text-navy-950 hover:bg-gold-400 transition-all duration-200 hover:shadow-xl hover:shadow-gold-500/20 min-h-[44px]"
            >
              {heroContent.ctaPrimary}
            </Link>
            <Link
              href="#gallery"
              className="inline-flex items-center px-8 py-3.5 text-base font-semibold rounded-lg border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200 min-h-[44px]"
            >
              {heroContent.ctaSecondary}
            </Link>
          </div>

          {/* Trust Badges */}
          <div
            ref={badgesRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8"
          >
            {heroContent.badges.map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-white/70"
              >
                <span className="text-gold-500">
                  {badgeIcons[badge.icon]}
                </span>
                <span className="text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <Link href="#about" aria-label="Scroll to about section">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </Link>
      </div>
    </section>
  );
}
