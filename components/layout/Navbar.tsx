"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, Menu, X, Languages, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function LanguageSelect({ isScrolled = true }: { isScrolled?: boolean }) {
  const { language, setLanguage, languages, content } = useLanguage();
  const activeLanguage = languages.find((item) => item.code === language) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            isScrolled
              ? "border-navy-900/15 bg-white text-navy-900 hover:bg-blue-100"
              : "border-white/25 bg-white/10 text-white hover:bg-white/15"
          }`}
          aria-label={content.languageLabel}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden xs:inline">{activeLanguage.label}</span>
          <span className="xs:hidden">{activeLanguage.shortLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-75" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
          {languages.map((item) => (
            <DropdownMenuRadioItem key={item.code} value={item.code}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar() {
  const { content } = useLanguage();
  const { navLinks, contactInfo, heroContent } = content;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-[var(--shadow-nav)]"
          : "bg-transparent"
      }`}
    >
      <nav className="container-wide flex h-16 items-center justify-between md:h-20">
        <Link href="#home" aria-label="Siri Enterprises - Home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-5 lg:gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 hover:text-gold-500 ${
                isScrolled ? "text-navy-800" : "text-white/90"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSelect isScrolled={isScrolled} />
          <a
            href={`tel:${contactInfo.phones[0]}`}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
              isScrolled ? "text-navy-800" : "text-white/90"
            }`}
          >
            <Phone className="h-4 w-4" />
            <span className="hidden xl:inline">{contactInfo.phones[0]}</span>
          </a>
          <Link
            href="#contact"
            className="inline-flex min-h-[42px] items-center rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-navy-800 hover:shadow-lg"
          >
            {heroContent.ctaPrimary}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSelect isScrolled={isScrolled} />
          <a
            href={`tel:${contactInfo.phones[0]}`}
            className={`rounded-lg p-2 transition-colors ${
              isScrolled ? "text-navy-800" : "text-white"
            }`}
            aria-label="Call us"
          >
            <Phone className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`rounded-lg p-2 transition-colors ${
              isScrolled ? "text-navy-800" : "text-white"
            }`}
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[60] md:hidden ${
          isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 bg-navy-950/55 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          id="mobile-navigation"
          className={`absolute right-0 top-0 flex h-dvh w-[min(86vw,22rem)] flex-col bg-navy-950 px-6 py-5 text-white shadow-2xl transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between">
            <Link href="#home" onClick={handleNavClick} aria-label="Siri Enterprises Home">
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-8">
            <LanguageSelect isScrolled={false} />
          </div>

          <div className="mt-8 flex flex-1 flex-col">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleNavClick}
                  className="flex min-h-[48px] items-center border-b border-white/10 text-xl font-medium text-white/90 transition-colors hover:text-gold-400"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4 pt-8">
              <a
                href={`tel:${contactInfo.phones[0]}`}
                className="flex min-h-[44px] items-center gap-2 text-base font-medium text-white/80"
              >
                <Phone className="h-5 w-5 text-gold-400" />
                {contactInfo.phones[0]}
              </a>
              <Link
                href="#contact"
                onClick={handleNavClick}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-gold-500 px-6 py-3 text-base font-semibold text-navy-950 transition-colors hover:bg-gold-400"
              >
                {heroContent.ctaPrimary}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
