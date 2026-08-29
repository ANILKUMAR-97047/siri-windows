"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { testimonialsContent } from "@/lib/content";

export default function TestimonialsSection() {
  const { testimonials } = testimonialsContent;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const touchStartX = useRef(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, [testimonials.length]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, next]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  };

  return (
    <section id="testimonials" className="section-padding bg-off-white">
      <div className="container-wide">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Reveal>
            <p className="section-label">
              {testimonialsContent.sectionLabel}
            </p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {testimonialsContent.heading}
            </h2>
          </Reveal>
        </div>

        {/* Carousel */}
        <div
          className="relative max-w-3xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {testimonials.map((testimonial, i) => (
                <div
                  key={i}
                  className="w-full shrink-0 px-4"
                >
                  <div className="bg-white rounded-[var(--radius-lg)] p-8 md:p-10 shadow-[var(--shadow-card)] text-center">
                    {/* Stars */}
                    <div className="flex items-center justify-center gap-1 mb-5">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`w-4 h-4 ${
                            si < testimonial.rating
                              ? "text-gold-500 fill-gold-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote
                      className="text-slate-700 leading-relaxed mb-6 italic"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <div>
                      <p
                        className="font-semibold text-navy-950"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-6 bg-white rounded-full shadow-[var(--shadow-card)] p-2 text-navy-800 hover:text-navy-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-6 bg-white rounded-full shadow-[var(--shadow-card)] p-2 text-navy-800 hover:text-navy-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 min-h-[20px] min-w-[20px] flex items-center justify-center ${
                  i === current
                    ? "bg-navy-900 scale-110"
                    : "bg-navy-900/20 hover:bg-navy-900/40"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-2.5 h-2.5 bg-navy-900"
                      : "w-2 h-2 bg-navy-900/20"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
