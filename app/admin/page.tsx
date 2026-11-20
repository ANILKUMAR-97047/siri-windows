import Link from "next/link";
import {
  PhoneCall,
  Briefcase,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { getAdminClient } from "@/lib/supabase/admin";
import PermissionGuard from "@/components/admin/PermissionGuard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = getAdminClient();

  // 1. Fetch live metrics from Supabase
  const [
    { count: leadsCount, data: recentLeadsData },
    { count: projectsCount, data: activeProjectsData },
    { count: materialsCount, data: lowStockData },
    { count: staffCount },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("projects")
      .select("*, clients(name)")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("materials")
      .select("*", { count: "exact" })
      .filter("current_stock", "lte", "reorder_level"),
    supabase.from("staff").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      title: "New & Active Leads",
      value: String(leadsCount ?? 0),
      subtext: "Live customer inquiries in CRM",
      icon: PhoneCall,
      href: "/admin/leads",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Ongoing Projects",
      value: String(projectsCount ?? 0),
      subtext: "Active in fabrication/site work",
      icon: Briefcase,
      href: "/admin/projects",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Warehouse Materials",
      value: `${materialsCount ?? 0} Low Stock`,
      subtext: "Items needing replenishment",
      icon: Package,
      href: "/admin/stock",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      alert: (lowStockData?.length ?? 0) > 0,
    },
    {
      title: "Team & Technicians",
      value: `${staffCount ?? 0} Active`,
      subtext: "Fabricators, glaziers, installers",
      icon: Users,
      href: "/admin/staff",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <PermissionGuard permission="overview">
      <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-700/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected to Supabase PostgreSQL (ap-south-1)
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Operational Command Center
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Track customer inquiries, manufacturing inventory, fabrication stages, daily staff maintenance, and update dynamic content on your live public website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Inquiry / Lead
            </Link>
            <Link
              href="/admin/website"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs transition active:scale-95"
            >
              Update Website Content
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-amber-500/40 transition group"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-lg ${stat.bgColor} ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {stat.alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  )}
                  <span>{stat.subtext}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Split: Recent Leads & Ongoing Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Leads from Supabase */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-500" />
                Live Customer Inquiries & Leads (from Supabase DB)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct inquiries from the website contact form and client visits
              </p>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Manage All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Client Name</th>
                  <th className="py-2.5 px-3 font-semibold">Requirement</th>
                  <th className="py-2.5 px-3 font-semibold">Location</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(recentLeadsData ?? []).map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{lead.phone}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="truncate text-slate-600 dark:text-slate-300">
                        {lead.product_interest || "General Window Inquiry"}
                      </div>
                      <span className="text-[10px] text-slate-400">{lead.source}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {lead.city || "Tanuku"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 capitalize">
                        {(lead.status || "new").replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href="/admin/leads"
                        className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 span): Active Projects & Low Stock */}
        <div className="space-y-6">
          {/* Projects Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                Live Projects (Supabase)
              </h3>
              <Link
                href="/admin/projects"
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                All Projects
              </Link>
            </div>

            <div className="space-y-4">
              {(activeProjectsData ?? []).map((p: any) => (
                <div key={p.id} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.title}
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 capitalize">
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{p.site_location}</span>
                    <span>₹{Number(p.contract_amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Reorder Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Low Stock Alert ({lowStockData?.length ?? 0} items)
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              {(lowStockData?.length ?? 0) > 0 ? (
                <>
                  {lowStockData?.map((m: any) => m.name).join(", ")} are nearing minimum reserve in Tanuku workshop.
                </>
              ) : (
                "All warehouse materials are currently above reorder threshold."
              )}
            </p>
            <Link
              href="/admin/stock"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
            >
              View Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
      </div>
    </PermissionGuard>
  );
}
