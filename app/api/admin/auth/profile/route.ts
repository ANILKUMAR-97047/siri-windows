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

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const { name, email, password } = await request.json();

    if (!name && !email && !password) {
      return NextResponse.json(
        { error: "Please provide updated name, email, or password." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if user still exists and is active
    const { data: user, error: userError } = await (supabase
      .from("admin_users" as any) as any)
      .select("id, name, email, role, permissions, status")
      .eq("id", session.userId)
      .maybeSingle();

    if (userError || !user || user.status !== "active") {
      return NextResponse.json(
        { error: "User account not found or inactive." },
        { status: 403 }
      );
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (email && typeof email === "string" && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes("@")) {
        return NextResponse.json(
          { error: "Please provide a valid email address." },
          { status: 400 }
        );
      }

      // Check if another admin already uses this email
      if (cleanEmail !== user.email.toLowerCase()) {
        const { data: existing } = await (supabase
          .from("admin_users" as any) as any)
          .select("id")
          .ilike("email", cleanEmail)
          .neq("id", session.userId)
          .maybeSingle();

        if (existing) {
          return NextResponse.json(
            { error: "This email address is already in use by another administrator." },
            { status: 400 }
          );
        }
        updateData.email = cleanEmail;
      }
    }

    if (password && typeof password === "string" && password.trim()) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      const { hash, salt } = hashPassword(password.trim());
      updateData.password_hash = hash;
      updateData.password_salt = salt;
    }

    const { data: updatedUser, error: updateError } = await (supabase
      .from("admin_users" as any) as any)
      .update(updateData)
      .eq("id", session.userId)
      .select("id, name, email, role, permissions, status, last_login_at, created_at, updated_at")
      .single();

    if (updateError || !updatedUser) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: updateError?.message || "Failed to update profile." },
        { status: 500 }
      );
    }

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

    // Update session cookie with new email/name
    const newToken = createSessionToken(adminProfile);
    cookieStore.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: adminProfile,
    });
  } catch (err: any) {
    console.error("Profile PUT error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
