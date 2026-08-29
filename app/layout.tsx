import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import LanguageProvider from "@/components/providers/LanguageProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingButtons from "@/components/ui/FloatingButtons";
import { siteMeta } from "@/lib/content";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteMeta.name} - ${siteMeta.tagline}`,
    template: `%s | ${siteMeta.name}`,
  },
  description: siteMeta.description,
  keywords: [
    "UPVC windows",
    "Aluminium windows",
    "UPVC doors",
    "Aluminium doors",
    "Tanuku",
    "Andhra Pradesh",
    "Siri Enterprises",
    "Siri Windows",
    "sliding windows",
    "French doors",
    "casement windows",
    "energy efficient windows",
    "premium windows India",
  ],
  authors: [{ name: siteMeta.parentBrand }],
  openGraph: {
    title: `${siteMeta.name} - ${siteMeta.tagline}`,
    description: siteMeta.description,
    url: siteMeta.url,
    siteName: siteMeta.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteMeta.name} - ${siteMeta.tagline}`,
    description: siteMeta.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <SmoothScrollProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingButtons />
          </SmoothScrollProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
