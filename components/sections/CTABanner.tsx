import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ctaBannerContent } from "@/lib/content";

export default function CTABanner() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
      {/* Animated background layers */}
      <div className="absolute inset-0 window-pane-pattern opacity-[0.03]" />
      <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-blue-400/5" />

      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

      <div className="relative container-wide text-center">
        <Reveal>
          <h2
            className="!text-white mb-4"
            style={{
              fontSize: "var(--text-h1)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {ctaBannerContent.heading}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p
            className="text-white/70 max-w-xl mx-auto mb-8"
            style={{ fontSize: "var(--text-body)" }}
          >
            {ctaBannerContent.subheading}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <Link
            href="#contact"
            className="inline-flex items-center px-10 py-4 text-base font-semibold rounded-lg bg-gold-500 text-navy-950 hover:bg-gold-400 transition-all duration-200 hover:shadow-xl hover:shadow-gold-500/20 min-h-[44px]"
          >
            {ctaBannerContent.cta}
          </Link>
        </Reveal>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
    </section>
  );
}
