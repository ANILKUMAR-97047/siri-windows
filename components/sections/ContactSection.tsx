"use client";

import { useState, useRef } from "react";
import { Phone, MapPin, Clock, Mail, Send, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/providers/LanguageProvider";
import { toast } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";

interface FormData {
  name: string;
  phone: string;
  location: string;
  email: string;
  product: string;
  message: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactSection() {
  const { contactFormContent, contactInfo, contactLabels } = useContent();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    location: "",
    email: "",
    product: "",
    message: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = contactLabels.requiredName;

    const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, "").replace(/^91/, "");
    if (!formData.phone.trim()) {
      newErrors.phone = contactLabels.requiredPhone;
    } else if (!/^[0-9]{10}$/.test(cleanPhone)) {
      newErrors.phone = contactLabels.invalidPhone;
    }

    if (!formData.location.trim()) {
      newErrors.location = contactLabels.requiredLocation;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = contactLabels.invalidEmail;
    }
    if (!formData.message.trim()) newErrors.message = contactLabels.requiredMessage;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting" || status === "success") return;
    if (!validate()) return;

    setStatus("submitting");
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setErrors({});
        setFormData({ name: "", phone: "", location: "", email: "", product: "", message: "" });
        toast.success(
          "Thank you! Your inquiry has been submitted. Our team will contact you shortly.",
          "Inquiry Received"
        );
        setTimeout(() => {
          setStatus("idle");
        }, 5000);
      } else {
        setStatus("error");
        toast.error("Failed to submit inquiry. Please try again or call us directly.", "Submission Failed");
        setTimeout(() => {
          setStatus("idle");
        }, 4000);
      }
    } catch {
      setStatus("error");
      toast.error("Network error while submitting inquiry. Please try again.", "Error");
      setTimeout(() => {
        setStatus("idle");
      }, 4000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormData];
        return next;
      });
    }
    if (status !== "idle" && status !== "submitting") {
      setStatus("idle");
    }
  };

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container-wide">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Reveal>
            <p className="section-label">{contactFormContent.sectionLabel}</p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {contactFormContent.heading}
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Contact Form */}
          <Reveal>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700">
                  {contactLabels.name}
                </label>
                <input
                  type="text"
                  name="name"
                  id="contact-name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Varma"
                  required
                  className={`w-full px-4 py-3 rounded-xl border bg-off-white text-navy-950 text-sm focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10 transition placeholder:text-slate-400 ${
                    errors.name ? "border-red-400 bg-red-50/20" : "border-blue-200"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700">
                  {contactLabels.phone}
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="contact-phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number (e.g. 98491 23456)"
                  required
                  className={`w-full px-4 py-3 rounded-xl border bg-off-white text-navy-950 text-sm focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10 transition placeholder:text-slate-400 ${
                    errors.phone ? "border-red-400 bg-red-50/20" : "border-blue-200"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Location / City */}
              <div className="space-y-1.5">
                <label htmlFor="contact-location" className="block text-xs font-semibold text-slate-700">
                  {contactLabels.location}
                </label>
                <input
                  type="text"
                  name="location"
                  id="contact-location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Tanuku, Bhimavaram, Tadepalligudem"
                  required
                  className={`w-full px-4 py-3 rounded-xl border bg-off-white text-navy-950 text-sm focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10 transition placeholder:text-slate-400 ${
                    errors.location ? "border-red-400 bg-red-50/20" : "border-blue-200"
                  }`}
                />
                {errors.location && (
                  <p className="text-red-500 text-xs mt-1">{errors.location}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700">
                  {contactLabels.email}
                </label>
                <input
                  type="email"
                  name="email"
                  id="contact-email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="yourname@gmail.com (optional)"
                  className={`w-full px-4 py-3 rounded-xl border bg-off-white text-navy-950 text-sm focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10 transition placeholder:text-slate-400 ${
                    errors.email ? "border-red-400 bg-red-50/20" : "border-blue-200"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Product Interest */}
              <div className="space-y-1.5">
                <label htmlFor="contact-product" className="block text-xs font-semibold text-slate-700">
                  {contactLabels.product}
                </label>
                <CustomSelect
                  id="contact-product"
                  name="product"
                  value={formData.product}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, product: val }));
                    if (status !== "idle" && status !== "submitting") {
                      setStatus("idle");
                    }
                  }}
                  placeholder={contactLabels.productPlaceholder}
                  options={contactFormContent.productOptions}
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700">
                  {contactLabels.message}
                </label>
                <textarea
                  name="message"
                  id="contact-message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your window or door requirements, sizes, site details, or special requests..."
                  rows={4}
                  required
                  className={`w-full px-4 py-3 rounded-xl border bg-off-white text-navy-950 text-sm focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10 transition resize-none placeholder:text-slate-400 ${
                    errors.message ? "border-red-400 bg-red-50/20" : "border-blue-200"
                  }`}
                />
                {errors.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "submitting" || status === "success"}
                className={`w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-lg transition-all duration-200 min-h-[48px] ${
                  status === "success"
                    ? "bg-emerald-600 text-white cursor-default shadow-md"
                    : status === "error"
                    ? "bg-red-600 text-white"
                    : "bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                }`}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {contactLabels.sending}
                  </>
                ) : status === "success" ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {contactLabels.success}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {contactLabels.submit}
                  </>
                )}
              </button>

              {status === "success" && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-emerald-900">Inquiry Sent Successfully!</span>
                    <span>Our engineering team in Tanuku will contact you shortly.</span>
                  </div>
                </div>
              )}

              {status === "error" && (
                <p className="text-red-500 text-sm text-center">
                  {contactLabels.error}
                </p>
              )}
            </form>
          </Reveal>

          {/* Contact Info Card */}
          <Reveal direction="right">
            <div className="bg-off-white rounded-[var(--radius-lg)] p-8 md:p-10 shadow-[var(--shadow-card)] h-full">
              <h3
                className="font-semibold text-navy-950 mb-8"
                style={{
                  fontSize: "var(--text-h3)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {contactLabels.getInTouch}
              </h3>

              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-950 text-sm mb-0.5">
                      {contactLabels.showroom}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {contactInfo.address}
                    </p>
                  </div>
                </div>

                {/* Phones */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-950 text-sm mb-0.5">
                      {contactLabels.call}
                    </p>
                    {contactInfo.phones.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone}`}
                        className="block text-slate-600 text-sm hover:text-navy-600 transition-colors"
                      >
                        +91 {phone}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-950 text-sm mb-0.5">
                      {contactLabels.hours}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {contactInfo.businessHours}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-950 text-sm mb-0.5">
                      Email
                    </p>
                    {/* TODO: replace with real email */}
                    <a
                      href="mailto:sirienterprises8003@gmail.com"
                      className="text-slate-600 text-sm hover:text-navy-600 transition-colors"
                    >
                      sirienterprises8003@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Google Map */}
              <div className="mt-8 rounded-[var(--radius-md)] overflow-hidden aspect-[16/10]">
                <iframe
                  src={contactInfo.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Siri Enterprises location — Tanuku, Andhra Pradesh"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
