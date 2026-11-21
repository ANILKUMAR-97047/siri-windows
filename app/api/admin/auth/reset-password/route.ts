import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  decodeResetTokenPayload,
  verifyPasswordResetToken,
  hashPassword,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Security reset token is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "A new password is required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation password do not match." },
        { status: 400 }
      );
    }

    const payload = decodeResetTokenPayload(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or malformed password reset link." },
        { status: 400 }
      );
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json(
        {
          error:
            "This password reset link has expired (1 hour limit). Please request a new link.",
        },
        { status: 410 }
      );
    }

    const supabase = getAdminClient();

    // Fetch user by ID from payload across all roles (super_admin and admin)
    const { data: user, error: userError } = await (supabase
      .from("admin_users" as any) as any)
      .select("id, name, email, password_hash, status, role")
      .eq("id", payload.userId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Administrator account not found in database." },
        { status: 404 }
      );
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      return NextResponse.json(
        { error: "This admin account is currently deactivated." },
        { status: 403 }
      );
    }

    // Verify token cryptographic signature against current password hash
    const verified = verifyPasswordResetToken(token, user.password_hash || "");
    if (!verified) {
      return NextResponse.json(
        {
          error:
            "This password reset link is invalid or has already been used. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Hash the new password with a fresh random salt
    const { hash, salt } = hashPassword(password);

    // Update in Supabase admin_users
    const { error: updateError } = await (supabase
      .from("admin_users" as any) as any)
      .update({
        password_hash: hash,
        password_salt: salt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update admin password in database:", updateError);
      return NextResponse.json(
        { error: "Failed to update password in database. Please try again." },
        { status: 500 }
      );
    }

    // Clear any previous session cookie so the user can perform a fresh login
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch (cookieErr) {
      console.warn("Could not delete old session cookie:", cookieErr);
    }

    return NextResponse.json({
      success: true,
      message:
        "Your password has been successfully updated! You can now log in with your new credentials.",
    });
  } catch (err: any) {
    console.error("Reset password POST error:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
