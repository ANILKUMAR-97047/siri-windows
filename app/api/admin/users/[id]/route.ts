import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  createSessionToken,
  hashPassword,
  AdminUser,
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

    const supabase = getAdminClient();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name.trim();
    if (email && typeof email === "string" && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      // Check if duplicate exists for another admin
      const { data: existing } = await (supabase
        .from("admin_users" as any) as any)
        .select("id")
        .ilike("email", cleanEmail)
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "Another administrator is already using this email address." },
          { status: 400 }
        );
      }
      updateData.email = cleanEmail;
    }
    // Look up target user to enforce role security
    const { data: targetUser } = await (supabase
      .from("admin_users" as any) as any)
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (!targetUser) {
      return NextResponse.json({ error: "Administrator not found." }, { status: 404 });
    }

    // Role cannot be changed or elevated: only the owner remains super_admin, all others are admin
    updateData.role = targetUser.role === "super_admin" ? "super_admin" : "admin";

    if (permissions !== undefined) {
      if (targetUser.role === "super_admin") {
        updateData.permissions = ["*"];
      } else {
        // Normal admins only get specific module permissions (no wildcard '*')
        updateData.permissions = Array.isArray(permissions)
          ? permissions.filter((p: string) => p !== "*")
          : [];
      }
    }
    if (status) updateData.status = status;

    // If password is being updated
    if (password && password.trim().length >= 6) {
      const { hash, salt } = hashPassword(password.trim());
      updateData.password_hash = hash;
      updateData.password_salt = salt;
    }

    const { data: updatedUser, error } = await (supabase
      .from("admin_users" as any) as any)
      .update(updateData)
      .eq("id", id)
      .select("id, name, email, role, permissions, status, last_login_at, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If the super admin is updating their own account, refresh the session cookie
    if (superAdmin.userId === id) {
      const adminProfile: AdminUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        permissions: updatedUser.permissions || [],
        status: updatedUser.status,
        last_login_at: updatedUser.last_login_at,
        created_at: updatedUser.created_at,
      };
      const newToken = createSessionToken(adminProfile);
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
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
    const supabase = getAdminClient();

    const { error } = await (supabase
      .from("admin_users" as any) as any)
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
