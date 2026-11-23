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
  metadataBase: new URL(siteMeta.url),
  title: {
    default: "Siri Windows | Premium UPVC & Aluminium Windows and Doors in Tanuku, AP",
    template: `%s | ${siteMeta.name}`,
  },
  description:
    "Leading manufacturer & installer of premium UPVC and Aluminium windows and doors in Tanuku, West Godavari. Soundproof DGU glass, cyclone-resistant, European technology with 10-year warranty. Get your free site quote!",
  keywords: [
    "UPVC windows Tanuku",
    "Aluminium windows Tanuku",
    "UPVC doors Andhra Pradesh",
    "Aluminium sliding doors",
    "best window manufacturer West Godavari",
    "Siri Windows Tanuku",
    "Siri Enterprises Pydiparru",
    "casement windows Bhimavaram",
    "soundproof acoustic windows Tadepalligudem",
    "French doors Eluru",
    "folding sliding doors Rajahmundry",
    "UPVC window price Andhra Pradesh",
    "energy efficient double glazed windows",
    "DGU glass windows",
    "mosquito mesh sliding windows",
    "commercial aluminium facade",
    "residential villa windows India",
    "architectural aluminium doors",
    "cyclone resistant windows AP",
  ],
  authors: [{ name: siteMeta.parentBrand }, { name: siteMeta.name }],
  creator: siteMeta.parentBrand,
  publisher: siteMeta.name,
  alternates: {
    canonical: siteMeta.url,
    languages: {
      "en-IN": `${siteMeta.url}?lang=en`,
      "te-IN": `${siteMeta.url}?lang=te`,
      "hi-IN": `${siteMeta.url}?lang=hi`,
    },
  },
  openGraph: {
    title: "Siri Windows | Premium UPVC & Aluminium Windows & Doors in Tanuku",
    description:
      "Transform your space with premium UPVC & Aluminium windows and doors by Siri Enterprises, Tanuku. Built for elegance, energy efficiency, and coastal durability.",
    url: siteMeta.url,
    siteName: siteMeta.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Siri Windows - Premium UPVC & Aluminium Windows and Doors in Tanuku",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Siri Windows | UPVC & Aluminium Windows and Doors",
    description:
      "Premium UPVC & Aluminium Windows and Doors engineered for elegance and endurance in Tanuku, Andhra Pradesh.",
    images: ["/images/hero-bg.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "IN-AP",
    "geo.placename": "Tanuku",
    "geo.position": "16.7565;81.6811",
    ICBM: "16.7565, 81.6811",
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
