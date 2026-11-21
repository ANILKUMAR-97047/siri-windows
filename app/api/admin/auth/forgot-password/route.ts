import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { createPasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid administrator email address." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const supabase = getAdminClient();

    // Look up admin by email across all roles (super_admin and admin)
    const { data: user, error: dbError } = await (supabase
      .from("admin_users" as any) as any)
      .select("id, name, email, password_hash, status, role")
      .ilike("email", trimmedEmail)
      .maybeSingle();

    if (dbError) {
      console.error("Database lookup error in forgot-password:", dbError);
      return NextResponse.json(
        { error: "Unable to query administrator records. Please try again." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: `No administrator account found with email "${trimmedEmail}". Please ensure this email is registered in Admin Users & RBAC (/admin/users).`,
        },
        { status: 404 }
      );
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      return NextResponse.json(
        {
          error:
            "This admin account is currently deactivated. Please contact your Super Admin to reactivate it.",
        },
        { status: 403 }
      );
    }

    // Generate single-use password reset token bound to current password hash
    const token = createPasswordResetToken(user, user.password_hash || "");

    // Determine current site origin
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    const resetUrl = `${origin}/admin/reset-password?token=${encodeURIComponent(token)}`;

    // Dispatch email through Gmail SMTP
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailErr: any) {
      console.error("Failed to send password reset email via SMTP:", emailErr);
      return NextResponse.json(
        {
          error:
            "Could not dispatch email via SMTP service. Please check Gmail SMTP configuration.",
          details: emailErr?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset link sent to ${user.email}. Please check your inbox (and spam folder).`,
    });
  } catch (err: any) {
    console.error("Forgot password API error:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
