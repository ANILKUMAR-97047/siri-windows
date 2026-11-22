import type { Metadata } from "next";
import { Poppins, Manrope } from "next/font/google";
import "./globals.css";
import { siteMeta } from "@/lib/content";
import { ToastProvider } from "@/components/ui/ToastProvider";
import QueryProvider from "@/components/providers/QueryProvider";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${manrope.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
