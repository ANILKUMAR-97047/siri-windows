"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Phone } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/providers/LanguageProvider";

export default function FAQSection() {
  const { faqContent, contactInfo } = useContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const whatsappLink = `https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(
    "Hi Siri Windows, I have a question regarding UPVC & Aluminium windows."
  )}`;
  const phoneLink = `tel:${contactInfo.phones[0]?.replace(/\s+/g, "") || "9985168003"}`;

  return (
    <section id="faq" className="section-padding bg-white relative overflow-hidden">
      {/* Subtle decorative background gradient */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="container-wide relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Reveal>
            <p className="section-label">{faqContent.sectionLabel}</p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
              className="text-navy-950 font-bold"
            >
              {faqContent.heading}
            </h2>
            {faqContent.subheading && (
              <p className="text-slate-600 mt-4 text-base md:text-lg leading-relaxed">
                {faqContent.subheading}
              </p>
            )}
          </Reveal>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3.5">
          {faqContent.items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <Reveal key={index} delay={index * 0.05}>
                <div
                  className={`rounded-2xl transition-all duration-300 border ${
                    isOpen
                      ? "border-amber-500/40 bg-amber-50/20 shadow-sm"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4 cursor-pointer select-none group"
                  >
                    <span className="font-semibold text-navy-950 text-base md:text-lg group-hover:text-amber-700 transition-colors duration-200">
                      {item.question}
                    </span>
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? "bg-amber-500 text-white rotate-180 shadow-xs"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {/* Smooth height accordion transition using CSS Grid */}
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 md:px-6 md:pb-6 pt-1 text-slate-600 leading-relaxed text-sm md:text-base border-t border-slate-100/80 mt-1">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Still have questions? Call / WhatsApp card */}
        <Reveal delay={0.3}>
          <div className="max-w-3xl mx-auto mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/10">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-white">Have a different question?</h4>
                <p className="text-slate-300 text-sm mt-0.5">
                  Talk directly with our fabrication engineers for personalized advice.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={phoneLink}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 text-sm font-semibold transition-colors duration-200 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
