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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { CustomSelect } from "@/components/ui/Select";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectsQuery, useClientsQuery, useStaffListQuery, queryKeys } from "@/lib/queries";

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

  // Modals state
  // Payment Recording Modal State
  const [paymentProject, setPaymentProject] = useState<ProjectRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
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

  // Fetch all projects, clients, and staff from Supabase
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Projects joined with Clients and Supervisor Staff
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
        // Map with calculated progress and stages
        const formatted = (projData as unknown as ProjectRecord[]).map((p) => {
          const { progress, stage } = getStageAndProgress(p.status, p.progress);
          return { ...p, progress, stage };
        });
        setProjects(formatted);
      }

      // 2. Fetch Clients for dropdown
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, company_name, phone, city, address")
        .order("name", { ascending: true });

      if (clientsData) {
        setClientsList(clientsData as unknown as ClientRef[]);
      }

      // 3. Fetch Staff for supervisors dropdown
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, name, phone, role")
        .order("name", { ascending: true });

      if (staffData) {
        setStaffList(staffData as unknown as StaffRef[]);
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

    // Optimistic UI update
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

  // Record additional payment received
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProject) return;

    const addedAmount = Number(paymentAmount.replace(/[^0-9]/g, "")) || 0;
    if (addedAmount <= 0) {
      showToast("error", "Please enter a valid payment amount.");
      return;
    }

    setSavingPayment(true);
    try {
      const newTotalReceived = Number(paymentProject.amount_received || 0) + addedAmount;
      const { error } = await (supabase.from("projects") as any)
        .update({
          amount_received: newTotalReceived,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentProject.id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === paymentProject.id ? { ...p, amount_received: newTotalReceived } : p
        )
      );

      showToast(
        "success",
        `Payment of ₹${addedAmount.toLocaleString("en-IN")} recorded for ${paymentProject.title}!`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      setPaymentProject(null);
      setPaymentAmount("");
    } catch (err: any) {
      console.error("Error recording payment:", err);
      showToast("error", err.message || "Failed to update payment record.");
    } finally {
      setSavingPayment(false);
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

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesFilter = filterStatus === "all" ? true : p.status === filterStatus;
      const clientName = (p.clients?.company_name || p.clients?.name || "").toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.includes(searchQuery.toLowerCase()) ||
        (p.site_location || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [projects, filterStatus, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: projects.length,
      planning: projects.filter((p) => p.status === "planning").length,
      fabrication: projects.filter((p) => p.status === "fabrication").length,
      installation: projects.filter((p) => p.status === "installation").length,
      completed: projects.filter((p) => p.status === "completed").length,
    };
  }, [projects]);

  return (
    <PermissionGuard permission="projects">
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
                <Briefcase className="w-5 h-5 text-amber-500" />
                Projects & Manufacturing Operations
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {projects.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live manufacturing tracking synchronized with Clients & Quotes and Quotation conversion.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Refresh Projects from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-500" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  filterStatus === tab.id
                    ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm font-bold"
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
              placeholder="Search project, builder, city..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading dynamic projects & manufacturing pipeline from Supabase...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              No projects found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No projects match "${searchQuery}".`
                : "No projects match the selected status tab. Projects converted from leads & quotes will appear here automatically."}
            </p>
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

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 hover:border-amber-500/40 transition"
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
                          <Building className="w-3 h-3 text-slate-400" />
                          Client: <strong className="text-slate-800 dark:text-slate-200">{clientDisplayName}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {p.site_location || p.clients?.city || "Tanuku"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
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
                      <span>
                        Start:{" "}
                        {p.start_date
                          ? new Date(p.start_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recently"}
                      </span>
                      <span>
                        Target Handover:{" "}
                        {p.expected_completion
                          ? new Date(p.expected_completion).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Within 30 Days"}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400">Total Contract</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          ₹{contractVal.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Received</div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                          ₹{receivedVal.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPaymentProject(p);
                          setPaymentAmount("");
                        }}
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded-md transition cursor-pointer"
                        title="Record payment received"
                      >
                        + Payment
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">Balance Pending</div>
                      <div className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                        ₹{balanceVal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Record Payment Modal */}
        {paymentProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Record Project Payment
                </h3>
                <button
                  onClick={() => setPaymentProject(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">{paymentProject.title}</div>
                <div className="text-slate-500 dark:text-slate-400">
                  Total Contract: ₹{Number(paymentProject.contract_amount).toLocaleString("en-IN")} | Currently Received: ₹{Number(paymentProject.amount_received).toLocaleString("en-IN")}
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Amount to Add (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaymentProject(null)}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    {savingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Project Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
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
                  ? This will remove the project from the database and reduce the client&apos;s Total Billed.
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
