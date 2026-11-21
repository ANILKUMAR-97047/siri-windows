import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  hashPassword,
} from "@/lib/auth";

async function getAuthenticatedSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session || session.role !== "super_admin") return null;

  return session;
}

// GET: List all admin users (Super Admin only)
export async function GET() {
  const superAdmin = await getAuthenticatedSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin privileges required." },
      { status: 403 }
    );
  }

  const supabase = getAdminClient();

  const { data: users, error } = await (supabase
    .from("admin_users" as any) as any)
    .select("id, name, email, role, permissions, status, last_login_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

// POST: Create a new admin user (Super Admin only - always creates role: 'admin')
export async function POST(request: Request) {
  const superAdmin = await getAuthenticatedSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, permissions = [] } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if email already exists
    const { data: existing } = await (supabase
      .from("admin_users" as any) as any)
      .select("id")
      .ilike("email", email.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An admin account with this email already exists." },
        { status: 400 }
      );
    }

    const { hash, salt } = hashPassword(password);

    // Filter out wildcard '*' to ensure only specific granted modules are given
    const safePermissions = Array.isArray(permissions)
      ? permissions.filter((p: string) => p !== "*")
      : [];

    const { data: newUser, error: insertError } = await (supabase
      .from("admin_users" as any) as any)
      .insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password_hash: hash,
          password_salt: salt,
          role: "admin", // All created accounts are strictly normal admins
          permissions: safePermissions,
          status: "active",
          created_by: superAdmin.userId,
        },
      ])
      .select("id, name, email, role, permissions, status, created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error?.message || "Failed to create admin user." },
      { status: 500 }
    );
  }
}
