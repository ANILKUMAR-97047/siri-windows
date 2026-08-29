"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { navLinks, contactInfo } from "@/lib/content";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Scroll listener for navbar background transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
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
      <nav className="container-wide flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link
          href="#home"
          className={`transition-colors duration-300 ${
            isScrolled ? "text-navy-950" : "text-white"
          }`}
          aria-label="Siri Enterprises - Home"
        >
          <Logo />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
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

        {/* Desktop Right: Phone + CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href={`tel:${contactInfo.phones[0]}`}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
              isScrolled ? "text-navy-800" : "text-white/90"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="hidden lg:inline">{contactInfo.phones[0]}</span>
          </a>
          <Link
            href="#contact"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-all duration-200 hover:shadow-lg"
          >
            Get Free Quote
          </Link>
        </div>

        {/* Mobile: Phone + Hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <a
            href={`tel:${contactInfo.phones[0]}`}
            className={`p-2 rounded-lg transition-colors ${
              isScrolled ? "text-navy-800" : "text-white"
            }`}
            aria-label="Call us"
          >
            <Phone className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              isScrolled ? "text-navy-800" : "text-white"
            }`}
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
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
            <Link
              href="#home"
              onClick={handleNavClick}
              className="text-white"
              aria-label="Siri Enterprises Home"
            >
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

          <div className="mt-10 flex flex-1 flex-col">
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
                Get Free Quote
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
