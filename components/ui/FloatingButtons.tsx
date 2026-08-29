"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useContent } from "@/components/providers/LanguageProvider";

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M16.01 3.2c-7.05 0-12.78 5.7-12.78 12.72 0 2.43.69 4.8 1.99 6.84L3.1 30.8l8.24-2.1a12.9 12.9 0 0 0 4.67.88c7.05 0 12.78-5.7 12.78-12.72S23.06 3.2 16.01 3.2Zm0 23.96c-1.47 0-2.9-.29-4.25-.86l-.3-.13-4.9 1.25 1.27-4.76-.17-.31a11.16 11.16 0 0 1-1.72-5.93c0-5.69 4.52-10.31 10.07-10.31s10.07 4.62 10.07 10.31-4.52 10.74-10.07 10.74Z"
      />
      <path
        fill="currentColor"
        d="M21.7 18.7c-.31-.16-1.84-.91-2.12-1.02-.28-.1-.49-.15-.69.16-.2.31-.8 1.02-.98 1.23-.18.21-.36.23-.67.08-.31-.16-1.31-.48-2.5-1.54a9.4 9.4 0 0 1-1.72-2.14c-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.15-.18.2-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.69-1.66-.94-2.27-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.54.08-.82.39-.28.31-1.08 1.05-1.08 2.57 0 1.52 1.11 2.99 1.26 3.19.15.21 2.18 3.33 5.28 4.67.74.32 1.31.51 1.76.65.74.23 1.41.2 1.94.12.59-.09 1.84-.75 2.1-1.48.26-.73.26-1.35.18-1.48-.08-.13-.28-.21-.59-.36Z"
      />
    </svg>
  );
}

export default function FloatingButtons() {
  const { contactInfo, whatsappMessage } = useContent();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const whatsappUrl = `https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <>
      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform duration-300 hover:scale-105 focus-visible:scale-105"
        aria-label="Chat on WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-[#25d366] opacity-25 animate-ping" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg">
          <WhatsAppIcon />
        </span>
      </a>

      {/* Back to Top */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-24 z-50 w-11 h-11 rounded-full bg-navy-900/80 backdrop-blur-sm text-white flex items-center justify-center shadow-lg hover:bg-navy-800 transition-all duration-300 ${
          showBackToTop
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </>
  );
}
