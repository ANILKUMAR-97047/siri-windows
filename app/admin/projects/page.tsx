"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Search,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  IndianRupee,
  RefreshCw,
  Loader2,
  Trash2,
  Building,
  User,
  CreditCard,
  Pencil,
  Receipt,
  History,
  Banknote,
  QrCode,
  ArrowDownRight,
  Info,
  Plus,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { CustomSelect } from "@/components/ui/Select";
import { confirmModal } from "@/components/ui/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProjectsQuery,
  useClientsQuery,
  useStaffListQuery,
  useProjectPaymentsQuery,
  queryKeys,
  type ProjectPayment,
} from "@/lib/queries";

interface ClientRef {
  id: string;
  name: string;
  company_name: string | null;
  phone: string;
  city: string;
  address: string | null;
}

interface StaffRef {
  id: string;
  name: string;
  phone: string;
  role: string;
}

interface ProjectRecord {
  id: string;
  title: string;
  client_id: string;
  lead_id?: string | null;
  site_location: string;
  project_type: string;
  status: "planning" | "fabrication" | "installation" | "completed" | "on_hold";
  start_date: string | null;
  expected_completion: string | null;
  actual_completion?: string | null;
  contract_amount: number;
  amount_received: number;
  supervisor_name?: string | null;
  supervisor_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  clients?: ClientRef | null;
  staff?: StaffRef | null;
  // Computed progress & stage
  progress?: number;
  stage?: string;
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  // Prevent SSR date hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: cachedProjects = [], isLoading: queryLoading, refetch: refetchProjects } = useProjectsQuery();
  const { data: cachedClients = [] } = useClientsQuery();
  const { data: cachedStaff = [] } = useStaffListQuery();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [clientsList, setClientsList] = useState<ClientRef[]>([]);
  const [staffList, setStaffList] = useState<StaffRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Payment History Drawer / Modal State
  const [historyProject, setHistoryProject] = useState<ProjectRecord | null>(null);
  const {
    data: projectPayments = [],
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useProjectPaymentsQuery(historyProject?.id);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Upgraded Payment Recording Modal State
  const [paymentProject, setPaymentProject] = useState<ProjectRecord | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "UPI / PhonePe",
    stage: "Advance (Booking / Material Procurement)",
    referenceId: "",
    receivedBy: "",
    notes: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Helper to compute progress and stage based on status or progress value
  const getStageAndProgress = (status: string, customProgress?: number) => {
    if (customProgress !== undefined) {
      if (customProgress >= 100) return { progress: 100, stage: "Completed & Handover Signed" };
      if (customProgress >= 70) return { progress: customProgress, stage: "Site Glazing & Installation" };
      if (customProgress >= 30) return { progress: customProgress, stage: "Frame Fabrication & Welding" };
      return { progress: customProgress, stage: "Initial Measurement & Planning" };
    }

    switch (status) {
      case "completed":
        return { progress: 100, stage: "Completed & Handover Signed" };
      case "installation":
        return { progress: 75, stage: "Glazing & Site Installation" };
      case "fabrication":
        return { progress: 45, stage: "UPVC Frame Fabrication & Reinforcement" };
      case "on_hold":
        return { progress: 20, stage: "Project On Hold" };
      case "planning":
      default:
        return { progress: 15, stage: "Initial Measurement & Planning" };
    }
  };

  // Instant zero-latency loading from cache
  useEffect(() => {
    if (cachedProjects && cachedProjects.length > 0) {
      const formatted = (cachedProjects as unknown as ProjectRecord[]).map((p) => {
        const { progress, stage } = getStageAndProgress(p.status, p.progress);
        return { ...p, progress, stage };
      });
      setProjects(formatted);
      setLoading(false);
    } else if (!queryLoading) {
      setLoading(false);
    }
  }, [cachedProjects, queryLoading]);

  useEffect(() => {
    if (cachedClients && cachedClients.length > 0) {
      setClientsList(cachedClients as unknown as ClientRef[]);
    }
  }, [cachedClients]);

  useEffect(() => {
    if (cachedStaff && cachedStaff.length > 0) {
      setStaffList(cachedStaff as unknown as StaffRef[]);
    }
  }, [cachedStaff]);

  // Fetch all projects, clients, and staff from Supabase
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: projData, error: projError } = await supabase
        .from("projects")
        .select(`
          *,
          clients (
            id,
            name,
            company_name,
            phone,
            city,
            address
          ),
          staff:supervisor_id (
            id,
            name,
            phone,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (projError) {
        console.error("Error fetching projects:", projError);
        showToast("error", "Failed to fetch projects: " + projError.message);
      } else if (projData) {
        const formatted = (projData as unknown as ProjectRecord[]).map((p) => {
          const { progress, stage } = getStageAndProgress(p.status, p.progress);
          return { ...p, progress, stage };
        });
        setProjects(formatted);
      }
    } catch (err: any) {
      console.error("Unexpected error fetching projects data:", err);
      showToast("error", "Connection error fetching projects.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Status in Supabase on the fly
  const updateProjectStatus = async (id: string, newStatus: ProjectRecord["status"]) => {
    const { progress, stage } = getStageAndProgress(newStatus);

    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, progress, stage } : p))
    );

    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "completed") {
        updates.actual_completion = new Date().toISOString().split("T")[0];
      }

      const { error } = await (supabase.from("projects") as any)
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      showToast("success", `Project status updated to ${newStatus.toUpperCase()}.`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showToast("error", "Failed to update project status.");
      fetchData();
    }
  };

  // Update Progress Slider & Stage
  const updateProgress = async (id: string, newProgress: number) => {
    let newStatus: ProjectRecord["status"] = "planning";
    let newStage = "Initial Measurement & Planning";

    if (newProgress >= 100) {
      newStatus = "completed";
      newStage = "Completed & Handover Signed";
    } else if (newProgress >= 70) {
      newStatus = "installation";
      newStage = "Site Glazing & Installation";
    } else if (newProgress >= 30) {
      newStatus = "fabrication";
      newStage = "Frame Fabrication & Welding";
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, progress: newProgress, status: newStatus, stage: newStage } : p
      )
    );

    try {
      await (supabase.from("projects") as any)
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  // Record additional payment received (Saves to relational project_payments & auto-syncs balance)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProject) return;

    const amt = Number(paymentForm.amount.replace(/[^0-9]/g, ""));
    if (!amt || amt <= 0) {
      showToast("error", "Please enter a valid payment amount greater than 0.");
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch("/api/admin/projects/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: paymentProject.id,
          amount: amt,
          payment_date: paymentForm.paymentDate || new Date().toISOString().split("T")[0],
          payment_mode: paymentForm.paymentMode,
          stage: paymentForm.stage,
          reference_id: paymentForm.referenceId.trim() || null,
          received_by: paymentForm.receivedBy.trim() || null,
          notes: paymentForm.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      const newTotal = data.new_amount_received ?? Number(paymentProject.amount_received || 0) + amt;

      // Optimistic UI updates
      setProjects((prev) =>
        prev.map((p) => (p.id === paymentProject.id ? { ...p, amount_received: newTotal } : p))
      );

      if (historyProject && historyProject.id === paymentProject.id) {
        setHistoryProject((prev) => (prev ? { ...prev, amount_received: newTotal } : null));
        await refetchPayments();
      }

      showToast(
        "success",
        `Payment of ₹${amt.toLocaleString("en-IN")} recorded via ${paymentForm.paymentMode}!`
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projectPayments.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
      ]);

      setPaymentProject(null);
      setPaymentForm({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: "UPI / PhonePe",
        stage: "Advance (Booking / Material Procurement)",
        referenceId: "",
        receivedBy: "",
        notes: "",
      });
    } catch (err: any) {
      console.error("Error recording payment:", err);
      showToast("error", err.message || "Failed to save payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  // Delete payment record from ledger (and auto-deducts from project balance)
  const handleDeletePayment = async (paymentId: string) => {
    if (!historyProject) return;

    const confirmed = await confirmModal({
      title: "Delete Payment Record?",
      message:
        "Are you sure you want to delete this payment record?\n\nThe project's received balance and remaining due will be automatically adjusted and synchronized.",
      type: "danger",
      confirmText: "Delete Payment",
      cancelText: "Keep Record",
    });
    if (!confirmed) return;

    setDeletingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/admin/projects/payments?id=${paymentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete payment");
      }

      const newTotal = data.new_amount_received ?? 0;
      setProjects((prev) =>
        prev.map((p) => (p.id === historyProject.id ? { ...p, amount_received: newTotal } : p))
      );
      setHistoryProject((prev) => (prev ? { ...prev, amount_received: newTotal } : null));

      await Promise.all([
        refetchPayments(),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projectPayments.all }),
      ]);

      showToast("success", "Payment record removed and project balance synchronized.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete payment");
    } finally {
      setDeletingPaymentId(null);
    }
  };

  // Delete Project Handler
  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", deleteTarget.id);
      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      showToast("success", `Project "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Error deleting project:", err);
      showToast("error", err.message || "Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesFilter = filterStatus === "all" ? true : p.status === filterStatus;
      const clientName = (p.clients?.company_name || p.clients?.name || "").toLowerCase();
      const supervisorName = (p.supervisor_name || p.staff?.name || "").toLowerCase();
      const siteLoc = (p.site_location || p.clients?.city || "").toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.includes(searchQuery.toLowerCase()) ||
        supervisorName.includes(searchQuery.toLowerCase()) ||
        siteLoc.includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [projects, filterStatus, searchQuery]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: projects.length,
      planning: projects.filter((p) => p.status === "planning").length,
      fabrication: projects.filter((p) => p.status === "fabrication").length,
      installation: projects.filter((p) => p.status === "installation").length,
      completed: projects.filter((p) => p.status === "completed").length,
    };
  }, [projects]);

  // Open Record Payment Modal with prefill
  const openPaymentModal = (p: ProjectRecord) => {
    setPaymentProject(p);
    setPaymentForm({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMode: "UPI / PhonePe",
      stage: p.amount_received === 0
        ? "Advance (Booking / Material Procurement)"
        : "Fabrication Stage (Mid-term)",
      referenceId: "",
      receivedBy: p.supervisor_name || "",
      notes: "",
    });
  };

  // Format date safely
  const formatDateDisplay = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Recently";
    if (!isMounted) return dateStr.slice(0, 10);
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format currency
  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // Payment mode badge styling helper
  const getPaymentModeBadge = (mode: string) => {
    const m = (mode || "").toLowerCase();
    if (m.includes("upi") || m.includes("phonepe") || m.includes("gpay")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          <QrCode className="w-3 h-3" /> UPI / PhonePe
        </span>
      );
    }
    if (m.includes("cash")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Banknote className="w-3 h-3" /> CASH
        </span>
      );
    }
    if (m.includes("cheque")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          <Receipt className="w-3 h-3" /> CHEQUE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
        <CreditCard className="w-3 h-3" /> BANK TRANSFER
      </span>
    );
  };

  return (
    <PermissionGuard permission="projects">
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white animate-in slide-in-from-top-3 ${
              notification.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Briefcase className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Projects & Manufacturing Operations
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold">
                {projects.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live manufacturing tracking synchronized with individual client payment history & stage milestones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-500" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: `All Projects (${counts.all})` },
              { id: "planning", label: `Planning (${counts.planning})` },
              { id: "fabrication", label: `Fabrication (${counts.fabrication})` },
              { id: "installation", label: `Installation (${counts.installation})` },
              { id: "completed", label: `Completed (${counts.completed})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterStatus === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
              placeholder="Search project, client, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <p className="text-xs">Loading manufacturing operations & payments...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 space-y-2">
            <Briefcase className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-xs font-semibold">No active projects match your filters.</p>
          </div>
        )}

        {/* Projects List Cards */}
        {!loading && filteredProjects.length > 0 && (
          <div className="space-y-4">
            {filteredProjects.map((p) => {
              const contractVal = Number(p.contract_amount || 0);
              const receivedVal = Number(p.amount_received || 0);
              const balanceVal = Math.max(0, contractVal - receivedVal);
              const clientDisplayName =
                p.clients?.company_name || p.clients?.name || "Client";
              const supervisorName =
                p.supervisor_name || p.staff?.name || "Not Assigned";
              const paymentPct = contractVal > 0 ? Math.round((receivedVal / contractVal) * 100) : 0;

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 hover:border-amber-500/40 transition shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          #{p.id.slice(0, 8).toUpperCase()}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {p.title}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          Client: <strong className="text-slate-800 dark:text-slate-200">{clientDisplayName}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {p.site_location || p.clients?.city || "Tanuku"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Supervisor: {supervisorName}
                        </span>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <CustomSelect
                        value={p.status}
                        onChange={(val) =>
                          updateProjectStatus(p.id, val as ProjectRecord["status"])
                        }
                        size="sm"
                        options={[
                          { value: "planning", label: "PLANNING" },
                          { value: "fabrication", label: "FABRICATION" },
                          { value: "installation", label: "INSTALLATION" },
                          { value: "completed", label: "COMPLETED" },
                          { value: "on_hold", label: "ON HOLD" },
                        ]}
                      />
                      <button
                        onClick={() => setDeleteTarget({ id: p.id, title: p.title })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Slider & Stage */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Current Stage:{" "}
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {p.stage || "Initial Planning & Cutting"}
                        </span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.progress || 15}% Complete
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={p.progress || 15}
                        onChange={(e) => updateProgress(p.id, Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Start: {formatDateDisplay(p.start_date)}</span>
                      <span>Target Handover: {formatDateDisplay(p.expected_completion)}</span>
                    </div>
                  </div>

                  {/* Financial Metrics with Dedicated Payment History & Record Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    {/* Total Contract */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Total Contract</div>
                        <div className="font-bold text-slate-900 dark:text-white text-base">
                          {formatCurrency(contractVal)}
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center text-slate-500">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Received with History and Add Payment buttons */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          Received ({paymentPct}%)
                        </div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                          {formatCurrency(receivedVal)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setHistoryProject(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition shadow-2xs cursor-pointer"
                          title="View Payment History Ledger for this project"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          History
                        </button>
                        <button
                          onClick={() => openPaymentModal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer"
                          title="Record payment received"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Payment
                        </button>
                      </div>
                    </div>

                    {/* Balance Pending */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Balance Pending</div>
                        <div className="font-bold text-amber-700 dark:text-amber-300 text-base">
                          {formatCurrency(balanceVal)}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        balanceVal === 0
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {balanceVal === 0 ? "PAID IN FULL" : "PAYMENT DUE"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* PAYMENT HISTORY & MILESTONE LEDGER DRAWER / MODAL         */}
        {/* ======================================================== */}
        {historyProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 my-auto shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Receipt className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      Client Payment History & Ledger
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {historyProject.title} • Client:{" "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {historyProject.clients?.company_name || historyProject.clients?.name || "Client"}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryProject(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Contract</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mt-0.5">
                    {formatCurrency(historyProject.contract_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Total Received</div>
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mt-0.5">
                    {formatCurrency(historyProject.amount_received)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Pending Balance</div>
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 text-sm sm:text-base mt-0.5">
                    {formatCurrency(Math.max(0, historyProject.contract_amount - historyProject.amount_received))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Collection Progress</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mt-0.5">
                    {historyProject.contract_amount > 0
                      ? Math.round((historyProject.amount_received / historyProject.contract_amount) * 100)
                      : 0}
                    %
                  </div>
                </div>
              </div>

              {/* Sub-header with Add Payment Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-500" />
                  Recorded Installments ({projectPayments.length})
                </span>
                <button
                  onClick={() => openPaymentModal(historyProject)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Record Payment
                </button>
              </div>

              {/* Payments Ledger Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5 font-semibold">Date</th>
                      <th className="py-3 px-3.5 font-semibold">Amount Paid</th>
                      <th className="py-3 px-3.5 font-semibold">Payment Mode</th>
                      <th className="py-3 px-3.5 font-semibold">Milestone / Stage</th>
                      <th className="py-3 px-3.5 font-semibold">Transaction Ref</th>
                      <th className="py-3 px-3.5 font-semibold">Received By & Notes</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paymentsLoading ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-500 mb-2" />
                          Loading payment ledger...
                        </td>
                      </tr>
                    ) : projectPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 space-y-2">
                          <Receipt className="w-8 h-8 mx-auto opacity-30" />
                          <div className="font-semibold text-xs">No detailed installments recorded in the ledger yet.</div>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                            Click &quot;+ Record Payment&quot; above to log an advance, fabrication installment, or site settlement.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      projectPayments.map((pay) => (
                        <tr
                          key={pay.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                            {formatDateDisplay(pay.payment_date)}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                              + {formatCurrency(pay.amount)}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {getPaymentModeBadge(pay.payment_mode)}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                              {pay.stage || "Milestone Payment"}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {pay.reference_id || "—"}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 max-w-xs">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {pay.received_by ? `Collector: ${pay.received_by}` : ""}
                            </div>
                            <div className="text-slate-400 text-[11px] truncate">
                              {pay.notes || "—"}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeletePayment(pay.id)}
                              disabled={deletingPaymentId === pay.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="Delete payment record"
                            >
                              {deletingPaymentId === pay.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Notice */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>
                  All payments are stored with individual relationships and audit history.
                </span>
                <button
                  type="button"
                  onClick={() => setHistoryProject(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* UPGRADED RECORD PROJECT PAYMENT MODAL                    */}
        {/* ======================================================== */}
        {paymentProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 my-auto shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Record Project Payment
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Logs installment into payment history and updates project balance.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPaymentProject(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Project Financial Summary Card */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {paymentProject.title}
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                  <span>Total Contract: <strong>{formatCurrency(paymentProject.contract_amount)}</strong></span>
                  <span>Currently Paid: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(paymentProject.amount_received)}</strong></span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold pt-0.5">
                  Current Balance Due: {formatCurrency(Math.max(0, paymentProject.contract_amount - paymentProject.amount_received))}
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
                {/* 1. Payment Amount */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-extrabold text-base focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {Number(paymentForm.amount) > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Remaining balance after this payment:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {formatCurrency(
                          Math.max(
                            0,
                            paymentProject.contract_amount -
                              (Number(paymentProject.amount_received || 0) + Number(paymentForm.amount))
                          )
                        )}
                      </strong>
                    </div>
                  )}
                </div>

                {/* 2. Payment Date & Payment Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Payment Mode *
                    </label>
                    <CustomSelect
                      value={paymentForm.paymentMode}
                      onChange={(val) => setPaymentForm({ ...paymentForm, paymentMode: val })}
                      size="sm"
                      dark={true}
                      options={[
                        { value: "UPI / PhonePe", label: "UPI / PhonePe / GPay" },
                        { value: "Cash", label: "Cash Payment" },
                        { value: "Bank Transfer", label: "Bank Transfer (NEFT/RTGS/IMPS)" },
                        { value: "Cheque", label: "Bank Cheque" },
                      ]}
                    />
                  </div>
                </div>

                {/* 3. Milestone / Stage */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Milestone / Stage *
                  </label>
                  <CustomSelect
                    value={paymentForm.stage}
                    onChange={(val) => setPaymentForm({ ...paymentForm, stage: val })}
                    size="sm"
                    dark={true}
                    options={[
                      { value: "Advance (Booking / Material Procurement)", label: "Advance (Booking / Material Procurement)" },
                      { value: "Fabrication Stage (Mid-term)", label: "Fabrication Stage (Mid-term Progress)" },
                      { value: "Pre-Dispatch / Delivery Installment", label: "Pre-Dispatch / Delivery Installment" },
                      { value: "Site Glazing & Installation", label: "Site Glazing & Installation Installment" },
                      { value: "Final Settlement / Handover", label: "Final Settlement / Handover" },
                      { value: "Other Installment", label: "Other / Part Payment" },
                    ]}
                  />
                </div>

                {/* 4. Reference ID & Received By */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Transaction / Ref ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI Ref # / Cheque #"
                      value={paymentForm.referenceId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Received By (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. S. Rambabu (Supervisor)"
                      value={paymentForm.receivedBy}
                      onChange={(e) => setPaymentForm({ ...paymentForm, receivedBy: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 5. Notes / Remarks */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handed over cash at site; receipt given"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaymentProject(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    {savingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Payment to Ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Project Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 my-auto shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Delete Project?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    &quot;{deleteTarget.title}&quot;
                  </span>
                  ? This will permanently remove the project and its payment history.
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
                  type="submit"
                  onClick={confirmDeleteProject}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
