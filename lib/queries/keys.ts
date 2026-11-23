/**
 * Centralized, Type-Safe Query Keys for TanStack Query
 * Enables precise cache invalidation and eliminates typos across components
 */

export const queryKeys = {
  staff: {
    all: ["staff"] as const,
    list: () => [...queryKeys.staff.all, "list"] as const,
    detail: (id: string) => [...queryKeys.staff.all, "detail", id] as const,
  },
  advances: {
    all: ["staff_advances"] as const,
    byStaff: (staffId?: string) =>
      [...queryKeys.advances.all, "staff", staffId || "all"] as const,
    byMonthYear: (month?: number, year?: number, staffId?: string) =>
      [...queryKeys.advances.all, "filter", { month, year, staffId }] as const,
  },
  salaries: {
    all: ["salary_records"] as const,
    byMonthYear: (month?: number | string, year?: number | string) =>
      [...queryKeys.salaries.all, "filter", { month, year }] as const,
    byStaff: (staffId: string) =>
      [...queryKeys.salaries.all, "staff", staffId] as const,
  },
  attendance: {
    all: ["attendance_logs"] as const,
    byDate: (date: string) =>
      [...queryKeys.attendance.all, "date", date] as const,
    byMonth: (month: number, year: number) =>
      [...queryKeys.attendance.all, "month", { month, year }] as const,
  },
  expenses: {
    all: ["admin_expenses"] as const,
    byMonthYear: (month?: number, year?: number, type?: string) =>
      [...queryKeys.expenses.all, "filter", { month, year, type }] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: () => [...queryKeys.leads.all, "list"] as const,
  },
  quotes: {
    all: ["quotes"] as const,
    list: () => [...queryKeys.quotes.all, "list"] as const,
  },
  clients: {
    all: ["clients"] as const,
    list: () => [...queryKeys.clients.all, "list"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: () => [...queryKeys.projects.all, "list"] as const,
  },
  materials: {
    all: ["materials"] as const,
    list: () => [...queryKeys.materials.all, "list"] as const,
  },
  materialCategories: {
    all: ["material_categories"] as const,
    list: () => [...queryKeys.materialCategories.all, "list"] as const,
  },
  stockTransactions: {
    all: ["stock_transactions"] as const,
    list: (filters?: { material_id?: string; type?: string }) =>
      [...queryKeys.stockTransactions.all, "list", filters || {}] as const,
  },
  packages: {
    all: ["pricing_packages"] as const,
    list: () => [...queryKeys.packages.all, "list"] as const,
  },
  gallery: {
    all: ["gallery_items"] as const,
    list: () => [...queryKeys.gallery.all, "list"] as const,
  },
};
