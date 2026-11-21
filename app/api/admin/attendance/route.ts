import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

interface AttendancePayload {
  id?: string;
  staff_id: string;
  date: string;
  status: "present" | "half_day" | "absent" | "on_leave" | "holiday";
  check_in_time?: string | null;
  check_out_time?: string | null;
  overtime_hours?: number;
  notes?: string | null;
}

// GET: Fetch attendance records for a specific date or month
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const [year, month] = date.split("-");

    const supabase = getAdminClient();

    // 1. Fetch all staff members ordered by name
    const { data: staffList, error: staffError } = await (
      supabase.from("staff" as any) as any
    )
      .select("id, name, role, department, base_salary, photo_url, status, join_date, phone")
      .order("name");

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    const staffMap = new Map<string, any>(
      (staffList || []).map((s: any) => [s.id, s])
    );

    // 2. Database Self-Healing: Clean up any invalid attendance records where date < staff.join_date
    // E.g. test records accidentally inserted before an employee's actual start date
    try {
      for (const s of staffList || []) {
        if (s.join_date) {
          await (supabase.from("staff_attendance" as any) as any)
            .delete()
            .eq("staff_id", s.id)
            .lt("date", s.join_date);
        }
      }
    } catch (cleanupErr) {
      console.warn("Auto-cleanup of pre-join attendance records notice:", cleanupErr);
    }

    // 3. Fetch attendance records for the selected date
    const { data: dayRecords, error: dayError } = await (
      supabase.from("staff_attendance" as any) as any
    )
      .select("*, staff:staff_id(id, name, role, department, join_date)")
      .eq("date", date);

    if (dayError) {
      return NextResponse.json({ error: dayError.message }, { status: 500 });
    }

    // Filter day records to only those valid on or after join date
    const validDayRecords = (dayRecords || []).filter((r: any) => {
      const s = staffMap.get(r.staff_id);
      if (s?.join_date && date < s.join_date) return false;
      return true;
    });

    // 4. Fetch monthly attendance records to aggregate monthly stats
    const totalDaysInMonth = new Date(Number(year), Number(month), 0).getDate();
    const startOfMonth = `${year}-${month}-01`;
    const endOfMonth = `${year}-${month}-${String(totalDaysInMonth).padStart(2, "0")}`;
    const nextMonthNum = Number(month) === 12 ? 1 : Number(month) + 1;
    const nextYearNum = Number(month) === 12 ? Number(year) + 1 : Number(year);
    const nextMonthFirstDay = `${nextYearNum}-${String(nextMonthNum).padStart(2, "0")}-01`;

    const { data: monthRecords, error: monthError } = await (
      supabase.from("staff_attendance" as any) as any
    )
      .select("staff_id, date, status, check_in_time, check_out_time, overtime_hours, notes")
      .gte("date", startOfMonth)
      .lt("date", nextMonthFirstDay)
      .order("date", { ascending: true });

    if (monthError) {
      return NextResponse.json({ error: monthError.message }, { status: 500 });
    }

    // Filter month records to ignore any dated before staff.join_date
    const validMonthRecords = (monthRecords || []).filter((r: any) => {
      const s = staffMap.get(r.staff_id);
      if (s?.join_date && r.date < s.join_date) return false;
      return true;
    });

    // 5. Compute monthly summary aggregation per staff
    // An employee is considered employed in this month if staff.join_date <= endOfMonth
    const monthlyMap: Record<
      string,
      {
        present: number;
        halfDay: number;
        onLeave: number;
        absent: number;
        overtime: number;
        isEmployedInMonth: boolean;
        joinDate: string | null;
      }
    > = {};

    (staffList || []).forEach((s: any) => {
      const isEmployedInMonth = !s.join_date || s.join_date <= endOfMonth;
      monthlyMap[s.id] = {
        present: 0,
        halfDay: 0,
        onLeave: 0,
        absent: 0,
        overtime: 0,
        isEmployedInMonth,
        joinDate: s.join_date || null,
      };
    });

    validMonthRecords.forEach((r: any) => {
      if (monthlyMap[r.staff_id] && monthlyMap[r.staff_id].isEmployedInMonth) {
        if (r.status === "present") monthlyMap[r.staff_id].present++;
        else if (r.status === "half_day") monthlyMap[r.staff_id].halfDay++;
        else if (r.status === "on_leave") monthlyMap[r.staff_id].onLeave++;
        else if (r.status === "absent") monthlyMap[r.staff_id].absent++;

        if (r.overtime_hours) {
          monthlyMap[r.staff_id].overtime += Number(r.overtime_hours);
        }
      }
    });

    // 6. Compute date counters (only for staff who were already employed on this specific date)
    let datePresent = 0;
    let dateHalfDay = 0;
    let dateOnLeave = 0;
    let dateAbsent = 0;
    let dateOvertime = 0;

    validDayRecords.forEach((r: any) => {
      if (r.status === "present") datePresent++;
      else if (r.status === "half_day") dateHalfDay++;
      else if (r.status === "on_leave") dateOnLeave++;
      else if (r.status === "absent") dateAbsent++;

      if (r.overtime_hours) {
        dateOvertime += Number(r.overtime_hours);
      }
    });

    // Staff employed on the queried date
    const staffEmployedOnDate = (staffList || []).filter(
      (s: any) => !s.join_date || s.join_date <= date
    );

    // Staff employed in the queried month
    const staffEmployedInMonth = (staffList || []).filter(
      (s: any) => !s.join_date || s.join_date <= endOfMonth
    );

    return NextResponse.json({
      success: true,
      date,
      month: Number(month),
      year: Number(year),
      staff: staffList || [],
      staffEmployedOnDate,
      staffEmployedInMonth,
      attendance: validDayRecords,
      monthRecords: validMonthRecords,
      monthlySummary: monthlyMap,
      stats: {
        present: datePresent,
        halfDay: dateHalfDay,
        onLeave: dateOnLeave,
        absent: dateAbsent,
        overtime: dateOvertime,
        totalStaff: staffEmployedOnDate.length,
        totalWorkforceInMonth: staffEmployedInMonth.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load dynamic attendance" },
      { status: 500 }
    );
  }
}

