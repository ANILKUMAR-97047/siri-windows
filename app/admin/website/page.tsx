"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Phone,
  Building,
  TrendingUp,
  Package,
  MessageSquare,
  Megaphone,
  ShieldCheck,
  CheckCircle,
  Plus,
  Trash2,
  Star,
  Pencil,
  X,
  Loader2,
  Languages,
  HelpCircle,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";
import { contentByLanguage, type LanguageCode } from "@/lib/content";

type SectionTab =
  | "hero"
  | "about"
  | "stats"
  | "contact"
  | "products"
  | "testimonials"
  | "cta"
  | "why_us"
  | "process"
  | "faq";

export default function WebsiteContentPage() {
  const [activeTab, setActiveTab] = useState<SectionTab>("hero");
  const [editingLang, setEditingLang] = useState<LanguageCode>("en");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Translations state for Telugu (te) and Hindi (hi)
  const [translations, setTranslations] = useState<{
    te: Record<string, any>;
    hi: Record<string, any>;
  }>({
    te: {},
    hi: {},
  });

  // 1. Hero Banner State
  const [heroData, setHeroData] = useState({
    badgeText: "Tanuku's Premier Architectural Partner",
    heading: "Windows, Better View.",
    subheading:
      "Premium UPVC & Aluminium Windows and Doors - engineered for elegance, built for endurance.",
    ctaText: "Get Free Quote",
    ctaLink: "#contact",
    secondaryText: "View Our Work",
    secondaryLink: "#gallery",
    badges: [
      { icon: "Award", label: "Premium Windows" },
      { icon: "Shield", label: "Durability & Security" },
      { icon: "Zap", label: "Energy Efficiency" },
    ],
  });

  // 2. About Us State
  const [aboutData, setAboutData] = useState({
    sectionLabel: "About Us",
    heading: "Crafting Better Views Since Day One",
    tagline: "Custom-built with German technology, tested for cyclonic coastal winds.",
    story:
      "Siri Enterprises, based in Pydiparru-Tanuku, is a trusted name in premium UPVC and Aluminium windows and doors. We combine advanced European technology with careful Indian craftsmanship to deliver products that transform spaces.",
  });

  // 3. Live Statistics State
  const [statsData, setStatsData] = useState({
    yearsExperience: 10,
    projectsCompleted: 500,
    happyClients: 450,
    districtsCovered: 8,
  });

  // 4. Contact Details State
  const [contactData, setContactData] = useState({
    phonePrimary: "+91 99851 68003",
    phoneSecondary: "+91 77801 27475",
    whatsappNumber: "919985168003",
    email: "contact@siriwindows.in",
    address: "Bus Stand Road, Flyover Bridge, Pydiparru - Tanuku, Andhra Pradesh, India",
    businessHours: "Mon - Sat: 9:00 AM - 7:00 PM | Sun: By Appointment",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15303.!2d81.68!3d16.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sTanuku!5e0!3m2!1sen!2sin!4v1700000000000",
  });

  // 5. Products State
  const [productsData, setProductsData] = useState({
    heading: "Windows & Doors, Perfected",
    subheading: "Explore our range of premium UPVC and Aluminium solutions designed for modern living.",
    items: [
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
          "Sleek aluminium frames with powder-coated finishes for a clean contemporary look.",
        image: "/images/products/aluminium-windows.jpg",
        icon: "Maximize2",
      },
      {
        slug: "upvc-doors",
        name: "UPVC Doors",
        description:
          "Strong multi-point locking doors with reinforced cores for better security and insulation.",
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
          "Smooth-glide tracks with wide glass panels, perfect for balconies and patios.",
        image: "/images/products/sliding.jpg",
        icon: "PanelLeftOpen",
      },
      {
        slug: "casement-windows",
        name: "Casement Windows",
        description:
          "Outward-opening hinged windows with wide ventilation and multi-point locking.",
        image: "/images/products/casement.jpg",
        icon: "PanelTop",
      },
      {
        slug: "french-doors",
        name: "French Doors",
        description:
          "Elegant double-leaf doors with full-length glass panels that brighten interiors.",
        image: "/images/products/french-doors.jpg",
        icon: "Columns2",
      },
      {
        slug: "custom-solutions",
        name: "Custom Solutions",
        description:
          "Bespoke designs tailored to your architecture, including arches, bay windows, bi-folds, and more.",
        image: "/images/products/custom.jpg",
        icon: "Wrench",
      },
    ],
  });

  // 6. Testimonials State
  const [testimonialsData, setTestimonialsData] = useState({
    heading: "What Our Clients Say",
    items: [
      {
        name: "Rajesh Kumar",
        location: "Tanuku",
        rating: 5,
        quote:
          "Siri Enterprises transformed our home with their UPVC windows. The noise reduction is remarkable and the service was excellent.",
      },
      {
        name: "Priya Devi",
        location: "Bhimavaram",
        rating: 5,
        quote:
          "We chose Siri Windows for our new construction. The aluminium sliding doors look beautiful and the installation was flawless.",
      },
      {
        name: "Venkata Rao",
        location: "Eluru",
        rating: 5,
        quote:
          "Professional service from start to finish. The team measured everything precisely and the windows fit perfectly.",
      },
      {
        name: "Lakshmi Narayana",
        location: "Tadepalligudem",
        rating: 4,
        quote:
          "Excellent craftsmanship and durable products. The French doors bring so much natural light into our living room.",
      },
      {
        name: "Suresh Babu",
        location: "Narsapuram",
        rating: 5,
        quote:
          "Siri Enterprises offered great quality at competitive prices. The UPVC doors are sturdy and look premium.",
      },
    ],
  });

  // 7. Promotional CTA Banner State
  const [ctaData, setCtaData] = useState({
    heading: "Ready to Upgrade Your View?",
    subheading:
      "Get a free, no-obligation quote for your home or commercial project. Our experts will guide you to the perfect solution.",
    ctaText: "Get Your Free Quote",
  });

  // 8. Why Choose Us State
  const [whyUsData, setWhyUsData] = useState({
    heading: "The Siri Windows Advantage",
    features: [
      {
        title: "Premium Quality Materials",
        description: "We use certified UPVC profiles and aluminium alloys for lasting performance.",
        icon: "Gem",
      },
      {
        title: "Durability & Security",
        description: "Multi-point locking systems and weatherproof seals help keep your home safe and sound.",
        icon: "ShieldCheck",
      },
      {
        title: "Energy Efficiency",
        description: "Superior insulation reduces heat transfer and can help lower electricity bills.",
        icon: "Leaf",
      },
      {
        title: "Custom Fit & Installation",
        description: "Every product is precision-measured and installed by trained professionals.",
        icon: "Ruler",
      },
      {
        title: "Low Maintenance",
        description: "UV-resistant and corrosion-proof materials keep your windows beautiful with minimal care.",
        icon: "Sparkles",
      },
      {
        title: "Noise Reduction",
        description: "Sealed chambers and glass options reduce outside noise for peaceful interiors.",
        icon: "VolumeX",
      },
    ],
  });

  // 9. 5-Step Process State
  const [processData, setProcessData] = useState({
    heading: "From Vision to Reality",
    steps: [
      {
        number: 1,
        title: "Consultation",
        description: "Share your needs and we will help you choose the right window and door solutions.",
        icon: "MessageSquare",
      },
      {
        number: 2,
        title: "Measurement",
        description: "Our team visits your site for precise measurements and a proper custom fit.",
        icon: "Ruler",
      },
      {
        number: 3,
        title: "Custom Fabrication",
        description: "Your products are manufactured to exact specifications using quality materials.",
        icon: "Factory",
      },
      {
        number: 4,
        title: "Installation",
        description: "Professionals install your windows and doors with care and precision.",
        icon: "Hammer",
      },
      {
        number: 5,
        title: "After-Sales Support",
        description: "We support you after installation with responsive service and warranty help.",
        icon: "HeadphonesIcon",
      },
    ],
  });

  // 10. FAQ Questions & Answers State
  const [faqData, setFaqData] = useState({
    sectionLabel: "Frequently Asked Questions",
    heading: "Got Questions? We Have Answers.",
    subheading:
      "Everything you need to know about our premium UPVC & Aluminium windows, doors, warranties, and installation process.",
    items: [
      {
        question:
          "What is the difference between UPVC and Aluminium windows? Which should I choose?",
        answer:
          "UPVC offers world-class thermal insulation, superior soundproofing (reduces outside traffic noise by up to 40dB), and 100% rust and termite resistance — ideal for bedrooms and living spaces. Aluminium delivers ultra-slim frames, maximum glass area for wide panoramic views, and exceptional structural rigidity for large openings and high wind zones. At Siri Windows, we help you pick the ideal combination for your home architecture.",
      },
      {
        question:
          "How long does manufacturing and installation take after placing an order?",
        answer:
          "Typically 7 to 10 working days from precision laser measurement to complete site installation. Custom architectural profiles or specialty double-glazed units (DGU) take around 10 to 14 days. Our certified in-house technicians ensure clean, hassle-free installation with zero damage to your finished paintwork.",
      },
      {
        question:
          "Are your windows resistant to heavy rains, coastal cyclones, and high winds?",
        answer:
          "Yes, 100%. Our profiles are reinforced with galvanized steel cores, multi-point locking mechanisms, and EPDM rubber weather-seals. They are tested to withstand high wind loads of up to 2,500 Pascals and torrential coastal monsoon rains without water leakage or frame rattling.",
      },
      {
        question:
          "Can I customize window sizes, glass types, and frame colors?",
        answer:
          "Absolutely! Every window and door is custom-fabricated to your exact millimeter dimensions. We offer clear, tinted, frosted, toughened safety glass, and acoustic double-glazed units (DGU), along with profile finishes including Classic White, Dark Walnut, Golden Oak woodgrain, and Charcoal Grey.",
      },
      {
        question:
          "What warranty do you provide on UPVC and Aluminium products?",
        answer:
          "We provide a 10-Year comprehensive warranty on our UPVC and Aluminium profiles against discoloration, cracking, warping, and peeling, plus a 5-Year warranty on European-grade multi-point hardware, rollers, hinges, and weather-seals.",
      },
      {
        question:
          "Do you provide free site visits and measurements in and around Tanuku?",
        answer:
          "Yes, we offer complimentary on-site consultations, laser measurements, and detailed cost estimates anywhere across Tanuku, Bhimavaram, Tadepalligudem, Eluru, Rajahmundry, and neighboring districts in West Godavari.",
      },
    ],
  });

  const updateField = (section: string, field: string, value: any) => {
    if (editingLang === "en") {
      if (section === "hero") setHeroData((p) => ({ ...p, [field]: value }));
      else if (section === "about") setAboutData((p) => ({ ...p, [field]: value }));
      else if (section === "cta") setCtaData((p) => ({ ...p, [field]: value }));
      else if (section === "products") setProductsData((p) => ({ ...p, [field]: value }));
      else if (section === "testimonials") setTestimonialsData((p) => ({ ...p, [field]: value }));
      else if (section === "why_us") setWhyUsData((p) => ({ ...p, [field]: value }));
      else if (section === "process") setProcessData((p) => ({ ...p, [field]: value }));
      else if (section === "contact") setContactData((p) => ({ ...p, [field]: value }));
      else if (section === "faq") setFaqData((p) => ({ ...p, [field]: value }));
    } else {
      setTranslations((prev) => ({
        ...prev,
        [editingLang]: {
          ...prev[editingLang],
          [section]: {
            ...(prev[editingLang]?.[section] || {}),
            [field]: value,
          },
        },
      }));
    }
  };

  const getFieldValue = (section: string, field: string, enValue: any) => {
    if (editingLang === "en") return enValue;
    return translations[editingLang]?.[section]?.[field] ?? "";
  };

  const loadDefaultTranslation = (section: SectionTab, lang: LanguageCode) => {
    if (lang === "en") return;
    const target = contentByLanguage[lang];
    if (!target) return;

    let sectionContent: any = null;
    if (section === "hero") {
      sectionContent = {
        badgeText: lang === "te" ? "తనుకులో విశ్వసనీయ భాగస్వామి" : "तनुकु का प्रमुख पार्टनर",
        heading: target.heroContent.headline,
        subheading: target.heroContent.subheadline,
        ctaText: target.heroContent.ctaPrimary,
        secondaryText: target.heroContent.ctaSecondary,
      };
    } else if (section === "about") {
      sectionContent = {
        sectionLabel: target.aboutContent.sectionLabel,
        heading: target.aboutContent.heading,
        story: target.aboutContent.paragraphs[0] || "",
        tagline: target.aboutContent.paragraphs[1] || "",
      };
    } else if (section === "cta") {
      sectionContent = {
        heading: target.ctaBannerContent.heading,
        subheading: target.ctaBannerContent.subheading,
        ctaText: target.ctaBannerContent.cta,
      };
    } else if (section === "products") {
      sectionContent = {
        heading: target.productsContent.heading,
        subheading: target.productsContent.subheading,
      };
    } else if (section === "why_us") {
      sectionContent = {
        heading: target.whyUsContent.heading,
      };
    } else if (section === "process") {
      sectionContent = {
        heading: target.processContent.heading,
      };
    } else if (section === "testimonials") {
      sectionContent = {
        heading: target.testimonialsContent.heading,
      };
    } else if (section === "contact") {
      sectionContent = {
        address: target.contactInfo.address,
        businessHours: target.contactInfo.businessHours,
      };
    } else if (section === "faq") {
      sectionContent = {
        sectionLabel: target.faqContent.sectionLabel,
        heading: target.faqContent.heading,
        subheading: target.faqContent.subheading,
        items: target.faqContent.items,
      };
    }

    if (sectionContent) {
      setTranslations((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          [section]: {
            ...(prev[lang]?.[section] || {}),
            ...sectionContent,
          },
        },
      }));
      toast.success(
        `Loaded verified ${lang === "te" ? "Telugu" : "Hindi"} text for ${section}! Click 'Save & Publish' to save.`,
        "Translation Loaded"
      );
    }
  };

  const [isTranslating, setIsTranslating] = useState(false);

  const autoTranslateCurrentSection = async () => {
    if (editingLang === "en") return;
    setIsTranslating(true);

    try {
      let dataToTranslate: any = null;
      if (activeTab === "hero") dataToTranslate = heroData;
      else if (activeTab === "about") dataToTranslate = aboutData;
      else if (activeTab === "cta") dataToTranslate = ctaData;
      else if (activeTab === "products") dataToTranslate = productsData;
      else if (activeTab === "why_us") dataToTranslate = whyUsData;
      else if (activeTab === "process") dataToTranslate = processData;
      else if (activeTab === "testimonials") dataToTranslate = testimonialsData;
      else if (activeTab === "faq") dataToTranslate = faqData;

      if (!dataToTranslate) {
        setIsTranslating(false);
        return;
      }

      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: activeTab,
          targetLang: editingLang,
          data: dataToTranslate,
        }),
      });

      const json = await res.json();
      if (json.translated) {
        setTranslations((prev) => ({
          ...prev,
          [editingLang]: {
            ...prev[editingLang],
            [activeTab]: {
              ...(prev[editingLang]?.[activeTab] || {}),
              ...json.translated,
            },
          },
        }));
        toast.success(
          `✨ Automatically translated ${activeTab} into ${editingLang === "te" ? "Telugu" : "Hindi"}!`,
          "Auto-Translation Complete"
        );
      }
    } catch {
      toast.error("Auto-translation failed. Please try again.", "Translation Error");
    } finally {
      setIsTranslating(false);
    }
  };

  // Fetch saved dynamic content from Supabase on mount
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/admin/website")
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const loadedTranslations: { te: Record<string, any>; hi: Record<string, any> } = {
            te: {},
            hi: {},
          };
          for (const item of res.data) {
            if (item.content?.translations?.te) {
              loadedTranslations.te[item.section] = item.content.translations.te;
            }
            if (item.content?.translations?.hi) {
              loadedTranslations.hi[item.section] = item.content.translations.hi;
            }
            if (item.section === "hero" && item.content) setHeroData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "about" && item.content) setAboutData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "stats" && item.content) setStatsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "contact" && item.content) setContactData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "products" && item.content) setProductsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "testimonials" && item.content) setTestimonialsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "cta" && item.content) setCtaData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "why_us" && item.content) setWhyUsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "process" && item.content) setProcessData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "faq" && item.content) setFaqData((prev) => ({ ...prev, ...item.content }));
          }
          setTranslations(loadedTranslations);
        }
      })
      .catch((err) => console.warn("Could not load dynamic website content:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      const res = await fetch("/api/admin/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero: {
            ...heroData,
            translations: {
              te: translations.te.hero,
              hi: translations.hi.hero,
            },
          },
          about: {
            ...aboutData,
            translations: {
              te: translations.te.about,
              hi: translations.hi.about,
            },
          },
          stats: statsData,
          contact: {
            ...contactData,
            translations: {
              te: translations.te.contact,
              hi: translations.hi.contact,
            },
          },
          products: {
            ...productsData,
            translations: {
              te: translations.te.products,
              hi: translations.hi.products,
            },
          },
          testimonials: {
            ...testimonialsData,
            translations: {
              te: translations.te.testimonials,
              hi: translations.hi.testimonials,
            },
          },
          cta: {
            ...ctaData,
            translations: {
              te: translations.te.cta,
              hi: translations.hi.cta,
            },
          },
          why_us: {
            ...whyUsData,
            translations: {
              te: translations.te.why_us,
              hi: translations.hi.why_us,
            },
          },
          process: {
            ...processData,
            translations: {
              te: translations.te.process,
              hi: translations.hi.process,
            },
          },
          faq: {
            ...faqData,
            translations: {
              te: translations.te.faq,
              hi: translations.hi.faq,
            },
          },
        }),
      });

      if (res.ok) {
        setIsSaving(false);
        setIsSaved(true);
        toast.success(
          "Website content saved and published to live website!",
          "Content Published"
        );
        setTimeout(() => setIsSaved(false), 4000);
      } else {
        setIsSaving(false);
        toast.error("Failed to save website content. Please try again.", "Save Failed");
      }
    } catch {
      setIsSaving(false);
      toast.error("Network error while saving content.", "Save Error");
    }
  };

  const tabs: { id: SectionTab; label: string; icon: any }[] = [
    { id: "hero", label: "Hero Banner", icon: Sparkles },
    { id: "about", label: "About Story", icon: Building },
    { id: "stats", label: "Live Numbers", icon: TrendingUp },
    { id: "contact", label: "Contact & Showroom", icon: Phone },
    { id: "products", label: "Products Catalog", icon: Package },
    { id: "testimonials", label: "Client Reviews", icon: MessageSquare },
    { id: "cta", label: "Promo CTA Banner", icon: Megaphone },
    { id: "why_us", label: "Why Choose Us", icon: ShieldCheck },
    { id: "process", label: "5-Step Process", icon: CheckCircle },
    { id: "faq", label: "FAQ Questions", icon: HelpCircle },
  ];

  return (
    <PermissionGuard permission="website">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500" />
              Website Dynamic Content Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control all headlines, products, contact numbers, live reviews, and metrics on your public website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-translates to Telugu &amp; Hindi</span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition border border-slate-300 dark:border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview Live Website
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save & Publish Changes"}
            </button>
          </div>
        </div>

        {/* Success Notification */}
        {isSaved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Changes successfully published! Live website dynamic content has been updated.
            </span>
          </div>
        )}

        {/* Main Editor Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          {/* Section Tabs Bar */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-3 sm:px-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3.5 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer shrink-0 ${active
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="p-4 sm:p-6 md:p-8">
            {/* Multilingual Selector Toolbar for Content Sections */}
            {activeTab !== "stats" && (
              <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                    <Languages className="w-4 h-4 text-amber-500" />
                    <span>Content Language:</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEditingLang("en")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${editingLang === "en"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                    >
                      🇬🇧 English
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLang("te")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${editingLang === "te"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                    >
                      🇮🇳 తెలుగు
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLang("hi")}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${editingLang === "hi"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                    >
                      🇮🇳 हिन्दी
                    </button>
                  </div>
                </div>

                {editingLang !== "en" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={autoTranslateCurrentSection}
                      disabled={isTranslating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition cursor-pointer shadow-xs"
                    >
                      {isTranslating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isTranslating
                          ? "Translating..."
                          : `⚡ Auto-Translate to ${editingLang === "te" ? "Telugu" : "Hindi"}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadDefaultTranslation(activeTab, editingLang)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                      title="Load standard pre-verified translation"
                    >
                      Reset to Default
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1. HERO BANNER */}
            {activeTab === "hero" && (
              <div className="space-y-5 max-w-3xl text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Top Trust Badge Text
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("hero", "badgeText", heroData.badgeText)}
                    onChange={(e) => updateField("hero", "badgeText", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("hero", "heading", heroData.heading)}
                    onChange={(e) => updateField("hero", "heading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Subheading / Brand Description
                  </label>
                  <textarea
                    rows={3}
                    value={getFieldValue("hero", "subheading", heroData.subheading)}
                    onChange={(e) => updateField("hero", "subheading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Primary CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("hero", "ctaText", heroData.ctaText)}
                      onChange={(e) => updateField("hero", "ctaText", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Secondary Button Text
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("hero", "secondaryText", heroData.secondaryText)}
                      onChange={(e) => updateField("hero", "secondaryText", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                {/* Badges Editor */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <label className="font-bold text-slate-800 dark:text-slate-200 block">
                    3 Trust Badges (Under CTA)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {heroData.badges.map((b, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400">Badge #{idx + 1}</span>
                        <input
                          type="text"
                          value={b.label}
                          onChange={(e) => {
                            const updated = [...heroData.badges];
                            updated[idx].label = e.target.value;
                            setHeroData({ ...heroData, badges: updated });
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ABOUT US */}
            {activeTab === "about" && (
              <div className="space-y-5 max-w-3xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Section Label
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("about", "sectionLabel", aboutData.sectionLabel)}
                      onChange={(e) => updateField("about", "sectionLabel", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("about", "heading", aboutData.heading)}
                      onChange={(e) => updateField("about", "heading", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Quality Tagline
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("about", "tagline", aboutData.tagline)}
                    onChange={(e) => updateField("about", "tagline", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Company Story & Tanuku Factory Philosophy
                  </label>
                  <textarea
                    rows={5}
                    value={getFieldValue("about", "story", aboutData.story)}
                    onChange={(e) => updateField("about", "story", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 3. LIVE NUMBERS / STATISTICS */}
            {activeTab === "stats" && (
              <div className="space-y-5 max-w-3xl text-xs">
                {/* 3-Language Auto-Sync Banner */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Universal Live Metrics — Automatically Synchronized in 3 Languages</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    You only enter the numbers once. The system automatically formats and animates them with native localized labels across all 3 languages:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🇬🇧 English</span>
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        {statsData.yearsExperience}+ Years Exp • {statsData.projectsCompleted}+ Projects • {statsData.happyClients}+ Clients • {statsData.districtsCovered}+ Districts
                      </div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🇮🇳 తెలుగు (Telugu)</span>
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        {statsData.yearsExperience}+ సం. అనుభవం • {statsData.projectsCompleted}+ ప్రాజెక్టులు • {statsData.happyClients}+ కస్టమర్లు • {statsData.districtsCovered}+ జిల్లాలు
                      </div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🇮🇳 हिन्दी (Hindi)</span>
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        {statsData.yearsExperience}+ वर्ष अनुभव • {statsData.projectsCompleted}+ प्रोजेक्ट • {statsData.happyClients}+ ग्राहक • {statsData.districtsCovered}+ जिले
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500">
                  These 4 live counters animate when visitors scroll down on your landing page.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Years of Experience
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={statsData.yearsExperience}
                        onChange={(e) =>
                          setStatsData({ ...statsData, yearsExperience: Number(e.target.value) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-base"
                      />
                      <span className="font-bold text-slate-400">+</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Projects Completed
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={statsData.projectsCompleted}
                        onChange={(e) =>
                          setStatsData({ ...statsData, projectsCompleted: Number(e.target.value) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-base"
                      />
                      <span className="font-bold text-slate-400">+</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Happy Clients
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={statsData.happyClients}
                        onChange={(e) =>
                          setStatsData({ ...statsData, happyClients: Number(e.target.value) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-base"
                      />
                      <span className="font-bold text-slate-400">+</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Districts / Cities Covered
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={statsData.districtsCovered}
                        onChange={(e) =>
                          setStatsData({ ...statsData, districtsCovered: Number(e.target.value) })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-base"
                      />
                      <span className="font-bold text-slate-400">+</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CONTACT & SHOWROOM DETAILS */}
            {activeTab === "contact" && (
              <div className="space-y-5 max-w-3xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Primary Phone (Click-to-Call)
                    </label>
                    <input
                      type="text"
                      value={contactData.phonePrimary}
                      onChange={(e) => setContactData({ ...contactData, phonePrimary: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Secondary Phone (Backup)
                    </label>
                    <input
                      type="text"
                      value={contactData.phoneSecondary}
                      onChange={(e) => setContactData({ ...contactData, phoneSecondary: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      WhatsApp Number (without + symbol)
                    </label>
                    <input
                      type="text"
                      value={contactData.whatsappNumber}
                      onChange={(e) => setContactData({ ...contactData, whatsappNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Physical Showroom & Workshop Address (Tanuku)
                  </label>
                  <input
                    type="text"
                    value={contactData.address}
                    onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Operating Business Hours
                  </label>
                  <input
                    type="text"
                    value={contactData.businessHours}
                    onChange={(e) => setContactData({ ...contactData, businessHours: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Google Maps Embed URL
                  </label>
                  <input
                    type="text"
                    value={contactData.mapEmbedUrl}
                    onChange={(e) => setContactData({ ...contactData, mapEmbedUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* 5. PRODUCTS SHOWCASE */}
            {activeTab === "products" && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("products", "heading", productsData.heading)}
                      onChange={(e) => updateField("products", "heading", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Subheading
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("products", "subheading", productsData.subheading)}
                      onChange={(e) => updateField("products", "subheading", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Product Items ({productsData.items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newProd = {
                          slug: `custom-product-${Date.now()}`,
                          name: "New Window / Door System",
                          description: "Custom engineered architectural system tailored for luxury spaces.",
                          image: "/images/products/custom.jpg",
                          icon: "LayoutGrid",
                        };
                        setProductsData({
                          ...productsData,
                          items: [...productsData.items, newProd],
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Product
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productsData.items.map((prod, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-amber-600 uppercase">
                            Product #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productsData.items.filter((_, i) => i !== idx);
                              setProductsData({ ...productsData, items: updated });
                            }}
                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="Remove Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={prod.name}
                            onChange={(e) => {
                              const updated = [...productsData.items];
                              updated[idx].name = e.target.value;
                              setProductsData({ ...productsData, items: updated });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={prod.description}
                            onChange={(e) => {
                              const updated = [...productsData.items];
                              updated[idx].description = e.target.value;
                              setProductsData({ ...productsData, items: updated });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Image Path / URL
                          </label>
                          <input
                            type="text"
                            value={prod.image}
                            onChange={(e) => {
                              const updated = [...productsData.items];
                              updated[idx].image = e.target.value;
                              setProductsData({ ...productsData, items: updated });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. CLIENT TESTIMONIALS */}
            {activeTab === "testimonials" && (
              <div className="space-y-5 text-xs">
                <div className="max-w-xl space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("testimonials", "heading", testimonialsData.heading)}
                    onChange={(e) => updateField("testimonials", "heading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Verified Client Reviews ({testimonialsData.items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newRev = {
                          name: "Customer Name",
                          location: "Tanuku, West Godavari",
                          rating: 5,
                          quote: "Excellent work by Siri Windows team. Beautiful finish and on-time installation.",
                        };
                        setTestimonialsData({
                          ...testimonialsData,
                          items: [...testimonialsData.items, newRev],
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Review
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonialsData.items.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => {
                                  const updated = [...testimonialsData.items];
                                  updated[idx].rating = star;
                                  setTestimonialsData({ ...testimonialsData, items: updated });
                                }}
                                className="cursor-pointer"
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${star <= rev.rating ? "fill-amber-500" : "text-slate-300"
                                    }`}
                                />
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = testimonialsData.items.filter((_, i) => i !== idx);
                              setTestimonialsData({ ...testimonialsData, items: updated });
                            }}
                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="Remove Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Client Name
                            </label>
                            <input
                              type="text"
                              value={rev.name}
                              onChange={(e) => {
                                const updated = [...testimonialsData.items];
                                updated[idx].name = e.target.value;
                                setTestimonialsData({ ...testimonialsData, items: updated });
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Location / City
                            </label>
                            <input
                              type="text"
                              value={rev.location}
                              onChange={(e) => {
                                const updated = [...testimonialsData.items];
                                updated[idx].location = e.target.value;
                                setTestimonialsData({ ...testimonialsData, items: updated });
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Client Review Quote
                          </label>
                          <textarea
                            rows={3}
                            value={rev.quote}
                            onChange={(e) => {
                              const updated = [...testimonialsData.items];
                              updated[idx].quote = e.target.value;
                              setTestimonialsData({ ...testimonialsData, items: updated });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. PROMOTIONAL CTA BANNER */}
            {activeTab === "cta" && (
              <div className="space-y-5 max-w-3xl text-xs">
                <p className="text-slate-500">
                  This banner appears right before the contact section. Perfect for seasonal festival offers or warranty highlights.
                </p>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Banner Main Headline
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("cta", "heading", ctaData.heading)}
                    onChange={(e) => updateField("cta", "heading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Subheading / Offer Details
                  </label>
                  <textarea
                    rows={3}
                    value={getFieldValue("cta", "subheading", ctaData.subheading)}
                    onChange={(e) => updateField("cta", "subheading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("cta", "ctaText", ctaData.ctaText)}
                    onChange={(e) => updateField("cta", "ctaText", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                  />
                </div>
              </div>
            )}

            {/* 8. WHY CHOOSE US */}
            {activeTab === "why_us" && (
              <div className="space-y-5 text-xs">
                <div className="max-w-xl space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("why_us", "heading", whyUsData.heading)}
                    onChange={(e) => updateField("why_us", "heading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whyUsData.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <span className="text-[10px] font-bold text-amber-600 uppercase">
                        Advantage Pillar #{idx + 1}
                      </span>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Title
                        </label>
                        <input
                          type="text"
                          value={feat.title}
                          onChange={(e) => {
                            const updated = [...whyUsData.features];
                            updated[idx].title = e.target.value;
                            setWhyUsData({ ...whyUsData, features: updated });
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={feat.description}
                          onChange={(e) => {
                            const updated = [...whyUsData.features];
                            updated[idx].description = e.target.value;
                            setWhyUsData({ ...whyUsData, features: updated });
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. 5-STEP PROCESS */}
            {activeTab === "process" && (
              <div className="space-y-5 text-xs">
                <div className="max-w-xl space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("process", "heading", processData.heading)}
                    onChange={(e) => updateField("process", "heading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {processData.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                        {step.number}
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Step Title
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const updated = [...processData.steps];
                              updated[idx].title = e.target.value;
                              setProcessData({ ...processData, steps: updated });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Step Description
                          </label>
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) => {
                              const updated = [...processData.steps];
                              updated[idx].description = e.target.value;
                              setProcessData({ ...processData, steps: updated });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. FAQ QUESTIONS & ANSWERS */}
            {activeTab === "faq" && (
              <div className="space-y-6 text-xs">
                {/* Header Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Section Badge / Label
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("faq", "sectionLabel", faqData.sectionLabel)}
                      onChange={(e) => updateField("faq", "sectionLabel", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={getFieldValue("faq", "heading", faqData.heading)}
                      onChange={(e) => updateField("faq", "heading", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Subheading / Description
                  </label>
                  <input
                    type="text"
                    value={getFieldValue("faq", "subheading", faqData.subheading)}
                    onChange={(e) => updateField("faq", "subheading", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs"
                  />
                </div>

                {/* FAQ Items */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-500" />
                        Frequently Asked Questions ({faqData.items.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {editingLang === "en"
                          ? "Questions and answers displayed on the landing page accordion."
                          : `Editing translated Q&A in ${editingLang === "te" ? "Telugu" : "Hindi"}.`}
                      </p>
                    </div>

                    {editingLang === "en" && (
                      <button
                        type="button"
                        onClick={() => {
                          setFaqData({
                            ...faqData,
                            items: [
                              ...faqData.items,
                              {
                                question: "New Question Title",
                                answer: "Detailed answer explaining the solution.",
                              },
                            ],
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Question
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {faqData.items.map((item, idx) => {
                      const currentLang = editingLang !== "en" ? (editingLang as "te" | "hi") : null;
                      const trItems = currentLang ? translations[currentLang]?.faq?.items || [] : [];
                      const trQuestion = trItems[idx]?.question ?? "";
                      const trAnswer = trItems[idx]?.answer ?? "";

                      return (
                        <div
                          key={idx}
                          className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-[11px]">
                              Question #{idx + 1}
                            </span>
                            {editingLang === "en" && faqData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = faqData.items.filter((_, i) => i !== idx);
                                  setFaqData({ ...faqData, items: updated });
                                }}
                                className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Reference for non-English editing */}
                          {editingLang !== "en" && (
                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                              <p className="font-semibold text-amber-900 dark:text-amber-300">
                                English Reference:
                              </p>
                              <p className="font-medium text-slate-700 dark:text-slate-300">
                                Q: {item.question}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400 line-clamp-2">
                                A: {item.answer}
                              </p>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Question Text
                            </label>
                            <input
                              type="text"
                              value={editingLang === "en" ? item.question : trQuestion}
                              onChange={(e) => {
                                if (editingLang === "en") {
                                  const updated = [...faqData.items];
                                  updated[idx].question = e.target.value;
                                  setFaqData({ ...faqData, items: updated });
                                } else if (currentLang) {
                                  const currentTr = [...(translations[currentLang]?.faq?.items || faqData.items.map(() => ({ question: "", answer: "" })))];
                                  while (currentTr.length <= idx) {
                                    currentTr.push({ question: "", answer: "" });
                                  }
                                  currentTr[idx] = {
                                    ...currentTr[idx],
                                    question: e.target.value,
                                  };
                                  setTranslations((prev) => ({
                                    ...prev,
                                    [currentLang]: {
                                      ...prev[currentLang],
                                      faq: {
                                        ...(prev[currentLang]?.faq || {}),
                                        items: currentTr,
                                      },
                                    },
                                  }));
                                }
                              }}
                              placeholder="e.g. What is the difference between UPVC and Aluminium?"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Detailed Answer
                            </label>
                            <textarea
                              rows={3}
                              value={editingLang === "en" ? item.answer : trAnswer}
                              onChange={(e) => {
                                if (editingLang === "en") {
                                  const updated = [...faqData.items];
                                  updated[idx].answer = e.target.value;
                                  setFaqData({ ...faqData, items: updated });
                                } else if (currentLang) {
                                  const currentTr = [...(translations[currentLang]?.faq?.items || faqData.items.map(() => ({ question: "", answer: "" })))];
                                  while (currentTr.length <= idx) {
                                    currentTr.push({ question: "", answer: "" });
                                  }
                                  currentTr[idx] = {
                                    ...currentTr[idx],
                                    answer: e.target.value,
                                  };
                                  setTranslations((prev) => ({
                                    ...prev,
                                    [currentLang]: {
                                      ...prev[currentLang],
                                      faq: {
                                        ...(prev[currentLang]?.faq || {}),
                                        items: currentTr,
                                      },
                                    },
                                  }));
                                }
                              }}
                              placeholder="Provide clear, convincing answer for customers..."
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs leading-relaxed"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Action Bar */}
            <div className="pt-6 mt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">
                Clicking save reflects your changes on the website instantly.
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Publishing to Website..." : "Save & Publish Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
