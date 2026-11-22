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
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";

type SectionTab =
  | "hero"
  | "about"
  | "stats"
  | "contact"
  | "products"
  | "testimonials"
  | "cta"
  | "why_us"
  | "process";

export default function WebsiteContentPage() {
  const [activeTab, setActiveTab] = useState<SectionTab>("hero");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch saved dynamic content from Supabase on mount
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/admin/website")
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          for (const item of res.data) {
            if (item.section === "hero" && item.content) setHeroData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "about" && item.content) setAboutData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "stats" && item.content) setStatsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "contact" && item.content) setContactData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "products" && item.content) setProductsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "testimonials" && item.content) setTestimonialsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "cta" && item.content) setCtaData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "why_us" && item.content) setWhyUsData((prev) => ({ ...prev, ...item.content }));
            if (item.section === "process" && item.content) setProcessData((prev) => ({ ...prev, ...item.content }));
          }
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
          hero: heroData,
          about: aboutData,
          stats: statsData,
          contact: contactData,
          products: productsData,
          testimonials: testimonialsData,
          cta: ctaData,
          why_us: whyUsData,
          process: processData,
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
                  className={`py-3.5 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer shrink-0 ${
                    active
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
            {/* 1. HERO BANNER */}
            {activeTab === "hero" && (
              <div className="space-y-5 max-w-3xl text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Top Trust Badge Text
                  </label>
                  <input
                    type="text"
                    value={heroData.badgeText}
                    onChange={(e) => setHeroData({ ...heroData, badgeText: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    value={heroData.heading}
                    onChange={(e) => setHeroData({ ...heroData, heading: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Subheading / Brand Description
                  </label>
                  <textarea
                    rows={3}
                    value={heroData.subheading}
                    onChange={(e) => setHeroData({ ...heroData, subheading: e.target.value })}
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
                      value={heroData.ctaText}
                      onChange={(e) => setHeroData({ ...heroData, ctaText: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Secondary Button Text
                    </label>
                    <input
                      type="text"
                      value={heroData.secondaryText}
                      onChange={(e) => setHeroData({ ...heroData, secondaryText: e.target.value })}
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
                      value={aboutData.sectionLabel}
                      onChange={(e) => setAboutData({ ...aboutData, sectionLabel: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={aboutData.heading}
                      onChange={(e) => setAboutData({ ...aboutData, heading: e.target.value })}
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
                    value={aboutData.tagline}
                    onChange={(e) => setAboutData({ ...aboutData, tagline: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Company Story & Tanuku Factory Philosophy
                  </label>
                  <textarea
                    rows={5}
                    value={aboutData.story}
                    onChange={(e) => setAboutData({ ...aboutData, story: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 3. LIVE NUMBERS / STATISTICS */}
            {activeTab === "stats" && (
              <div className="space-y-5 max-w-3xl text-xs">
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
                      value={productsData.heading}
                      onChange={(e) => setProductsData({ ...productsData, heading: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Subheading
                    </label>
                    <input
                      type="text"
                      value={productsData.subheading}
                      onChange={(e) => setProductsData({ ...productsData, subheading: e.target.value })}
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
                    value={testimonialsData.heading}
                    onChange={(e) =>
                      setTestimonialsData({ ...testimonialsData, heading: e.target.value })
                    }
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
                                  className={`w-3.5 h-3.5 ${
                                    star <= rev.rating ? "fill-amber-500" : "text-slate-300"
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
                    value={ctaData.heading}
                    onChange={(e) => setCtaData({ ...ctaData, heading: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Subheading / Offer Details
                  </label>
                  <textarea
                    rows={3}
                    value={ctaData.subheading}
                    onChange={(e) => setCtaData({ ...ctaData, subheading: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={ctaData.ctaText}
                    onChange={(e) => setCtaData({ ...ctaData, ctaText: e.target.value })}
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
                    value={whyUsData.heading}
                    onChange={(e) => setWhyUsData({ ...whyUsData, heading: e.target.value })}
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
                    value={processData.heading}
                    onChange={(e) => setProcessData({ ...processData, heading: e.target.value })}
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

            {/* Bottom Save Action Bar */}
            <div className="pt-6 mt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">
                Clicking save updates the live database and reflects on the website instantly.
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
