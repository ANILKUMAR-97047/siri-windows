// ============================================================
// Siri Windows — Centralized Content
// ============================================================
// All site copy lives here so it's easy to edit without
// touching component code. Search for "TODO:" to find
// placeholders that need real data.
// ============================================================

// ------ Type Definitions ------

export interface NavLink {
  label: string;
  href: string;
}

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export interface Product {
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string; // lucide icon name
}

export interface Feature {
  title: string;
  description: string;
  icon: string; // lucide icon name
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  location: string;
  rating: number; // 1-5
  quote: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  category: "windows" | "doors" | "residential" | "commercial";
  width: number;
  height: number;
}

export interface ContactInfo {
  phones: string[];
  address: string;
  businessHours: string;
  mapEmbedUrl: string;
  whatsappNumber: string;
}

// ------ Site Meta ------

export const siteMeta = {
  name: "Siri Windows",
  parentBrand: "Siri Enterprises",
  tagline: "Windows, Better View.",
  description:
    "Premium UPVC & Aluminium Windows and Doors by Siri Enterprises. Expert craftsmanship, energy efficiency, and unmatched durability for homes and businesses in Tanuku, Andhra Pradesh.",
  url: "https://siriwindows.in", // TODO: replace with real domain
};

// ------ Navigation ------

