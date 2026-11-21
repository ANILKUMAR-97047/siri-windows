import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { decodeResetTokenPayload, verifyPasswordResetToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Missing reset token in request." },
        { status: 400 }
      );
    }

    const payload = decodeResetTokenPayload(token);
    if (!payload) {
      return NextResponse.json(
        { valid: false, error: "Invalid token format." },
        { status: 400 }
      );
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json(
        { valid: false, error: "This password reset link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    const supabase = getAdminClient();

    const { data: user, error } = await (supabase
      .from("admin_users" as any) as any)
      .select("id, name, email, password_hash, status, role")
      .eq("id", payload.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { valid: false, error: "Admin account not found in database." },
        { status: 404 }
      );
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      return NextResponse.json(
        { valid: false, error: "This admin account is currently deactivated." },
        { status: 403 }
      );
    }

    const verified = verifyPasswordResetToken(token, user.password_hash || "");
    if (!verified) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "This password reset link is invalid or has already been used. Please request a new link.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      name: user.name,
      email: user.email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err?.message || "Failed to verify token." },
      { status: 500 }
    );
  }
}
