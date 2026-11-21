"use client";

import { useMemo } from "react";
import {
  X,
  Printer,
  Download,
  Calendar,
  User,
  Building,
  CheckCircle2,
  Clock,
  UserX,
  FileText,
  Award,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  base_salary: number;
  photo_url?: string | null;
  status: string;
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
}

interface AttendancePdfModalProps {
  mode: "all" | "individual";
  staffMember?: StaffMember | null;
  allStaff: StaffMember[];
  monthlyMap: Record<
    string,
    {
      present: number;
      halfDay: number;
      onLeave: number;
      absent: number;
      overtime: number;
    }
  >;
  monthRecords: AttendanceRecord[];
  selectedDate: string; // YYYY-MM-DD
  onClose: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AttendancePdfModal({
  mode,
  staffMember,
  allStaff,
  monthlyMap,
  monthRecords,
  selectedDate,
  onClose,
}: AttendancePdfModalProps) {
  const [yearStr, monthStr] = selectedDate.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const monthName = MONTH_NAMES[month - 1] || `Month ${month}`;

  // Calculate days in this month
  const totalDaysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // Aggregate overall stats for all staff report
  const allStaffTotals = useMemo(() => {
    let totalPresent = 0;
    let totalHalfDays = 0;
    let totalLeaves = 0;
    let totalAbsent = 0;
    let totalOT = 0;

    Object.values(monthlyMap).forEach((st) => {
      totalPresent += st.present;
      totalHalfDays += st.halfDay;
      totalLeaves += st.onLeave;
      totalAbsent += st.absent;
      totalOT += st.overtime;
    });

    return {
      totalPresent,
      totalHalfDays,
      totalLeaves,
      totalAbsent,
      totalOT,
      staffCount: allStaff.length,
    };
  }, [monthlyMap, allStaff]);

  // Daily records for individual staff member
  const individualDailyRecords = useMemo(() => {
    if (!staffMember) return [];

    const mapByDate: Record<string, AttendanceRecord> = {};
    monthRecords
      .filter((r) => r.staff_id === staffMember.id)
      .forEach((r) => {
        mapByDate[r.date] = r;
      });

    const days = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = new Date(year, month - 1, day);
      const isSunday = d.getDay() === 0;
      const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });

      const existing = mapByDate[dateStr];
      days.push({
        date: dateStr,
        dayNumber: day,
        dayName,
        isSunday,
        record: existing || null,
      });
    }
    return days;
  }, [staffMember, monthRecords, totalDaysInMonth, year, month]);

  // Print / Save as PDF handler using hidden iframe (NO new tab / about:blank opened)
  const handlePrint = () => {
    const printContent = document.getElementById("printable-attendance-report");
    if (!printContent) return;

    const title =
      mode === "all"
        ? `Siri_Windows_Workforce_Attendance_${monthName}_${year}`
        : `Attendance_${staffMember?.name.replace(/\s+/g, "_")}_${monthName}_${year}`;

    // Remove any existing print iframe
    const existingIframe = document.getElementById("attendance-print-iframe");
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    // Create a hidden, off-screen iframe
    const iframe = document.createElement("iframe");
    iframe.id = "attendance-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.4;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 700;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #334155;
            }
            .header-box {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .title {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
              letter-spacing: -0.02em;
            }
            .subtitle {
              font-size: 10px;
              color: #64748b;
              margin: 2px 0 0 0;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-present { background-color: #dcfce7; color: #15803d; }
            .badge-half { background-color: #fef3c7; color: #b45309; }
            .badge-leave { background-color: #f3e8ff; color: #7e22ce; }
            .badge-absent { background-color: #fee2e2; color: #b91c1c; }
            .badge-sunday { background-color: #f1f5f9; color: #64748b; }
            .stats-grid {
              display: flex;
              gap: 10px;
              margin: 12px 0;
            }
            .stat-card {
              flex: 1;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 10px;
              background-color: #f8fafc;
            }
            .stat-label {
              font-size: 9px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
            }
            .stat-value {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
            }
            .signatures {
              margin-top: 35px;
              display: flex;
              justify-content: space-between;
              padding-top: 15px;
            }
            .signature-box {
              text-align: center;
              width: 160px;
            }
            .signature-line {
              border-top: 1px solid #475569;
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Trigger print directly inside the hidden iframe without opening any new tab!
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up iframe after print dialog is closed
      setTimeout(() => {
        const toRemove = document.getElementById("attendance-print-iframe");
        if (toRemove && toRemove.parentNode) {
          toRemove.parentNode.removeChild(toRemove);
        }
      }, 1500);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Control Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {mode === "all"
                  ? `Workforce Attendance Report — ${monthName} ${year}`
                  : `Staff Attendance Record — ${staffMember?.name} (${monthName} ${year})`}
              </h3>
              <p className="text-[11px] text-slate-400">
                Official PDF preview • Click &quot;Print / Save as PDF&quot; to export or save as PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Printable Sheet Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/40">
          <div
            id="printable-attendance-report"
            className="bg-white text-slate-900 p-8 rounded-xl shadow-md border border-slate-200/80 max-w-3xl mx-auto"
          >
            {/* Report Header & Letterhead */}
            <div className="header-box pb-3 mb-4 border-b-2 border-slate-900 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
                    S
                  </div>
                  <h1 className="title text-lg font-black tracking-tight text-slate-900">
                    SIRI WINDOWS & DOORS
                  </h1>
                </div>
                <p className="subtitle text-[10px] text-slate-500 font-medium mt-0.5">
                  High-End Architectural UPVC & Aluminium Systems • Tanuku HQ, Andhra Pradesh
                </p>
                <p className="text-[9px] text-slate-400">
                  Phone: +91 98481 22334 / 94402 11001 • info@siriwindows.com • www.siriwindows.com
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider border border-slate-300">
                  {mode === "all" ? "COMPANY MUSTER ROLL" : "EMPLOYEE TIME SHEET"}
                </span>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  {monthName} {year}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Generated: {formatDate(new Date().toISOString())}
                </div>
              </div>
            </div>

            {/* Mode 1: All Staff Company Muster Roll Report */}
            {mode === "all" ? (
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Monthly Workforce Attendance Summary
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Official time office register for all active workshop fabricators, glazers, and site supervisors.
                  </p>
                </div>

                {/* 4 KPI Summary Cards */}
                <div className="stats-grid flex gap-2.5 mb-4">
                  <div className="stat-card flex-1 border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <div className="stat-label text-[9px] font-bold text-slate-500 uppercase">
                      Total Workforce
                    </div>
                    <div className="stat-value text-base font-black text-slate-900">
                      {allStaffTotals.staffCount} Members
                    </div>
                  </div>

                  <div className="stat-card flex-1 border border-emerald-200 rounded-lg p-2 bg-emerald-50/50">
                    <div className="stat-label text-[9px] font-bold text-emerald-700 uppercase">
                      Total Days Worked
                    </div>
                    <div className="stat-value text-base font-black text-emerald-700">
                      {allStaffTotals.totalPresent} Days
                    </div>
                  </div>

                  <div className="stat-card flex-1 border border-purple-200 rounded-lg p-2 bg-purple-50/50">
                    <div className="stat-label text-[9px] font-bold text-purple-700 uppercase">
                      Leaves / Half Days
                    </div>
                    <div className="stat-value text-base font-black text-purple-700">
                      {allStaffTotals.totalLeaves + allStaffTotals.totalHalfDays} Days
                    </div>
                  </div>

                  <div className="stat-card flex-1 border border-blue-200 rounded-lg p-2 bg-blue-50/50">
                    <div className="stat-label text-[9px] font-bold text-blue-700 uppercase">
                      Overtime Logged
                    </div>
                    <div className="stat-value text-base font-black text-blue-700">
                      {allStaffTotals.totalOT} Hours
                    </div>
                  </div>
                </div>

                {/* All Staff Table */}
                <table className="w-full text-left text-[10px] border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[9px]">
                      <th className="p-2 border border-slate-300 text-center w-8">#</th>
                      <th className="p-2 border border-slate-300">Staff Member</th>
                      <th className="p-2 border border-slate-300">Role / Designation</th>
                      <th className="p-2 border border-slate-300 text-center">Status</th>
                      <th className="p-2 border border-slate-300 text-center">Present</th>
                      <th className="p-2 border border-slate-300 text-center">Half Day</th>
                      <th className="p-2 border border-slate-300 text-center">Leaves</th>
                      <th className="p-2 border border-slate-300 text-center">Absent</th>
                      <th className="p-2 border border-slate-300 text-center">OT (Hrs)</th>
                      <th className="p-2 border border-slate-300 text-right">Payroll Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStaff.map((staff, idx) => {
                      const st = monthlyMap[staff.id] || {
                        present: 0,
                        halfDay: 0,
                        onLeave: 0,
                        absent: 0,
                        overtime: 0,
                      };

                      return (
                        <tr key={staff.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-2 border border-slate-300 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">
                            {staff.name}
                            <div className="text-[8px] text-slate-400 font-normal">
                              Joined: {formatDate(staff.join_date)}
                            </div>
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700">
                            {staff.role}
                            <div className="text-[8px] text-slate-400">{staff.department}</div>
                          </td>
                          <td className="p-2 border border-slate-300 text-center">
                            <span
                              className={`badge ${
                                staff.status === "active"
                                  ? "badge-present"
                                  : staff.status === "on_leave"
                                  ? "badge-leave"
                                  : "badge-sunday"
                              }`}
                            >
                              {staff.status}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">
                            {st.present}
                          </td>
                          <td className="p-2 border border-slate-300 text-center text-amber-700">
                            {st.halfDay}
                          </td>
                          <td className="p-2 border border-slate-300 text-center text-purple-700">
                            {st.onLeave}
                          </td>
                          <td className="p-2 border border-slate-300 text-center text-red-600">
                            {st.absent}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-slate-900">
                            {st.overtime}
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-semibold">
                            {staff.status === "on_leave" || staff.status === "inactive" ? (
                              <span className="text-purple-700 font-bold">Unpaid Leave (₹0)</span>
                            ) : (
                              <span className="text-emerald-700 font-bold">Full Salary</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Mode 2: Individual Staff Member Detailed Daily Report */
              staffMember && (
                <div>
                  {/* Staff Info Banner */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex justify-between items-center text-[10px]">
                    <div>
                      <div className="text-xs font-black text-slate-900">{staffMember.name}</div>
                      <div className="text-slate-600 font-medium">
                        {staffMember.role} • {staffMember.department}
                      </div>
                      <div className="text-slate-400 text-[9px] mt-0.5">
                        Phone: {staffMember.phone || "N/A"} • Joined: {formatDate(staffMember.join_date)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-slate-500 font-semibold text-[9px] uppercase">
                        Registered Monthly Base
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        ₹{Number(staffMember.base_salary || 0).toLocaleString("en-IN")}
                      </div>
                      <span
                        className={`badge mt-1 ${
                          staffMember.status === "active" ? "badge-present" : "badge-leave"
                        }`}
                      >
                        {staffMember.status}
                      </span>
                    </div>
                  </div>

                  {/* Monthly Summary Cards for this staff */}
                  {(() => {
                    const st = monthlyMap[staffMember.id] || {
                      present: 0,
                      halfDay: 0,
                      onLeave: 0,
                      absent: 0,
                      overtime: 0,
                    };
                    return (
                      <div className="stats-grid flex gap-2 mb-4">
                        <div className="stat-card flex-1 border border-emerald-200 rounded p-2 bg-emerald-50/50">
                          <div className="stat-label text-[8px] font-bold text-emerald-700">Days Present</div>
                          <div className="stat-value text-sm font-black text-emerald-800">{st.present} Days</div>
                        </div>
                        <div className="stat-card flex-1 border border-amber-200 rounded p-2 bg-amber-50/50">
                          <div className="stat-label text-[8px] font-bold text-amber-700">Half Days</div>
                          <div className="stat-value text-sm font-black text-amber-800">{st.halfDay} Days</div>
                        </div>
                        <div className="stat-card flex-1 border border-purple-200 rounded p-2 bg-purple-50/50">
                          <div className="stat-label text-[8px] font-bold text-purple-700">Leaves Taken</div>
                          <div className="stat-value text-sm font-black text-purple-800">{st.onLeave} Days</div>
                        </div>
                        <div className="stat-card flex-1 border border-blue-200 rounded p-2 bg-blue-50/50">
                          <div className="stat-label text-[8px] font-bold text-blue-700">Total Overtime</div>
                          <div className="stat-value text-sm font-black text-blue-800">{st.overtime} Hours</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Day-by-Day Detailed Log Table */}
                  <div className="mb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Day-by-Day Time Register ({monthName} {year})
                    </h3>
                  </div>

                  <table className="w-full text-left text-[9px] border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[8px]">
                        <th className="p-1.5 border border-slate-300 text-center w-8">Date</th>
                        <th className="p-1.5 border border-slate-300 text-center w-10">Day</th>
                        <th className="p-1.5 border border-slate-300 text-center">Status</th>
                        <th className="p-1.5 border border-slate-300 text-center">Check-in</th>
                        <th className="p-1.5 border border-slate-300 text-center">Check-out</th>
                        <th className="p-1.5 border border-slate-300 text-center">Overtime</th>
                        <th className="p-1.5 border border-slate-300">Site Location / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {individualDailyRecords.map((item) => {
                        const rec = item.record;
                        const status = item.isSunday
                          ? "holiday"
                          : rec?.status || (staffMember.status === "on_leave" ? "on_leave" : "absent");

                        return (
                          <tr
                            key={item.date}
                            className={`border-b border-slate-200 ${
                              item.isSunday ? "bg-slate-50/70 text-slate-400" : ""
                            }`}
                          >
                            <td className="p-1.5 border border-slate-300 text-center font-bold">
                              {String(item.dayNumber).padStart(2, "0")}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center font-medium">
                              {item.dayName}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center">
                              {item.isSunday ? (
                                <span className="badge badge-sunday">SUNDAY</span>
                              ) : status === "present" ? (
                                <span className="badge badge-present">PRESENT</span>
                              ) : status === "half_day" ? (
                                <span className="badge badge-half">HALF DAY</span>
                              ) : status === "on_leave" ? (
                                <span className="badge badge-leave">ON LEAVE</span>
                              ) : (
                                <span className="badge badge-absent">ABSENT</span>
                              )}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center">
                              {rec?.check_in_time ? rec.check_in_time.substring(0, 5) : "--"}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center">
                              {rec?.check_out_time ? rec.check_out_time.substring(0, 5) : "--"}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center font-semibold">
                              {rec?.overtime_hours ? `+${rec.overtime_hours} hrs` : "--"}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-slate-600 truncate max-w-[200px]">
                              {rec?.notes || (item.isSunday ? "Weekly Holiday" : "--")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Official Signatures Section */}
            <div className="signatures mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-500">
              <div className="signature-box text-center w-36">
                <div className="signature-line border-t border-slate-800 mb-1"></div>
                <div className="font-bold text-slate-800">
                  {mode === "all" ? "Time Office / HR" : "Employee Signature"}
                </div>
                <div>Siri Windows HQ</div>
              </div>

              <div className="signature-box text-center w-36">
                <div className="signature-line border-t border-slate-800 mb-1"></div>
                <div className="font-bold text-slate-800">Site Supervisor</div>
                <div>Tanuku Workshop Lead</div>
              </div>

              <div className="signature-box text-center w-36">
                <div className="signature-line border-t border-slate-800 mb-1"></div>
                <div className="font-bold text-slate-800">Managing Director</div>
                <div>Siri Windows & Doors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
