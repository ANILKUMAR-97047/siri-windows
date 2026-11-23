import { siteMeta, contactInfo, faqContent, productsContent } from "@/lib/content";

export default function JsonLd() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${siteMeta.url}/#business`,
    name: siteMeta.name,
    legalName: siteMeta.parentBrand,
    url: siteMeta.url,
    logo: `${siteMeta.url}/images/siri-windows-logo.png`,
    image: `${siteMeta.url}/images/hero-bg.jpg`,
    description: siteMeta.description,
    telephone: `+91${contactInfo.phones[0]}`,
    email: "contact@siriwindows.in",
    priceRange: "₹₹ - ₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, Bank Transfer, UPI",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Bus Stand Road, Flyover Bridge, Pydiparru",
      addressLocality: "Tanuku",
      addressRegion: "Andhra Pradesh",
      postalCode: "534211",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 16.7565,
      longitude: 81.6811,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    areaServed: [
      { "@type": "City", name: "Tanuku" },
      { "@type": "City", name: "Bhimavaram" },
      { "@type": "City", name: "Tadepalligudem" },
      { "@type": "City", name: "Eluru" },
      { "@type": "City", name: "Rajahmundry" },
      { "@type": "AdministrativeArea", name: "West Godavari" },
      { "@type": "AdministrativeArea", name: "East Godavari" },
      { "@type": "State", name: "Andhra Pradesh" },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "UPVC & Aluminium Windows and Doors",
      itemListElement: productsContent.products.map((prod, index) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: prod.name,
          description: prod.description,
          url: `${siteMeta.url}/#products`,
        },
      })),
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "450",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqContent.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteMeta.url}/#website`,
    url: siteMeta.url,
    name: siteMeta.name,
    description: siteMeta.description,
    publisher: {
      "@id": `${siteMeta.url}/#business`,
    },
    inLanguage: ["en-IN", "te-IN", "hi-IN"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
