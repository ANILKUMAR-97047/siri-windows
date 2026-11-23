/**
 * Siri Windows Date & Timezone Utilities
 * Standardized on Indian Standard Time (IST, Asia/Kolkata, UTC+5:30)
 */

/**
 * Returns today's date string as 'YYYY-MM-DD' in Indian Standard Time (Asia/Kolkata).
 * Automatically flips at exactly 12:00:00 AM midnight local Indian time.
 */
export function getTodayDateString(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Add or subtract days from a 'YYYY-MM-DD' date string safely without UTC skew.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    // Setting noon (12:00) avoids any DST or midnight rollover edge cases
    const d = new Date(year, month - 1, day, 12, 0, 0);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats a 'YYYY-MM-DD' date into a long title (e.g. 'Tuesday, 24 November 2026')
 */
export function formatDateTitle(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day, 12, 0, 0);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a date into a compact string (e.g. '24 Nov 2026')
 */
export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const cleanDate = dateStr.split("T")[0];
    const [year, month, day] = cleanDate.split("-").map(Number);
    const d = new Date(year, month - 1, day, 12, 0, 0);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr || "";
  }
}
