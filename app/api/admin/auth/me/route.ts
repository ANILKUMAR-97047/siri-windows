import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  AdminUser,
} from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify user is still active in database
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("id, name, email, role, permissions, status, last_login_at, created_at")
      .eq("id", session.userId)
      .single();

    if (error || !user || user.status !== "active") {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json(
        { error: "Account inactive or no longer exists" },
        { status: 401 }
      );
    }

    const adminProfile: AdminUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      status: user.status,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
    };

    return NextResponse.json({
      user: adminProfile,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve session." },
      { status: 500 }
    );
  }
}
