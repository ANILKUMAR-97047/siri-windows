"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Banknote,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Sparkles,
  Save,
  Check,
  UserX,
  UserCheck,
  Search,
  AlertCircle,
  FileText,
  Printer,
  Download,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import AttendancePdfModal from "@/components/admin/AttendancePdfModal";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  base_salary: number;
  photo_url?: string | null;
  status: string; // "active" | "on_leave" | "inactive"
  join_date: string;
  phone?: string;
}

interface AttendanceRecord {
  id?: string;
  staff_id: string;
  date: string;
  status: "present" | "half_day" | "absent" | "on_leave" | "holiday";
  check_in_time?: string | null;
  check_out_time?: string | null;
  overtime_hours?: number;
  notes?: string | null;
  staff?: StaffMember;
}

export default function StaffAttendancePage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [monthlyMap, setMonthlyMap] = useState<
    Record<
      string,
      {
        present: number;
        halfDay: number;
        onLeave: number;
        absent: number;
        overtime: number;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfMode, setPdfMode] = useState<"all" | "individual">("all");
  const [selectedPdfStaff, setSelectedPdfStaff] = useState<StaffMember | null>(null);

  // Fetch dynamic attendance and staff from the backend API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/attendance?date=${selectedDate}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to fetch attendance data");
      }

      setStaffList(json.staff || []);

      // Build attendance map from returned records
      const map: Record<string, AttendanceRecord> = {};
      (json.attendance || []).forEach((rec: AttendanceRecord) => {
        map[rec.staff_id] = rec;
      });
      setAttendanceMap(map);

      // Monthly aggregation map & full daily records
      setMonthlyMap(json.monthlySummary || {});
      setMonthRecords(json.monthRecords || []);
    } catch (err: any) {
      console.error("Backend attendance load error:", err);
      setErrorMsg(err.message || "Failed to connect to backend attendance service");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigate dates
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const jumpToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Open All Staff PDF Modal
  const handleOpenAllStaffPdf = () => {
    setPdfMode("all");
    setSelectedPdfStaff(null);
    setPdfModalOpen(true);
  };

  // Open Individual Staff PDF Modal
  const handleOpenIndividualPdf = (staff: StaffMember) => {
    setPdfMode("individual");
    setSelectedPdfStaff(staff);
    setPdfModalOpen(true);
  };

  // Update in-memory attendance state for a staff member
  const handleStatusChange = (staffId: string, status: AttendanceRecord["status"]) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || { staff_id: staffId, date: selectedDate }),
        status,
        check_in_time:
          status === "absent" || status === "on_leave"
            ? null
            : prev[staffId]?.check_in_time || "09:00",
        check_out_time:
          status === "absent" || status === "on_leave"
            ? null
            : prev[staffId]?.check_out_time || (status === "half_day" ? "13:30" : "18:30"),
      },
    }));
  };

  const handleFieldChange = (
    staffId: string,
    field: "check_in_time" | "check_out_time" | "overtime_hours" | "notes",
    val: any
  ) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {
          staff_id: staffId,
          date: selectedDate,
          status: "present",
        }),
        [field]: val,
      },
    }));
  };

  // 1-Click "Mark All Present" integrated directly with backend
  const handleMarkAllPresent = async () => {
    setSaving(true);
    setErrorMsg(null);
    const recordsToSend: AttendanceRecord[] = [];

    staffList.forEach((staff) => {
      const isLeave = staff.status === "on_leave" || staff.status === "inactive";
      recordsToSend.push({
        staff_id: staff.id,
        date: selectedDate,
        status: isLeave ? "on_leave" : "present",
        check_in_time: isLeave ? null : "09:00",
        check_out_time: isLeave ? null : "18:30",
        overtime_hours: 0,
        notes: isLeave ? `Staff marked ${staff.status} in directory` : "Marked Present (Standard Shift)",
      });
    });

    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordsToSend }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to mark all present");
      }

      const map: Record<string, AttendanceRecord> = {};
      recordsToSend.forEach((r) => {
        map[r.staff_id] = r;
      });
      setAttendanceMap(map);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save attendance changes to backend API
  const handleSaveAttendance = async () => {
    setSaving(true);
    setErrorMsg(null);
    const recordsToSend: AttendanceRecord[] = [];

    staffList.forEach((staff) => {
      const rec = attendanceMap[staff.id];
      if (rec) {
        recordsToSend.push({
          staff_id: staff.id,
          date: selectedDate,
          status: rec.status || (staff.status === "on_leave" ? "on_leave" : "present"),
          check_in_time: rec.check_in_time || null,
          check_out_time: rec.check_out_time || null,
          overtime_hours: Number(rec.overtime_hours || 0),
          notes: rec.notes || null,
        });
      } else {
        const isLeave = staff.status === "on_leave" || staff.status === "inactive";
        recordsToSend.push({
          staff_id: staff.id,
          date: selectedDate,
          status: isLeave ? "on_leave" : "present",
          check_in_time: isLeave ? null : "09:00",
          check_out_time: isLeave ? null : "18:30",
          overtime_hours: 0,
          notes: isLeave ? "On Leave" : null,
        });
      }
    });

    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordsToSend }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save attendance");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchData();
    } catch (err: any) {
      alert("Error saving attendance: " + err.message);
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Stats for the selected date
  const dateStats = useMemo(() => {
    let present = 0;
    let halfDay = 0;
    let onLeave = 0;
    let absent = 0;
    let totalOT = 0;

    staffList.forEach((staff) => {
      const rec = attendanceMap[staff.id];
      const status = rec?.status || (staff.status === "on_leave" ? "on_leave" : "unmarked");
      if (status === "present") present++;
      else if (status === "half_day") halfDay++;
      else if (status === "on_leave") onLeave++;
      else if (status === "absent") absent++;

      if (rec?.overtime_hours) {
        totalOT += Number(rec.overtime_hours);
      }
    });

    return { present, halfDay, onLeave, absent, totalOT };
  }, [staffList, attendanceMap]);

  // Filter staff list
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  // Formatted date string (e.g. Friday, 20 November 2026)
  const formattedDateTitle = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <PermissionGuard permission="attendance">
      <div className="space-y-6">
        {/* Sub-navigation tabs: Staff Directory ↔ Attendance ↔ Salary Records */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit text-xs font-semibold">
          <Link
            href="/admin/staff"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Staff Directory
          </Link>
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
            Daily Attendance & Time
          </div>
          <Link
            href="/admin/staff/salaries"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Salary Records & Payroll
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-500" />
              Staff Attendance & Time Tracking
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live synchronized attendance register powered by Supabase backend API.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              title="Refresh attendance from backend"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            </button>

            {/* Download Monthly PDF (All Staff) Button */}
            <button
              onClick={handleOpenAllStaffPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-xs transition cursor-pointer"
              title="Download official monthly attendance PDF report for all workforce"
            >
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Monthly PDF (All Staff)</span>
            </button>

            {/* Mark All Present */}
            <button
              onClick={handleMarkAllPresent}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              ⚡ Mark All Present
            </button>

            {/* Save Attendance */}
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedSuccess ? (
                <Check className="w-4 h-4 text-emerald-200" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {savedSuccess ? "Saved to Backend!" : "Save Attendance"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Date Selector & View Switcher Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={jumpToToday}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition cursor-pointer"
            >
              Today
            </button>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:inline ml-2">
              {formattedDateTitle}
            </span>
          </div>

          {/* View Mode Switcher: Daily Register vs Monthly Summary */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "daily"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Daily Register
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "monthly"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Monthly Summary (Backend Synced)
            </button>
          </div>
        </div>

        {/* 4 Summary Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                Present Today
              </span>
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {dateStats.present}
              <span className="text-xs text-slate-400 font-normal ml-1">/ {staffList.length} staff</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Full day at shop/site</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">
                Half Day
              </span>
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {dateStats.halfDay}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Partial shift logged</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                On Leave / Absent
              </span>
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 flex items-center justify-center">
                <UserX className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {dateStats.onLeave + dateStats.absent}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {dateStats.onLeave} on leave • {dateStats.absent} absent
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                Overtime Logged
              </span>
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {dateStats.totalOT}
              <span className="text-xs text-slate-400 font-normal ml-1">hours</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fabrication overtime</div>
          </div>
        </div>

        {/* View Mode 1: Daily Register */}
        {viewMode === "daily" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Daily Attendance Register
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  • {formattedDateTitle}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Attendance Status</th>
                    <th className="py-3 px-4 font-semibold">Check-in</th>
                    <th className="py-3 px-4 font-semibold">Check-out</th>
                    <th className="py-3 px-4 font-semibold">Overtime (Hrs)</th>
                    <th className="py-3 px-4 font-semibold">Notes / Site Location</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && staffList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        Synchronizing live workforce attendance with backend...
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No staff members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const rec = attendanceMap[staff.id];
                      const currentStatus =
                        rec?.status ||
                        (staff.status === "on_leave" || staff.status === "inactive"
                          ? "on_leave"
                          : "present");

                      return (
                        <tr
                          key={staff.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                        >
                          {/* Staff details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {staff.photo_url ? (
                                <img
                                  src={staff.photo_url}
                                  alt={staff.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                                  {staff.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  {staff.name}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{staff.role}</span>
                                  {staff.status === "on_leave" && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                                      On Leave
                                    </span>
                                  )}
                                  {staff.status === "inactive" && (
                                    <span className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Attendance Status Buttons */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(staff.id, "present")}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                                  currentStatus === "present"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(staff.id, "half_day")}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                                  currentStatus === "half_day"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                              >
                                Half Day
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(staff.id, "on_leave")}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                                  currentStatus === "on_leave"
                                    ? "bg-purple-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                              >
                                On Leave
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(staff.id, "absent")}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                                  currentStatus === "absent"
                                    ? "bg-red-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>

                          {/* Check-in Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <input
                              type="time"
                              disabled={currentStatus === "on_leave" || currentStatus === "absent"}
                              value={
                                rec?.check_in_time ||
                                (currentStatus === "present" || currentStatus === "half_day" ? "09:00" : "")
                              }
                              onChange={(e) =>
                                handleFieldChange(staff.id, "check_in_time", e.target.value)
                              }
                              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 disabled:opacity-40"
                            />
                          </td>

                          {/* Check-out Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <input
                              type="time"
                              disabled={currentStatus === "on_leave" || currentStatus === "absent"}
                              value={
                                rec?.check_out_time ||
                                (currentStatus === "present"
                                  ? "18:30"
                                  : currentStatus === "half_day"
                                  ? "13:30"
                                  : "")
                              }
                              onChange={(e) =>
                                handleFieldChange(staff.id, "check_out_time", e.target.value)
                              }
                              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 disabled:opacity-40"
                            />
                          </td>

                          {/* Overtime (Hours) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="12"
                              step="0.5"
                              value={rec?.overtime_hours ?? 0}
                              onChange={(e) =>
                                handleFieldChange(
                                  staff.id,
                                  "overtime_hours",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 text-center font-semibold"
                            />
                          </td>

                          {/* Notes / Site Location */}
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              placeholder="e.g. Tanuku Shop / Site B"
                              value={rec?.notes || ""}
                              onChange={(e) =>
                                handleFieldChange(staff.id, "notes", e.target.value)
                              }
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                            />
                          </td>

                          {/* Actions: Individual PDF download + Payroll Link */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleOpenIndividualPdf(staff)}
                                title={`Download ${staff.name}'s monthly attendance report PDF`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-[10px] font-bold transition cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-purple-600" />
                                <span>PDF</span>
                              </button>

                              <Link
                                href="/admin/staff/salaries"
                                className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                              >
                                <span>Payroll</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Mode 2: Monthly Summary Table */}
        {viewMode === "monthly" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Monthly Attendance Summary (Backend Aggregation)
                </span>
                <p className="text-[11px] text-slate-400">
                  Aggregated working days, leaves, and overtime for selected month from PostgreSQL backend
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Download All Staff PDF */}
                <button
                  onClick={handleOpenAllStaffPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download All Staff PDF</span>
                </button>

                <Link
                  href="/admin/staff/salaries"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  Open Monthly Payroll
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Directory Status</th>
                    <th className="py-3 px-4 font-semibold">Days Present</th>
                    <th className="py-3 px-4 font-semibold">Half Days</th>
                    <th className="py-3 px-4 font-semibold">On Leave</th>
                    <th className="py-3 px-4 font-semibold">Absent</th>
                    <th className="py-3 px-4 font-semibold">Total Overtime</th>
                    <th className="py-3 px-4 font-semibold text-center">Payroll Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Individual Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffList.map((staff) => {
                    const stats = monthlyMap[staff.id] || {
                      present: 0,
                      halfDay: 0,
                      onLeave: 0,
                      absent: 0,
                      overtime: 0,
                    };

                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {staff.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{staff.role}</div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                              staff.status === "active"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : staff.status === "on_leave"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {staff.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {stats.present} days
                        </td>

                        <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {stats.halfDay} days
                        </td>

                        <td className="py-3.5 px-4 text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {stats.onLeave} days
                        </td>

                        <td className="py-3.5 px-4 text-red-500 whitespace-nowrap">
                          {stats.absent} days
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {stats.overtime} hrs
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {staff.status === "on_leave" || staff.status === "inactive" ? (
                            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                              Unpaid Leave (₹0)
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              Full Salary
                            </span>
                          )}
                        </td>

                        {/* Individual PDF Report Button */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenIndividualPdf(staff)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold transition cursor-pointer shadow-2xs"
                            title={`Download ${staff.name}'s monthly attendance report PDF`}
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>PDF Report</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance PDF Preview & Print Modal */}
        {pdfModalOpen && (
          <AttendancePdfModal
            mode={pdfMode}
            staffMember={selectedPdfStaff}
            allStaff={staffList}
            monthlyMap={monthlyMap}
            monthRecords={monthRecords}
            selectedDate={selectedDate}
            onClose={() => setPdfModalOpen(false)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