export const navLinks: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Why Us", href: "#why-us" },
  { label: "Process", href: "#process" },
  { label: "Gallery", href: "#gallery" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

// ------ Contact ------

export const contactInfo: ContactInfo = {
  phones: ["9985168003", "7780127475"],
  address: "Bus Stand Road, Flyover Bridge, Pydiparru - Tanuku, Andhra Pradesh, India",
  businessHours: "Mon – Sat: 9:00 AM – 7:00 PM | Sun: By Appointment",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15303.!2d81.68!3d16.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sTanuku!5e0!3m2!1sen!2sin!4v1700000000000", // TODO: replace with exact Google Maps embed URL
  whatsappNumber: "919985168003",
};

// ------ Hero ------

export const heroContent = {
  headline: "Windows, Better View.",
  subheadline:
    "Premium UPVC & Aluminium Windows and Doors — engineered for elegance, built for endurance.",
  ctaPrimary: "Get Free Quote",
  ctaSecondary: "View Our Work",
  badges: [
    { icon: "Award", label: "Premium Windows" },
    { icon: "Shield", label: "Durability & Security" },
    { icon: "Zap", label: "Energy Efficiency" },
  ],
};

// ------ About ------

export const aboutContent = {
  sectionLabel: "About Us",
  heading: "Crafting Better Views Since Day One",
  paragraphs: [
    "Siri Enterprises, based in Pydiparru-Tanuku, is a trusted name in premium UPVC and Aluminium windows and doors. We combine cutting-edge European technology with meticulous Indian craftsmanship to deliver products that transform spaces.",
    "Every window and door we create is tailored to your home's unique architecture, ensuring a perfect fit, superior insulation, and lasting beauty. Our commitment to quality and customer satisfaction has made us the preferred choice for homeowners and builders across West Godavari district.",
  ],
  // TODO: confirm real numbers
  stats: [
    { value: 10, suffix: "+", label: "Years Experience" },
    { value: 500, suffix: "+", label: "Projects Completed" },
    { value: 450, suffix: "+", label: "Happy Clients" },
    { value: 2000, suffix: "+", label: "Products Installed" },
  ] as Stat[],
};

// ------ Products ------

export const productsContent = {
  sectionLabel: "Our Products",
  heading: "Windows & Doors, Perfected",
  subheading: "Explore our range of premium UPVC and Aluminium solutions designed for modern living.",
  products: [
    {
      slug: "upvc-windows",
      name: "UPVC Windows",
      description:
        "Multi-chambered profiles with superior thermal insulation and weatherproof seals for year-round comfort.",
      image: "/images/products/upvc-windows.jpg",
      icon: "LayoutGrid",
    },
    {
      slug: "aluminium-windows",
      name: "Aluminium Windows",
      description:
        "Sleek, slim-profile aluminium frames with powder-coated finishes for a contemporary aesthetic.",
      image: "/images/products/aluminium-windows.jpg",
      icon: "Maximize2",
    },
    {
      slug: "upvc-doors",
      name: "UPVC Doors",
      description:
        "Robust multi-point locking doors with reinforced steel cores for maximum security and insulation.",
      image: "/images/products/upvc-doors.jpg",
      icon: "DoorOpen",
    },
    {
      slug: "aluminium-doors",
      name: "Aluminium Doors",
      description:
        "Durable aluminium doors with anodized or wood-grain finishes, built for high-traffic areas.",
      image: "/images/products/aluminium-doors.jpg",
      icon: "DoorClosed",
    },
    {
      slug: "sliding-windows-doors",
      name: "Sliding Windows & Doors",
      description:
        "Smooth-glide tracks with panoramic glass panels — perfect for balconies and patios.",
      image: "/images/products/sliding.jpg",
      icon: "PanelLeftOpen",
    },
    {
      slug: "casement-windows",
      name: "Casement Windows",
      description:
        "Outward-opening hinged windows with 90° ventilation and multi-point locking for security.",
      image: "/images/products/casement.jpg",
      icon: "PanelTop",
    },
    {
      slug: "french-doors",
      name: "French Doors",
      description:
        "Elegant double-leaf doors with full-length glass panels that flood interiors with natural light.",
      image: "/images/products/french-doors.jpg",
      icon: "Columns2",
    },
    {
      slug: "custom-solutions",
      name: "Custom Solutions",
      description:
        "Bespoke designs tailored to your architecture — arches, bay windows, bi-folds, and more.",
      image: "/images/products/custom.jpg",
      icon: "Wrench",
    },
  ] as Product[],
};

// ------ Why Choose Us ------

export const whyUsContent = {
  sectionLabel: "Why Choose Us",
  heading: "The Siri Windows Advantage",
  features: [
    {
      title: "Premium Quality Materials",
      description:
        "We use only the finest UPVC profiles and aluminium alloys, sourced from certified manufacturers for lasting performance.",
      icon: "Gem",
    },
    {
      title: "Durability & Security",
      description:
        "Multi-point locking systems, reinforced steel cores, and weatherproof seals ensure your home stays safe and sound.",
      icon: "ShieldCheck",
    },
    {
      title: "Energy Efficiency",
      description:
        "Superior thermal insulation reduces heat transfer by up to 70%, cutting your electricity bills significantly.",
      icon: "Leaf",
    },
    {
      title: "Custom Fit & Installation",
      description:
        "Every product is precision-measured and custom-fabricated for a flawless fit. Our trained installers ensure perfection.",
      icon: "Ruler",
    },
    {
      title: "Low Maintenance",
      description:
        "UV-resistant finishes and corrosion-proof materials mean your windows stay beautiful with minimal upkeep.",
      icon: "Sparkles",
    },
    {
      title: "Noise Reduction",
      description:
        "Double-sealed chambers and laminated glass options reduce external noise by up to 40dB for peaceful interiors.",
      icon: "VolumeX",
    },
  ] as Feature[],
};

// ------ Process ------

export const processContent = {
  sectionLabel: "Our Process",
  heading: "From Vision to Reality",
  steps: [
    {
      number: 1,
      title: "Consultation",
      description: "Share your requirements and we'll help you choose the perfect window and door solutions for your space.",
      icon: "MessageSquare",
    },
    {
      number: 2,
      title: "Measurement",
      description: "Our team visits your site for precise measurements, ensuring a flawless custom fit.",
      icon: "Ruler",
    },
    {
      number: 3,
      title: "Custom Fabrication",
      description: "Your products are manufactured to exact specifications using premium materials and advanced machinery.",
      icon: "Factory",
    },
    {
      number: 4,
      title: "Installation",
      description: "Trained professionals install your windows and doors with precision, care, and minimal disruption.",
      icon: "Hammer",
    },
    {
      number: 5,
      title: "After-Sales Support",
      description: "We stand behind our work with warranty coverage and responsive after-sales service.",
      icon: "HeadphonesIcon",
    },
  ] as ProcessStep[],
};

// ------ Gallery ------
// TODO: replace with real installation photos

export const galleryContent = {
  sectionLabel: "Gallery",
  heading: "Our Craftsmanship",
  filters: ["All", "Windows", "Doors"] as const,
  images: [
    { src: "/images/gallery/gallery-1.jpg", alt: "Modern UPVC window installation in a residential villa", category: "windows" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-2.jpg", alt: "Aluminium sliding door for a contemporary living room", category: "doors" as const, width: 600, height: 800 },
    { src: "/images/gallery/gallery-3.jpg", alt: "Casement windows in a modern apartment bedroom", category: "windows" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-4.jpg", alt: "French doors opening to a garden patio", category: "doors" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-5.jpg", alt: "Large bay window installation in a luxury home", category: "windows" as const, width: 600, height: 800 },
    { src: "/images/gallery/gallery-6.jpg", alt: "UPVC entrance door with decorative glass panels", category: "doors" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-7.jpg", alt: "Panoramic sliding windows overlooking a garden", category: "windows" as const, width: 800, height: 500 },
    { src: "/images/gallery/gallery-8.jpg", alt: "Modern aluminium folding doors in an open-plan home", category: "doors" as const, width: 800, height: 600 },
  ] satisfies GalleryImage[],
};

// ------ Testimonials ------
// TODO: replace with real client testimonials

export const testimonialsContent = {
  sectionLabel: "Testimonials",
  heading: "What Our Clients Say",
  testimonials: [
    {
      name: "Rajesh Kumar",
      location: "Tanuku",
      rating: 5,
      quote:
        "Siri Enterprises transformed our home with their UPVC windows. The noise reduction is remarkable — our home feels like a sanctuary now. Highly recommend their quality and service.",
    },
    {
      name: "Priya Devi",
      location: "Bhimavaram",
      rating: 5,
      quote:
        "We chose Siri Windows for our new construction and couldn't be happier. The aluminium sliding doors are stunning, and the installation was flawless. Great value for money.",
    },
    {
      name: "Venkata Rao",
      location: "Eluru",
      rating: 5,
      quote:
        "Professional service from start to finish. The team measured everything precisely and the custom casement windows fit perfectly. Our electricity bills have noticeably dropped.",
    },
    {
      name: "Lakshmi Narayana",
      location: "Tadepalligudem",
      rating: 4,
      quote:
        "Excellent craftsmanship and durable products. The French doors they installed for our living room are beautiful and let in so much natural light. Very satisfied with the after-sales support.",
    },
    {
      name: "Suresh Babu",
      location: "Narsapuram",
      rating: 5,
      quote:
        "After getting quotes from multiple vendors, Siri Enterprises offered the best quality at competitive prices. The UPVC doors are incredibly sturdy and look premium.",
    },
  ] as Testimonial[],
};

// ------ CTA Banner ------

export const ctaBannerContent = {
  heading: "Ready to Upgrade Your View?",
  subheading:
    "Get a free, no-obligation quote for your home or commercial project. Our experts will guide you to the perfect solution.",
  cta: "Get Your Free Quote",
};

// ------ Contact Form ------

export const contactFormContent = {
  sectionLabel: "Contact Us",
  heading: "Let's Start Your Project",
  productOptions: [
    "UPVC Windows",
    "Aluminium Windows",
    "UPVC Doors",
    "Aluminium Doors",
    "Sliding Windows & Doors",
    "Casement Windows",
    "French Doors",
    "Custom Solution",
    "Other / Not Sure",
  ],
};
