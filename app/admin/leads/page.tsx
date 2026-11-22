"use client";

import { useState, useEffect } from "react";
import {
  PhoneCall,
  Search,
  Plus,
  MapPin,
  Mail,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { CustomSelect } from "@/components/ui/Select";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadsQuery, queryKeys } from "@/lib/queries";

function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M16.01 3.2c-7.05 0-12.78 5.7-12.78 12.72 0 2.43.69 4.8 1.99 6.84L3.1 30.8l8.24-2.1a12.9 12.9 0 0 0 4.67.88c7.05 0 12.78-5.7 12.78-12.72S23.06 3.2 16.01 3.2Zm0 23.96c-1.47 0-2.9-.29-4.25-.86l-.3-.13-4.9 1.25 1.27-4.76-.17-.31a11.16 11.16 0 0 1-1.72-5.93c0-5.69 4.52-10.31 10.07-10.31s10.07 4.62 10.07 10.31-4.52 10.74-10.07 10.74Z"
      />
      <path
        fill="currentColor"
        d="M21.7 18.7c-.31-.16-1.84-.91-2.12-1.02-.28-.1-.49-.15-.69.16-.2.31-.8 1.02-.98 1.23-.18.21-.36.23-.67.08-.31-.16-1.31-.48-2.5-1.54a9.4 9.4 0 0 1-1.72-2.14c-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.15-.18.2-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.69-1.66-.94-2.27-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.54.08-.82.39-.28.31-1.08 1.05-1.08 2.57 0 1.52 1.11 2.99 1.26 3.19.15.21 2.18 3.33 5.28 4.67.74.32 1.31.51 1.76.65.74.23 1.41.2 1.94.12.59-.09 1.84-.75 2.1-1.48.26-.73.26-1.35.18-1.48-.08-.13-.28-.21-.59-.36Z"
      />
    </svg>
  );
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  product_interest: string | null;
  estimated_budget: number | null;
  source: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "new" | "contacted" | "site_visit_scheduled" | "quote_sent" | "won" | "lost";
  created_at: string;
  notes: string | null;
}

