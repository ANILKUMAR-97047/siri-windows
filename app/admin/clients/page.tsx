"use client";

import { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building,
  Calculator,
  FileText,
  X,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Calendar,
  Briefcase,
  ArrowRight,
  TrendingUp,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { CustomSelect } from "@/components/ui/Select";

interface StaffRef {
  id: string;
  name: string;
  phone?: string;
  role: string;
}

interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  contract_amount: number;
  amount_received: number;
  site_location?: string;
  project_type?: string;
  expected_completion?: string | null;
  supervisor_name?: string | null;
  supervisor_id?: string | null;
  staff?: StaffRef | null;
  created_at?: string;
}

interface QuoteSummary {
  id: string;
  quote_number: string | null;
  total_amount: number;
  status: string;
  total_sqft?: number;
  rate_per_sqft?: number;
  materials_cost?: number;
  labor_cost?: number;
  notes?: string | null;
  created_at?: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  address: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
  source: string;
  status: "active" | "completed" | "prospect" | "inactive";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  projects?: ProjectSummary[];
  client_quotes?: QuoteSummary[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "prospect">("all");

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Client Modal State (Add & Edit)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submittingClient, setSubmittingClient] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [targetClientForQuote, setTargetClientForQuote] = useState<Client | null>(null);
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  // Staff list for assigning Site Supervisor
  const [staffList, setStaffList] = useState<StaffRef[]>([]);

