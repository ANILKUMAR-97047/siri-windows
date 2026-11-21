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
  Sliders,
  AlertCircle,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast } from "@/components/ui/ToastProvider";

export default function WebsiteContentPage() {
  const [activeTab, setActiveTab] = useState<"hero" | "contact" | "stats" | "about">("hero");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Content State
  const [heroData, setHeroData] = useState({
    badgeText: "Tanuku's Premier Architectural Partner",
    heading: "Engineered for Silence. Crafted for Luxury.",
    subheading:
      "Premium UPVC & Aluminium Windows & Doors custom-manufactured in Tanuku for Andhra Pradesh homes, villas, and commercial spaces.",
    ctaText: "Request a Free Quote",
    ctaLink: "#contact",
    secondaryText: "View Our Portfolio",
    secondaryLink: "#gallery",
  });

  const [contactData, setContactData] = useState({
    phonePrimary: "+91 98491 23456",
    phoneSecondary: "+91 94401 23456",
    whatsappNumber: "919849123456",
    email: "contact@siriwindows.in",
    address:
      "Near RTC Bus Stand, Main Road, Tanuku, West Godavari Dist, Andhra Pradesh - 534211",
    businessHours: "Mon - Sat: 9:00 AM - 8:00 PM (Sunday: By Appointment)",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3820.6!2d81.68!3d16.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1",
  });

  const [statsData, setStatsData] = useState({
    yearsExperience: 12,
    projectsCompleted: 1500,
    happyClients: 1200,
    districtsCovered: 8,
  });

  const [aboutData, setAboutData] = useState({
    sectionLabel: "About Siri Windows",
    heading: "Decade of Precision Engineering in West Godavari",
    tagline: "Custom-built with German technology, tested for cyclonic coastal winds.",
    story:
      "Founded in Tanuku, Siri Windows has grown from a specialized UPVC fabrication workshop into Andhra Pradesh's premier architectural window and door solutions provider.",
  });

  // Fetch from Supabase on mount
  useEffect(() => {
    fetch("/api/admin/website")
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          for (const item of res.data) {
            if (item.section === "hero" && item.content) setHeroData(item.content);
            if (item.section === "contact" && item.content) setContactData(item.content);
            if (item.section === "stats" && item.content) setStatsData(item.content);
            if (item.section === "about" && item.content) setAboutData(item.content);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      // Post to our dynamic content API endpoint
      const res = await fetch("/api/admin/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero: heroData,
          contact: contactData,
          stats: statsData,
          about: aboutData,
        }),
      });

      if (res.ok) {
        setIsSaving(false);
        setIsSaved(true);
        toast.success("Website content saved and published to live website!", "Content Published");
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

  return (
    <PermissionGuard permission="website">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-500" />
            Website Dynamic Content Editor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Edit text, phone numbers, hero headlines, and statistics on your live website without touching code.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving to Database..." : "Save & Publish Changes"}
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

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Section Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-6 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "hero", label: "Hero Banner", icon: Sparkles },
            { id: "contact", label: "Phone & Contact Info", icon: Phone },
            { id: "stats", label: "Key Statistics", icon: TrendingUp },
            { id: "about", label: "About & Highlights", icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3.5 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
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

        {/* Tab Forms */}
        <div className="p-6 md:p-8">
          {/* 1. HERO SECTION */}
          {activeTab === "hero" && (
            <div className="space-y-5 max-w-2xl text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Top Trust Badge Text
                </label>
                <input
                  type="text"
                  value={heroData.badgeText}
                  onChange={(e) =>
                    setHeroData({ ...heroData, badgeText: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Main Headline (Hero Heading)
                </label>
                <input
                  type="text"
                  value={heroData.heading}
                  onChange={(e) =>
                    setHeroData({ ...heroData, heading: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Subheading Description
                </label>
                <textarea
                  rows={3}
                  value={heroData.subheading}
                  onChange={(e) =>
                    setHeroData({ ...heroData, subheading: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={heroData.ctaText}
                    onChange={(e) =>
                      setHeroData({ ...heroData, ctaText: e.target.value })
                    }
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
                    onChange={(e) =>
                      setHeroData({ ...heroData, secondaryText: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. CONTACT DETAILS */}
          {activeTab === "contact" && (
            <div className="space-y-5 max-w-2xl text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Primary Phone Number *
                  </label>
                  <input
                    type="text"
                    value={contactData.phonePrimary}
                    onChange={(e) =>
                      setContactData({ ...contactData, phonePrimary: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Secondary / Alternate Phone
                  </label>
                  <input
                    type="text"
                    value={contactData.phoneSecondary}
                    onChange={(e) =>
                      setContactData({ ...contactData, phoneSecondary: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    WhatsApp Number (country code + digits, e.g. 919849123456)
                  </label>
                  <input
                    type="text"
                    value={contactData.whatsappNumber}
                    onChange={(e) =>
                      setContactData({ ...contactData, whatsappNumber: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Official Inquiries Email
                  </label>
                  <input
                    type="email"
                    value={contactData.email}
                    onChange={(e) =>
                      setContactData({ ...contactData, email: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Factory & Showroom Physical Address
                </label>
                <textarea
                  rows={2}
                  value={contactData.address}
                  onChange={(e) =>
                    setContactData({ ...contactData, address: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Business Working Hours
                </label>
                <input
                  type="text"
                  value={contactData.businessHours}
                  onChange={(e) =>
                    setContactData({ ...contactData, businessHours: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>
            </div>
          )}

          {/* 3. KEY STATISTICS */}
          {activeTab === "stats" && (
            <div className="space-y-5 max-w-2xl text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                These numbers display in the animated counter section of the homepage to build customer trust.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Years of Fabrication Experience
                  </label>
                  <input
                    type="number"
                    value={statsData.yearsExperience}
                    onChange={(e) =>
                      setStatsData({ ...statsData, yearsExperience: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Total Projects Completed
                  </label>
                  <input
                    type="number"
                    value={statsData.projectsCompleted}
                    onChange={(e) =>
                      setStatsData({ ...statsData, projectsCompleted: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Satisfied Residential & Commercial Clients
                  </label>
                  <input
                    type="number"
                    value={statsData.happyClients}
                    onChange={(e) =>
                      setStatsData({ ...statsData, happyClients: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Andhra Pradesh Districts Covered
                  </label>
                  <input
                    type="number"
                    value={statsData.districtsCovered}
                    onChange={(e) =>
                      setStatsData({ ...statsData, districtsCovered: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. ABOUT & BRAND STORY */}
          {activeTab === "about" && (
            <div className="space-y-5 max-w-2xl text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={aboutData.heading}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, heading: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Tagline / Quality Guarantee
                </label>
                <input
                  type="text"
                  value={aboutData.tagline}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, tagline: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Company Story & Manufacturing Philosophy
                </label>
                <textarea
                  rows={4}
                  value={aboutData.story}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, story: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Save Button at bottom of form */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save & Publish Changes"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </PermissionGuard>
  );
}
