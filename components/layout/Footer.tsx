import Link from "next/link";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import Logo from "./Logo";
import { navLinks, contactInfo, productsContent, siteMeta } from "@/lib/content";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-navy-950 text-white/80 overflow-hidden">
      {/* Window pane pattern overlay */}
      <div className="absolute inset-0 window-pane-pattern pointer-events-none" />

      <div className="relative container-wide py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo className="text-white mb-4" />
            <p className="text-sm leading-relaxed text-white/60 max-w-xs mt-3">
              Premium UPVC & Aluminium Windows and Doors — engineered for
              elegance, built for endurance. Serving homes and businesses across
              West Godavari and beyond.
            </p>
            <p className="mt-4 text-xs text-gold-500 font-semibold tracking-widest uppercase">
              {siteMeta.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-gold-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Products
            </h3>
            <ul className="space-y-2.5">
              {productsContent.products.slice(0, 7).map((product) => (
                <li key={product.slug}>
                  <Link
                    href="#products"
                    className="text-sm text-white/60 hover:text-gold-400 transition-colors"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-gold-500 shrink-0" />
                <span className="text-sm text-white/60">
                  {contactInfo.address}
                </span>
              </li>
              {contactInfo.phones.map((phone) => (
                <li key={phone} className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gold-500 shrink-0" />
                  <a
                    href={`tel:${phone}`}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    +91 {phone}
                  </a>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-gold-500 shrink-0" />
                <span className="text-sm text-white/60">
                  {contactInfo.businessHours}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold-500 shrink-0" />
                {/* TODO: replace with real email */}
                <a
                  href="mailto:info@siriwindows.in"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  info@siriwindows.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>
            © {currentYear} {siteMeta.parentBrand}. All rights reserved.
          </p>
          <p className="text-gold-500/60 font-medium tracking-wider uppercase text-[0.65rem]">
            {siteMeta.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
