import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  AdminUser,
} from "@/lib/auth";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitKey = `login_${clientIp}`;

    // Brute-force protection: check rate limit
    const limitStatus = checkLoginRateLimit(rateLimitKey);
    if (!limitStatus.allowed) {
      const waitMinutes = Math.ceil((limitStatus.retryAfterSec || 60) / 60);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. For security, access has been temporarily blocked. Please try again in ${waitMinutes} minute(s).`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limitStatus.retryAfterSec || 900),
          },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Look up admin by email
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("*")
      .ilike("email", email.trim())
      .single();

    if (error || !user) {
      recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "This admin account is currently deactivated. Please contact the Super Admin." },
        { status: 403 }
      );
    }

    // Verify password hash
    const isValid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Login successful — clear failed attempts for this IP
    clearLoginRateLimit(rateLimitKey);

    const adminProfile: AdminUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      status: user.status,
      last_login_at: user.last_login_at,
    };

    // Create session token
    const token = createSessionToken(adminProfile);

    // Set HTTP-only secure session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Update last_login_at timestamp asynchronously
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      user: adminProfile,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error?.message || "Authentication failed." },
      { status: 500 }
    );
  }
}
