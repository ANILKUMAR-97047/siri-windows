import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
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

// PUT: Update an admin user (Super Admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const superAdmin = await getAuthenticatedSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin privileges required." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, email, password, role, permissions, status } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (role) updateData.role = role;
    if (permissions !== undefined) {
      updateData.permissions = role === "super_admin" ? ["*"] : permissions;
    }
    if (status) updateData.status = status;

    // If password is being updated
    if (password && password.trim().length >= 6) {
      const { hash, salt } = hashPassword(password.trim());
      updateData.password_hash = hash;
      updateData.password_salt = salt;
    }

    const { data: updatedUser, error } = await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", id)
      .select("id, name, email, role, permissions, status, last_login_at, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error?.message || "Failed to update admin user." },
      { status: 500 }
    );
  }
}

// DELETE: Delete an admin user (Super Admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const superAdmin = await getAuthenticatedSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin privileges required." },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Prevent super admin from deleting themselves
  if (superAdmin.userId === id) {
    return NextResponse.json(
      { error: "You cannot delete your own Super Admin account." },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Admin user deleted." });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error?.message || "Failed to delete admin user." },
      { status: 500 }
    );
  }
}
