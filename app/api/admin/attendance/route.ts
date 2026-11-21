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
      .select("id, name, role, department, base_salary, photo_url, status, join_date")
      .order("name");

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    // 2. Fetch attendance records for the selected date
    const { data: dayRecords, error: dayError } = await (
      supabase.from("staff_attendance" as any) as any
    )
      .select("*, staff:staff_id(id, name, role, department)")
      .eq("date", date);

    if (dayError) {
      return NextResponse.json({ error: dayError.message }, { status: 500 });
    }

    // 3. Fetch monthly attendance records to aggregate monthly stats
    const startOfMonth = `${year}-${month}-01`;
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

    // Compute monthly summary aggregation per staff
    const monthlyMap: Record<
      string,
      {
        present: number;
        halfDay: number;
        onLeave: number;
        absent: number;
        overtime: number;
      }
    > = {};

    (staffList || []).forEach((s: any) => {
      monthlyMap[s.id] = {
        present: 0,
        halfDay: 0,
        onLeave: 0,
        absent: 0,
        overtime: 0,
      };
    });

    (monthRecords || []).forEach((r: any) => {
      if (monthlyMap[r.staff_id]) {
        if (r.status === "present") monthlyMap[r.staff_id].present++;
        else if (r.status === "half_day") monthlyMap[r.staff_id].halfDay++;
        else if (r.status === "on_leave") monthlyMap[r.staff_id].onLeave++;
        else if (r.status === "absent") monthlyMap[r.staff_id].absent++;

        if (r.overtime_hours) {
          monthlyMap[r.staff_id].overtime += Number(r.overtime_hours);
        }
      }
    });

    // Compute date counters
    let datePresent = 0;
    let dateHalfDay = 0;
    let dateOnLeave = 0;
    let dateAbsent = 0;
    let dateOvertime = 0;

    (dayRecords || []).forEach((r: any) => {
      if (r.status === "present") datePresent++;
      else if (r.status === "half_day") dateHalfDay++;
      else if (r.status === "on_leave") dateOnLeave++;
      else if (r.status === "absent") dateAbsent++;

      if (r.overtime_hours) {
        dateOvertime += Number(r.overtime_hours);
      }
    });

    return NextResponse.json({
      success: true,
      date,
      staff: staffList || [],
      attendance: dayRecords || [],
      monthRecords: monthRecords || [],
      monthlySummary: monthlyMap,
      stats: {
        present: datePresent,
        halfDay: dateHalfDay,
        onLeave: dateOnLeave,
        absent: dateAbsent,
        overtime: dateOvertime,
        totalStaff: (staffList || []).length,
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

    // Format and sanitize records
    const sanitized = records.map((r) => ({
      staff_id: r.staff_id,
      date: r.date,
      status: r.status || "present",
      check_in_time: r.check_in_time || null,
      check_out_time: r.check_out_time || null,
      overtime_hours: Number(r.overtime_hours || 0),
      notes: r.notes || null,
      updated_at: new Date().toISOString(),
    }));

    // Upsert into Supabase staff_attendance table on conflict (staff_id, date)
    const { data, error } = await (
      supabase.from("staff_attendance" as any) as any
    )
      .upsert(sanitized, { onConflict: "staff_id,date" })
      .select("*, staff:staff_id(id, name, role, department)");

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
