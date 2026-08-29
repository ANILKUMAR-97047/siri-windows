"use client";

import { useState, useRef } from "react";
import { Phone, MapPin, Clock, Mail, Send, CheckCircle, Loader2 } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { useContent } from "@/components/providers/LanguageProvider";

interface FormData {
  name: string;
  phone: string;
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
    if (!formData.phone.trim()) {
      newErrors.phone = contactLabels.requiredPhone;
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = contactLabels.invalidPhone;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = contactLabels.invalidEmail;
    }
    if (!formData.message.trim()) newErrors.message = contactLabels.requiredMessage;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", phone: "", email: "", product: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
              <div className="floating-label-group">
                <input
                  type="text"
                  name="name"
                  id="contact-name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className={errors.name ? "!border-red-400" : ""}
                />
                <label htmlFor="contact-name">{contactLabels.name}</label>
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="floating-label-group">
                <input
                  type="tel"
                  name="phone"
                  id="contact-phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className={errors.phone ? "!border-red-400" : ""}
                />
                <label htmlFor="contact-phone">{contactLabels.phone}</label>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="floating-label-group">
                <input
                  type="email"
                  name="email"
                  id="contact-email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  className={errors.email ? "!border-red-400" : ""}
                />
                <label htmlFor="contact-email">{contactLabels.email}</label>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Product Interest */}
              <div className="floating-label-group">
                <select
                  name="product"
                  id="contact-product"
                  value={formData.product}
                  onChange={handleChange}
                  className="appearance-none"
                >
                  <option value="">{contactLabels.productPlaceholder}</option>
                  {contactFormContent.productOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <label htmlFor="contact-product">{contactLabels.product}</label>
              </div>

              {/* Message */}
              <div className="floating-label-group">
                <textarea
                  name="message"
                  id="contact-message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder=" "
                  rows={4}
                  required
                  className={`resize-none ${errors.message ? "!border-red-400" : ""}`}
                />
                <label htmlFor="contact-message">{contactLabels.message}</label>
                {errors.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px]"
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