  // Project Modal State (Direct Project Creation for a Client)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [targetClientForProject, setTargetClientForProject] = useState<Client | null>(null);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: "",
    contract_amount: 110000,
    amount_received: 25000,
    project_type: "Residential Villa",
    status: "planning" as "planning" | "fabrication" | "installation" | "completed",
    site_location: "",
    expected_completion: "",
    supervisor_id: "",
    custom_supervisor: "",
    notes: "",
  });

  // View Quotes History Modal State
  const [viewingQuotesClient, setViewingQuotesClient] = useState<Client | null>(null);

  // View Projects Modal State
  const [viewingProjectsClient, setViewingProjectsClient] = useState<Client | null>(null);

  // Converting Quote State
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);

  const [quoteData, setQuoteData] = useState({
    totalSqft: 250,
    ratePerSqft: 420,
    hardwareAddons: 5000,
    notes: "UPVC 3-Track Sliding with 5mm Toughened Clear Glass",
  });

  // Client Form State
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    email: "",
    company_name: "",
    address: "",
    city: "Tanuku",
    source: "Walk-in",
    status: "active" as "active" | "completed" | "prospect" | "inactive",
    notes: "",
  });

  const supabase = createClient();

  // Show Toast Helper
  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Fetch Clients from Supabase
  const fetchClients = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Staff list for Site Supervisor assignments
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, name, phone, role")
        .order("name", { ascending: true });

      if (staffData) {
        setStaffList(staffData as StaffRef[]);
      }

      // 2. Fetch Clients with projects (including target date and supervisor)
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          projects (
            id,
            title,
            status,
            contract_amount,
            amount_received,
            site_location,
            project_type,
            expected_completion,
            supervisor_name,
            supervisor_id,
            staff:supervisor_id (
              id,
              name,
              phone,
              role
            ),
            created_at
          ),
          client_quotes (
            id,
            quote_number,
            total_amount,
            status,
            total_sqft,
            rate_per_sqft,
            materials_cost,
            labor_cost,
            notes,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching clients:", error);
        showToast("error", "Failed to fetch clients from database: " + error.message);
      } else if (data) {
        const clientList = data as unknown as Client[];
        setClients(clientList);

        // Keep modal viewing states in sync
        if (viewingQuotesClient) {
          const updated = clientList.find((c) => c.id === viewingQuotesClient.id);
          if (updated) setViewingQuotesClient(updated);
        }
        if (viewingProjectsClient) {
          const updated = clientList.find((c) => c.id === viewingProjectsClient.id);
          if (updated) setViewingProjectsClient(updated);
        }
      }
    } catch (err: unknown) {
      console.error("Unexpected error fetching clients:", err);
      showToast("error", "Connection error while fetching clients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Open Add Client Modal
  const openAddModal = () => {
    setEditingClient(null);
    setClientForm({
      name: "",
      phone: "",
      email: "",
      company_name: "",
      address: "",
      city: "Tanuku",
      source: "Walk-in",
      status: "active",
      notes: "",
    });
    setIsClientModalOpen(true);
  };

  // Open Edit Client Modal
  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
      company_name: client.company_name || "",
      address: client.address || "",
      city: client.city || "Tanuku",
      source: client.source || "Walk-in",
      status: client.status || "active",
      notes: client.notes || "",
    });
    setIsClientModalOpen(true);
  };

  // Handle Save Client (Insert or Update in Supabase)
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim() || !clientForm.phone.trim()) {
      showToast("error", "Name and phone number are required.");
      return;
    }

    setSubmittingClient(true);
    try {
      if (editingClient) {
        // Update existing client in Supabase
        const { data, error } = await (supabase.from("clients") as any)
          .update({
            name: clientForm.name.trim(),
            phone: clientForm.phone.trim(),
            email: clientForm.email.trim() || null,
            company_name: clientForm.company_name.trim() || null,
            address: clientForm.address.trim() || null,
            city: clientForm.city.trim() || "Tanuku",
            source: clientForm.source,
            status: clientForm.status,
            notes: clientForm.notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingClient.id)
          .select(`
            *,
            projects (
              id,
              title,
              status,
              contract_amount,
              amount_received
            ),
            client_quotes (
              id,
              quote_number,
              total_amount,
              status
            )
          `)
          .single();

        if (error) {
          throw error;
        }

        setClients((prev) =>
          prev.map((c) => (c.id === editingClient.id ? (data as unknown as Client) : c))
        );
        showToast("success", `Client "${clientForm.name}" updated successfully.`);
      } else {
        // Insert new client in Supabase
        const { data, error } = await (supabase.from("clients") as any)
          .insert([
            {
              name: clientForm.name.trim(),
              phone: clientForm.phone.trim(),
              email: clientForm.email.trim() || null,
              company_name: clientForm.company_name.trim() || null,
              address: clientForm.address.trim() || null,
              city: clientForm.city.trim() || "Tanuku",
              source: clientForm.source,
              status: clientForm.status,
              notes: clientForm.notes.trim() || null,
            },
          ])
          .select(`
            *,
            projects (
              id,
              title,
              status,
              contract_amount,
              amount_received
            ),
            client_quotes (
              id,
              quote_number,
              total_amount,
              status
            )
          `)
          .single();

        if (error) {
          throw error;
        }

        setClients((prev) => [data as unknown as Client, ...prev]);
        showToast("success", `Client "${clientForm.name}" onboarded to Supabase.`);
      }

      setIsClientModalOpen(false);
      setEditingClient(null);
    } catch (err: any) {
      console.error("Error saving client:", err);
      showToast("error", err.message || "Failed to save client to Supabase.");
    } finally {
      setSubmittingClient(false);
    }
  };

  // Confirm and Execute Client Deletion
  const confirmDeleteClient = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from("clients").delete().eq("id", deleteTarget.id);

      if (error) {
        throw error;
      }

      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast("success", `Client "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Error deleting client:", err);
      showToast("error", err.message || "Failed to delete client from database.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Pricing Quote Calculation
  const calculatedMaterial = quoteData.totalSqft * quoteData.ratePerSqft;
  const grandTotal = calculatedMaterial + Number(quoteData.hardwareAddons || 0);

  // Open Quote Modal explicitly for this client
  const openQuoteModalForClient = (client: Client) => {
    setTargetClientForQuote(client);
    setQuoteData({
      totalSqft: 250,
      ratePerSqft: 420,
      hardwareAddons: 5000,
      notes: `UPVC 3-Track Sliding with Mesh for ${client.name}`,
    });
    setIsQuoteModalOpen(true);
  };

  // Open Project Modal directly for this client
  const openProjectModalForClient = (client: Client) => {
    // Default target completion date to 30 days ahead
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    const defaultDateStr = targetDate.toISOString().split("T")[0];

    // Pick first supervisor from staff list if available
    const defaultSupervisor =
      staffList.find((s) => s.role.toLowerCase().includes("supervisor")) || staffList[0];

    setTargetClientForProject(client);
    setProjectForm({
      title: `${client.company_name || client.name} Window Installation`,
      contract_amount: 110000,
      amount_received: 25000,
      project_type: "Residential Villa",
      status: "planning",
      site_location: client.address ? `${client.address}, ${client.city}` : client.city || "Tanuku",
      expected_completion: defaultDateStr,
      supervisor_id: defaultSupervisor ? defaultSupervisor.id : "",
      custom_supervisor: "",
      notes: `Direct project created for client ${client.name}`,
    });
    setIsProjectModalOpen(true);
  };

  // Open Quick Calculator from Top Header (General estimate)
  const openGeneralCalculator = () => {
    setTargetClientForQuote(null);
    setQuoteData({
      totalSqft: 250,
      ratePerSqft: 420,
      hardwareAddons: 5000,
      notes: "UPVC 3-Track Sliding with 5mm Toughened Clear Glass",
    });
    setIsQuoteModalOpen(true);
  };

  // Save Calculated Quote directly for targetClientForQuote in Supabase `client_quotes`
  const handleSaveQuoteToDatabase = async () => {
    if (!targetClientForQuote) {
      showToast("error", "No client selected for this quote.");
      return;
    }

    setIsSavingQuote(true);
    try {
      const quoteNumber = `SWQ-${Date.now().toString().slice(-6)}`;
      const { error } = await (supabase.from("client_quotes") as any).insert([
        {
          quote_number: quoteNumber,
          client_id: targetClientForQuote.id,
          total_sqft: quoteData.totalSqft,
          rate_per_sqft: quoteData.ratePerSqft,
          materials_cost: calculatedMaterial,
          labor_cost: Number(quoteData.hardwareAddons || 0),
          total_amount: grandTotal,
          status: "draft",
          notes: quoteData.notes,
        },
      ]);

      if (error) {
        throw error;
      }

      showToast(
        "success",
        `Quote ${quoteNumber} (₹${grandTotal.toLocaleString("en-IN")}) saved for ${targetClientForQuote.name}!`
      );
      setIsQuoteModalOpen(false);
      setTargetClientForQuote(null);
      fetchClients(true);
    } catch (err: any) {
      console.error("Error saving quote:", err);
      showToast("error", err.message || "Failed to save quote to Supabase.");
    } finally {
      setIsSavingQuote(false);
    }
  };

  // Handle Save Project Directly to Database
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientForProject) return;

    if (!projectForm.title.trim()) {
      showToast("error", "Project title is required.");
      return;
    }

    setSubmittingProject(true);
    try {
      let finalSupervisorId = projectForm.supervisor_id || null;
      let finalSupervisorName: string | null = null;

      if (projectForm.supervisor_id === "custom") {
        finalSupervisorId = null;
        finalSupervisorName = projectForm.custom_supervisor.trim() || null;
      } else if (projectForm.supervisor_id) {
        const found = staffList.find((s) => s.id === projectForm.supervisor_id);
        if (found) {
          finalSupervisorName = found.name;
        }
      }

      const { error } = await (supabase.from("projects") as any).insert([
        {
          title: projectForm.title.trim(),
          client_id: targetClientForProject.id,
          contract_amount: Number(projectForm.contract_amount) || 0,
          amount_received: Number(projectForm.amount_received) || 0,
          project_type: projectForm.project_type,
          status: projectForm.status,
          site_location: projectForm.site_location.trim() || targetClientForProject.city || "Tanuku",
          expected_completion: projectForm.expected_completion || null,
          supervisor_id: finalSupervisorId,
          supervisor_name: finalSupervisorName,
          start_date: new Date().toISOString().split("T")[0],
          notes: projectForm.notes.trim() || null,
        },
      ]);

      if (error) throw error;

      showToast(
        "success",
        `Project created! Total Billed updated by ₹${Number(projectForm.contract_amount).toLocaleString("en-IN")}.`
      );
      setIsProjectModalOpen(false);
      setTargetClientForProject(null);
      fetchClients(true);
    } catch (err: any) {
      console.error("Error creating project:", err);
      showToast("error", err.message || "Failed to create project.");
    } finally {
      setSubmittingProject(false);
    }
  };

  // Convert Quote into an Active Project with 1 Click
  const handleConvertQuoteToProject = async (client: Client, quote: QuoteSummary) => {
    setConvertingQuoteId(quote.id);
    try {
      // 1. Create a project in `projects` table for this client
      const projectTitle = `${client.company_name || client.name} - ${quote.notes || "UPVC Windows Installation"}`;
      const { error: projError } = await (supabase.from("projects") as any).insert([
        {
          title: projectTitle,
          client_id: client.id,
          site_location: client.address ? `${client.address}, ${client.city}` : client.city || "Tanuku",
          project_type: "Residential Villa",
          status: "planning",
          contract_amount: quote.total_amount,
          amount_received: 0,
          notes: `Converted from Quote ${quote.quote_number || ""}: ${quote.notes || ""}`,
        },
      ]);

      if (projError) throw projError;

      // 2. Update quote status to 'approved'
      await (supabase.from("client_quotes") as any)
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", quote.id);

      showToast(
        "success",
        `Quote converted! ${client.name} now has 1 Active Project with Total Billed ₹${Number(quote.total_amount).toLocaleString("en-IN")}.`
      );

      // Refresh data
      await fetchClients(true);
    } catch (err: any) {
      console.error("Error converting quote to project:", err);
      showToast("error", err.message || "Failed to convert quote to project.");
    } finally {
      setConvertingQuoteId(null);
    }
  };

  // Filtered Clients List
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.phone.includes(searchQuery) ||
        (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ? true : c.status?.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: clients.length,
      active: clients.filter((c) => c.status === "active").length,
      completed: clients.filter((c) => c.status === "completed").length,
      prospect: clients.filter((c) => c.status === "prospect").length,
    };
  }, [clients]);

  return (
    <PermissionGuard permission="clients">
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
              className="ml-2 hover:opacity-75 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              Clients Directory & Onboarding
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage client directory, quotations pipeline, and active contract billing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchClients(true)}
              disabled={refreshing || loading}
              title="Refresh Clients from Supabase"
              className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-500" : ""}`} />
            </button>
            <button
              onClick={openGeneralCalculator}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-amber-500" />
              Quick Pricing Calculator
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Onboard Client
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, company, or phone..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "all"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "active"
                  ? "bg-emerald-500 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Active ({counts.active})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "completed"
                  ? "bg-blue-500 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Completed ({counts.completed})
            </button>
            <button
              onClick={() => setStatusFilter("prospect")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "prospect"
                  ? "bg-amber-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Prospects ({counts.prospect})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading dynamic clients directory from Supabase...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredClients.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              No clients found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No clients match the search term "${searchQuery}".`
                : "No clients currently match the selected status."}
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              Onboard First Client
            </button>
          </div>
        )}

        {/* Clients Cards Grid */}
        {!loading && filteredClients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              // Calculate financial totals and project stats
              const totalBilledValue =
                client.projects?.reduce(
                  (sum, p) => sum + (Number(p.contract_amount) || 0),
                  0
                ) || 0;

              const totalQuotedValue =
                client.client_quotes?.reduce(
                  (sum, q) => sum + (Number(q.total_amount) || 0),
                  0
                ) || 0;

              const activeProjectsCount =
                client.projects?.filter(
                  (p) => p.status !== "completed" && p.status !== "cancelled"
                ).length || 0;

              const completedProjectsCount =
                client.projects?.filter((p) => p.status === "completed").length || 0;

              const totalProjectsCount = client.projects?.length || 0;
              const quotesCount = client.client_quotes?.length || 0;

              return (
                <div
                  key={client.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3.5 hover:border-amber-500/40 transition group relative flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Header Row: Name, Company, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition truncate">
                          {client.name}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {client.company_name || "Individual Client"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                          client.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : client.status === "completed"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : client.status === "prospect"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {client.address
                            ? `${client.address}, ${client.city || "Tanuku"}`
                            : client.city || "Tanuku"}
                        </span>
                      </div>
                    </div>

                    {/* Source Tag & Quotes count */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400">
                        Source: {client.source || "Direct"}
                      </span>
                      {quotesCount > 0 ? (
                        <button
                          onClick={() => setViewingQuotesClient(client)}
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold cursor-pointer underline flex items-center gap-1"
                          title="Click to view quotation history and convert to project"
                        >
                          <FileText className="w-3 h-3" />
                          {quotesCount} {quotesCount === 1 ? "Quote" : "Quotes"}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No quotes yet</span>
                      )}
                    </div>
                  </div>

                  {/* Financial & Project Metrics */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>Total Billed</span>
                          {totalBilledValue === 0 && totalQuotedValue > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[9px]">
                              (₹{totalQuotedValue.toLocaleString("en-IN")} Quoted)
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          ₹{totalBilledValue.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Projects</div>
                        <button
                          onClick={() => setViewingProjectsClient(client)}
                          className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1 ml-auto"
                          title="Click to view or add projects for this client"
                        >
                          {activeProjectsCount > 0
                            ? `${activeProjectsCount} Active`
                            : completedProjectsCount > 0
                            ? `${completedProjectsCount} Completed`
                            : `${totalProjectsCount} Total`}
                        </button>
                      </div>
                    </div>

                    {/* Actions: Direct Quote, Direct Project, Edit, Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openQuoteModalForClient(client)}
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-bold flex items-center gap-1 cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60 transition"
                          title={`Generate quote directly for ${client.name}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          + Add Quote
                        </button>
                        <button
                          onClick={() => openProjectModalForClient(client)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/60 transition"
                          title={`Add confirmed project for ${client.name}`}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          + Add Project
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Client"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({ id: client.id, name: client.name })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Quote Modal (Explicitly for targetClientForQuote) OR General Quick Calculator */}
        {isQuoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  {targetClientForQuote ? (
                    <>
                      <FileText className="w-4 h-4 text-amber-500" />
                      Create Quote for {targetClientForQuote.name}
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 text-amber-500" />
                      Quick Window Pricing Calculator
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setIsQuoteModalOpen(false);
                    setTargetClientForQuote(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Locked Client Banner (When opened directly from a client card) */}
              {targetClientForQuote ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                      Client Selected for this Quote
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {targetClientForQuote.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {targetClientForQuote.company_name ? `${targetClientForQuote.company_name} • ` : ""}
                      {targetClientForQuote.phone} ({targetClientForQuote.city})
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-full shadow-xs">
                    Client Locked
                  </span>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>General estimation calculator. To create and save a quote directly for a client, click the <b>&quot;+ Quote&quot;</b> button on that client&apos;s card.</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Total Area (Sq.Ft) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quoteData.totalSqft}
                    onChange={(e) =>
                      setQuoteData({ ...quoteData, totalSqft: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Rate per Sq.Ft (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quoteData.ratePerSqft}
                    onChange={(e) =>
                      setQuoteData({ ...quoteData, ratePerSqft: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Hardware, Fittings & Labor Add-ons (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quoteData.hardwareAddons}
                    onChange={(e) =>
                      setQuoteData({ ...quoteData, hardwareAddons: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Window Specifications / Notes
                  </label>
                  <input
                    type="text"
                    value={quoteData.notes}
                    onChange={(e) =>
                      setQuoteData({ ...quoteData, notes: e.target.value })
                    }
                    placeholder="e.g. UPVC 3-Track Sliding with Mesh"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Price Calculation Output Box */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2 mt-4">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Profile + Glass ({quoteData.totalSqft} sq.ft):</span>
                    <span className="font-medium">₹{calculatedMaterial.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Fittings & Labor:</span>
                    <span className="font-medium">
                      ₹{Number(quoteData.hardwareAddons || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-amber-500/30 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                    <span>Estimated Total Quote:</span>
                    <span className="text-amber-500 text-base">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuoteModalOpen(false);
                    setTargetClientForQuote(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs font-semibold"
                >
                  Close
                </button>
                {targetClientForQuote && (
                  <button
                    type="button"
                    onClick={handleSaveQuoteToDatabase}
                    disabled={isSavingQuote}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingQuote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Quote for {targetClientForQuote.name}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Project Modal Directly for a Client */}
        {isProjectModalOpen && targetClientForProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  Add Confirmed Project & Billing
                </h3>
                <button
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setTargetClientForProject(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Client Header */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 space-y-0.5">
                <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
                  Client Record
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {targetClientForProject.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {targetClientForProject.company_name ? `${targetClientForProject.company_name} • ` : ""}
                  {targetClientForProject.phone}
                </div>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Project / Work Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    placeholder="e.g. 48 Windows Glazing & Installation"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Contract Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={projectForm.contract_amount}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, contract_amount: Number(e.target.value) })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Advance Received (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={projectForm.amount_received}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, amount_received: Number(e.target.value) })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Project Type
                    </label>
                    <CustomSelect
                      value={projectForm.project_type}
                      onChange={(val) =>
                        setProjectForm({ ...projectForm, project_type: val })
                      }
                      size="sm"
                      options={[
                        { value: "Residential Villa", label: "Residential Villa" },
                        { value: "Commercial / Residential", label: "Commercial / Residential" },
                        { value: "Apartment Complex", label: "Apartment Complex" },
                        { value: "Hospital / Clinic", label: "Hospital / Clinic" },
                        { value: "Showroom / Retail", label: "Showroom / Retail" },
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Initial Status
                    </label>
                    <CustomSelect
                      value={projectForm.status}
                      onChange={(val) =>
                        setProjectForm({
                          ...projectForm,
                          status: val as "planning" | "fabrication" | "installation" | "completed",
                        })
                      }
                      size="sm"
                      options={[
                        { value: "planning", label: "Planning" },
                        { value: "fabrication", label: "Fabrication" },
                        { value: "installation", label: "Installation" },
                        { value: "completed", label: "Completed" },
                      ]}
                    />
                  </div>
                </div>

                {/* Site Location & Target Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Site Location
                    </label>
                    <input
                      type="text"
                      value={projectForm.site_location}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, site_location: e.target.value })
                      }
                      placeholder="e.g. Tanuku Bypass Road"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      Target Completion Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.expected_completion}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, expected_completion: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Site Supervisor (Staff Dropdown + Custom Input) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      Site Supervisor
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <CustomSelect
                    value={projectForm.supervisor_id}
                    onChange={(val) =>
                      setProjectForm({ ...projectForm, supervisor_id: val })
                    }
                    placeholder="-- Select Site Supervisor --"
                    size="sm"
                    options={[
                      { value: "", label: "-- Select Site Supervisor --" },
                      ...staffList.map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.role})`,
                      })),
                      { value: "custom", label: "+ Type New Supervisor Name..." },
                    ]}
                  />
                  {projectForm.supervisor_id === "custom" && (
                    <input
                      type="text"
                      value={projectForm.custom_supervisor}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, custom_supervisor: e.target.value })
                      }
                      placeholder="Enter supervisor's full name"
                      className="w-full mt-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProjectModalOpen(false);
                      setTargetClientForProject(null);
                    }}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProject}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingProject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Project & Update Total Billed
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Quotes History Modal for a Client (With 1-Click Convert to Project) */}
        {viewingQuotesClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    Quotations for {viewingQuotesClient.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {viewingQuotesClient.company_name || viewingQuotesClient.city} • {viewingQuotesClient.phone}
                  </p>
                </div>
                <button
                  onClick={() => setViewingQuotesClient(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quotes List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {viewingQuotesClient.client_quotes && viewingQuotesClient.client_quotes.length > 0 ? (
                  viewingQuotesClient.client_quotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          {q.quote_number || "Quote"}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            q.status === "approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <span>
                          {q.total_sqft ? `${q.total_sqft} sq.ft @ ₹${q.rate_per_sqft}/sq.ft` : "Window estimation"}
                        </span>
                        <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                          ₹{Number(q.total_amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {q.notes && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          {q.notes}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {q.created_at ? new Date(q.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today"}
                        </span>

                        {/* Convert to Active Project Button */}
                        {q.status !== "approved" ? (
                          <button
                            onClick={() => handleConvertQuoteToProject(viewingQuotesClient, q)}
                            disabled={convertingQuoteId === q.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {convertingQuoteId === q.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3" />
                            )}
                            Convert to Active Project
                          </button>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Converted to Project
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No quotes generated yet for this client.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewingQuotesClient(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Projects Modal for a Client */}
        {viewingProjectsClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    Projects for {viewingProjectsClient.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Contract Billing: ₹
                    {viewingProjectsClient.projects
                      ?.reduce((sum, p) => sum + (Number(p.contract_amount) || 0), 0)
                      .toLocaleString("en-IN") || "0"}
                  </p>
                </div>
                <button
                  onClick={() => setViewingProjectsClient(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Projects List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {viewingProjectsClient.projects && viewingProjectsClient.projects.length > 0 ? (
                  viewingProjectsClient.projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-2"
                    >
                      <div className="flex items-start justify-between text-xs gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {p.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            p.status === "completed"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/50 dark:border-slate-800">
                        <div>
                          <div className="text-[10px] text-slate-400">Contract Amount</div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            ₹{Number(p.contract_amount || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Amount Received</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{Number(p.amount_received || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Location, Target Date, Site Supervisor */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {p.site_location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{p.site_location}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-0.5">
                          {p.expected_completion && (
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>
                                Target:{" "}
                                {new Date(p.expected_completion).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                          {(p.supervisor_name || p.staff?.name) && (
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                              <User className="w-3 h-3 shrink-0" />
                              <span>Supervisor: {p.supervisor_name || p.staff?.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                    <p>No active or completed projects found for this client yet.</p>
                    <p className="text-[11px] text-slate-500">
                      You can convert any quote into a project, or add a project directly below.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewingProjectsClient(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onboard / Edit Client Modal */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  {editingClient ? "Edit Client Details" : "Onboard New Client"}
                </h3>
                <button
                  onClick={() => setIsClientModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientForm.name}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, name: e.target.value })
                      }
                      placeholder="e.g. Anand Varma"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientForm.phone}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, phone: e.target.value })
                      }
                      placeholder="+91 94401 XXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Company / Firm Name
                    </label>
                    <input
                      type="text"
                      value={clientForm.company_name}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, company_name: e.target.value })
                      }
                      placeholder="Optional (e.g. Varma Builders)"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, email: e.target.value })
                      }
                      placeholder="client@gmail.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      City / Town
                    </label>
                    <input
                      type="text"
                      value={clientForm.city}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, city: e.target.value })
                      }
                      placeholder="Tanuku"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Source
                    </label>
                    <CustomSelect
                      value={clientForm.source}
                      onChange={(val) =>
                        setClientForm({ ...clientForm, source: val })
                      }
                      size="sm"
                      options={[
                        { value: "Walk-in", label: "Walk-in" },
                        { value: "Website", label: "Website" },
                        { value: "Referral", label: "Referral" },
                        { value: "Architect Partner", label: "Architect Partner" },
                        { value: "Phone", label: "Phone" },
                        { value: "Social Media", label: "Social Media" },
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Client Status
                    </label>
                    <CustomSelect
                      value={clientForm.status}
                      onChange={(val) =>
                        setClientForm({
                          ...clientForm,
                          status: val as "active" | "completed" | "prospect" | "inactive",
                        })
                      }
                      size="sm"
                      options={[
                        { value: "active", label: "Active" },
                        { value: "prospect", label: "Prospect" },
                        { value: "completed", label: "Completed" },
                        { value: "inactive", label: "Inactive" },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Site / Billing Address
                  </label>
                  <textarea
                    rows={2}
                    value={clientForm.address}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, address: e.target.value })
                    }
                    placeholder="Door No, Street, Landmark..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClient}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingClient && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingClient ? "Save Changes" : "Save Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Delete Client Profile?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    &quot;{deleteTarget.name}&quot;
                  </span>
                  ? This will remove the client profile and associated records from the database.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteClient}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Client
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