// POST: Upsert attendance records (single or batch)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getAdminClient();

    let records: AttendancePayload[] = [];
    if (Array.isArray(body)) {
      records = body;
    } else if (Array.isArray(body.records)) {
      records = body.records;
    } else if (body.staff_id && body.date) {
      records = [body];
    } else {
      return NextResponse.json(
        { error: "Invalid payload: 'records' array or staff_id + date required" },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Fetch staff join dates to prevent inserting attendance before join_date
    const { data: allStaff } = await (supabase.from("staff" as any) as any).select(
      "id, join_date"
    );
    const staffJoinMap = new Map<string, string>(
      (allStaff || []).map((s: any) => [s.id, s.join_date])
    );

    // Format, sanitize and validate records against join_date
    const sanitized = records
      .filter((r) => {
        const joinDate = staffJoinMap.get(r.staff_id);
        if (joinDate && r.date < joinDate) {
          console.warn(
            `Ignored attendance for staff ${r.staff_id} on ${r.date} because join_date is ${joinDate}`
          );
          return false;
        }
        return true;
      })
      .map((r) => ({
        staff_id: r.staff_id,
        date: r.date,
        status: r.status || "present",
        check_in_time: r.check_in_time || null,
        check_out_time: r.check_out_time || null,
        overtime_hours: Number(r.overtime_hours || 0),
        notes: r.notes || null,
        updated_at: new Date().toISOString(),
      }));

    if (sanitized.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "No eligible records to save (records prior to employee join_date were excluded)",
      });
    }

    // Upsert into Supabase staff_attendance table on conflict (staff_id, date)
    const { data, error } = await (
      supabase.from("staff_attendance" as any) as any
    )
      .upsert(sanitized, { onConflict: "staff_id,date" })
      .select("*, staff:staff_id(id, name, role, department, join_date)");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save attendance" },
      { status: 500 }
    );
  }
}