const PRODUCT_OPTIONS = [
  "UPVC Windows",
  "Aluminium Windows",
  "UPVC Doors",
  "Aluminium Doors",
  "Sliding Windows & Doors",
  "Casement Windows",
  "French Doors",
  "Custom Solution",
  "Other / Not Sure",
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const queryClient = useQueryClient();
  const { data: cachedLeads = [], isLoading: queryLoading, refetch: refetchLeads } = useLeadsQuery();

  // Instant zero-latency loading from cache
  useEffect(() => {
    if (cachedLeads && cachedLeads.length > 0) {
      setLeads(cachedLeads as unknown as Lead[]);
      setLoading(false);
    } else if (!queryLoading) {
      setLoading(false);
    }
  }, [cachedLeads, queryLoading]);

  // Fetch leads from server API
  const fetchLeads = async () => {
    setLoading(true);
    await refetchLeads();
    setLoading(false);
  };

  // Form state for adding new lead
  const [newLead, setNewLead] = useState<{
    name: string;
    phone: string;
    email: string;
    city: string;
    product_category: string;
    custom_requirement: string;
    estimated_budget: string;
    source: string;
    priority: Lead["priority"];
    notes: string;
  }>({
    name: "",
    phone: "",
    email: "",
    city: "Tanuku",
    product_category: "",
    custom_requirement: "",
    estimated_budget: "",
    source: "Phone Inquiry",
    priority: "medium",
    notes: "",
  });

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    const budgetNum = Number(newLead.estimated_budget.replace(/[^0-9]/g, "")) || null;

    // Combine selected category and/or custom requirement
    const cat = (newLead.product_category || "").trim();
    const custom = (newLead.custom_requirement || "").trim();
    let computedRequirement = "General Window Inquiry";

    if (cat && custom) {
      computedRequirement = custom.toLowerCase().includes(cat.toLowerCase())
        ? custom
        : `${cat} - ${custom}`;
    } else if (cat) {
      computedRequirement = cat;
    } else if (custom) {
      computedRequirement = custom;
    }

    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLead.name.trim(),
          phone: newLead.phone.trim(),
          email: newLead.email.trim() || null,
          city: newLead.city || "Tanuku",
          product_interest: computedRequirement,
          estimated_budget: budgetNum,
          source: newLead.source,
          priority: newLead.priority,
          status: "new",
          notes: newLead.notes || null,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setLeads([json.data, ...leads]);
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
        setIsModalOpen(false);
        setNewLead({
          name: "",
          phone: "",
          email: "",
          city: "Tanuku",
          product_category: "",
          custom_requirement: "",
          estimated_budget: "",
          source: "Phone Inquiry",
          priority: "medium",
          notes: "",
        });
      } else {
        showToast("error", "Error saving lead: " + (json.error || "Unknown error"));
      }
    } catch (err: any) {
      showToast("error", "Network error: " + err.message);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: Lead["status"]) => {
    // Optimistic UI update
    setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));

    // Send PATCH to server API
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
        if (newStatus === "won") {
          queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
          showToast(
            "success",
            "Lead converted to Client! Successfully added to Clients & Quotes directory."
          );
        } else {
          showToast("success", `Lead status updated to ${statusBadges[newStatus]?.label || newStatus}.`);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("error", "Failed to update lead status.");
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesFilter = filterStatus === "all" ? true : l.status === filterStatus;
    const matchesSearch =
      (l.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.phone || "").includes(searchQuery) ||
      (l.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.product_interest || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusBadges: Record<string, { label: string; color: string }> = {
    new: { label: "New Lead", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
    contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300" },
    site_visit_scheduled: { label: "Site Visit Scheduled", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
    quote_sent: { label: "Quote Sent", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
    won: { label: "Won (Client Converted)", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" },
    lost: { label: "Lost", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
  };

  return (
    <PermissionGuard permission="leads">
      <div className="space-y-6">
        {/* Floating Notification Toast */}
        {notification && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 ${
              notification.type === "success"
                ? "bg-emerald-600 text-white shadow-emerald-950/20"
                : "bg-red-600 text-white shadow-red-950/20"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-75 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-amber-500" />
              Leads & Inquiries Pipeline
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
              {leads.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time inquiries synchronized with your website contact form and local client registrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
            title="Refresh Leads from Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          {[
            { id: "all", label: `All (${leads.length})` },
            { id: "new", label: `New (${leads.filter((l) => l.status === "new").length})` },
            { id: "contacted", label: `Contacted (${leads.filter((l) => l.status === "contacted").length})` },
            { id: "site_visit_scheduled", label: `Site Visit (${leads.filter((l) => l.status === "site_visit_scheduled").length})` },
            { id: "quote_sent", label: `Quote Sent (${leads.filter((l) => l.status === "quote_sent").length})` },
            { id: "won", label: `Won (${leads.filter((l) => l.status === "won").length})` },
            { id: "lost", label: `Lost (${leads.filter((l) => l.status === "lost").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, city..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>Loading leads from Supabase...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No leads found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Lead Contact</th>
                  <th className="py-3 px-4 font-semibold">Requirement & Budget</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Status Stage</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lead.name}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div
                          className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[190px]"
                          title={lead.email}
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lead.city || "Tanuku"}</span>
                      </div>
                    </td>

                    {/* Requirement & Budget */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {lead.product_interest || "General Window Inquiry"}
                      </div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                        {lead.estimated_budget
                          ? `Est. Budget: ₹${Number(lead.estimated_budget).toLocaleString("en-IN")}`
                          : "Budget: Discussion Pending"}
                      </div>
                      {lead.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                          "{lead.notes}"
                        </div>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">
                        {lead.source}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(lead.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          lead.priority === "urgent"
                            ? "bg-red-500 text-white"
                            : lead.priority === "high"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {lead.priority}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 min-w-[170px]">
                      <CustomSelect
                        value={lead.status}
                        onChange={(val) =>
                          updateLeadStatus(lead.id, val as Lead["status"])
                        }
                        size="sm"
                        options={[
                          { value: "new", label: "New Lead" },
                          { value: "contacted", label: "Contacted" },
                          { value: "site_visit_scheduled", label: "Site Visit Scheduled" },
                          { value: "quote_sent", label: "Quote Sent" },
                          { value: "won", label: "Won (Convert to Client)" },
                          { value: "lost", label: "Lost" },
                        ]}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                        title="WhatsApp Contact"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition"
                        title="Direct Call"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}?subject=${encodeURIComponent("Inquiry regarding Siri Windows & Doors")}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white transition"
                          title={`Send Email to ${lead.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40"
                          title="No email address provided"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Register New Lead (Inserts to Supabase)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="e.g. Ramesh Varma"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+91 98491 XXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Location / City
                  </label>
                  <input
                    type="text"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    placeholder="Tanuku, Bhimavaram, etc."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Estimated Budget (₹)
                  </label>
                  <input
                    type="text"
                    value={newLead.estimated_budget}
                    onChange={(e) => setNewLead({ ...newLead, estimated_budget: e.target.value })}
                    placeholder="150000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Lead Source
                  </label>
                  <CustomSelect
                    value={newLead.source}
                    onChange={(val) => setNewLead({ ...newLead, source: val })}
                    size="sm"
                    options={[
                      { value: "Website", label: "Website" },
                      { value: "Phone Inquiry", label: "Phone Inquiry" },
                      { value: "Walk-in Showroom", label: "Walk-in Showroom" },
                      { value: "Architect Referral", label: "Architect Referral" },
                      { value: "Social Media", label: "Social Media" },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Priority Level
                  </label>
                  <CustomSelect
                    value={newLead.priority}
                    onChange={(val) =>
                      setNewLead({ ...newLead, priority: val as Lead["priority"] })
                    }
                    size="sm"
                    options={[
                      { value: "urgent", label: "Urgent" },
                      { value: "high", label: "High" },
                      { value: "medium", label: "Medium" },
                      { value: "low", label: "Low" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Window / Door Requirement
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomSelect
                    value={newLead.product_category}
                    onChange={(val) =>
                      setNewLead({ ...newLead, product_category: val })
                    }
                    placeholder="Select a product"
                    size="sm"
                    options={PRODUCT_OPTIONS}
                  />
                  <input
                    type="text"
                    value={newLead.custom_requirement}
                    onChange={(e) =>
                      setNewLead({ ...newLead, custom_requirement: e.target.value })
                    }
                    placeholder="e.g. 10 UPVC sliding windows with bug mesh"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400">
                  Select a product from the dropdown and/or enter custom requirement details in the input field.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Site Specifications
                </label>
                <textarea
                  rows={3}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Enter details from customer conversation..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
                >
                  Save to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PermissionGuard>
  );
}
