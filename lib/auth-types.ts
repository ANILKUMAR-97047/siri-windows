export type AdminRole = "super_admin" | "admin";

export type PermissionKey =
  | "overview"
  | "leads"
  | "clients"
  | "projects"
  | "staff"
  | "attendance"
  | "salaries"
  | "expenses"
  | "stock"
  | "pricing"
  | "gallery"
  | "website"
  | "users";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  status: "active" | "inactive";
  last_login_at?: string | null;
  created_at?: string;
}

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  exp: number;
}

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string }[] = [
  { key: "overview", label: "Dashboard Overview", description: "View analytics & high-level operational counters" },
  { key: "leads", label: "Leads Management", description: "View, assign & update inquiries from clients" },
  { key: "clients", label: "Clients & Quotes", description: "Manage customer directory & quotation generation" },
  { key: "projects", label: "Projects Management", description: "Track UPVC/Aluminium fabrication & installation orders" },
  { key: "staff", label: "Staff & Team Directory", description: "Manage workforce, designations, and contact numbers" },
  { key: "attendance", label: "Staff Attendance & Time", description: "Daily register, check-ins, leaves & overtime hours" },
  { key: "salaries", label: "Salary Records & Payroll", description: "Log monthly disbursements, allowances & deductions" },
  { key: "expenses", label: "Admin Daily Expenses", description: "Maintain owner's daily company & personal financial ledger" },
  { key: "stock", label: "Stock & Materials", description: "Manage raw inventory, profile bars & hardware count" },
  { key: "pricing", label: "Pricing Packages", description: "Edit sq.ft rates, series specifications & package cards" },
  { key: "gallery", label: "Gallery Manager", description: "Upload & organize showroom photos on public website" },
  { key: "website", label: "Website Dynamic Data", description: "Edit hero banners, brand copy & contact info" },
];

export const SESSION_COOKIE_NAME = "siri_admin_session";

// Helper to check if a user has permission for a specific module
export function checkPermission(
  userRole: AdminRole,
  userPermissions: string[],
  key: PermissionKey
): boolean {
  if (userRole === "super_admin") return true;
  if (userPermissions.includes("*")) return true;
  return userPermissions.includes(key);
}
