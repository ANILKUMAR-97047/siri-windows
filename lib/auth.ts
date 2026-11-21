import crypto from "node:crypto";
export * from "./auth-types";
import { AdminUser, AdminSession, SESSION_COOKIE_NAME } from "./auth-types";

const SESSION_DURATION_DAYS = 7;

function getSecretKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SESSION_SECRET ||
    "siri-windows-secure-rbac-session-secret-tanuku-2026"
  );
}

// Hash password with scrypt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

// Verify password against stored hash & salt
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  } catch {
    return false;
  }
}

// Create a cryptographically signed session token: Base64(payload).Signature
export function createSessionToken(user: AdminUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_DAYS * 24 * 60 * 60;
  const session: AdminSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    exp,
  };

  const payloadStr = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payloadStr)
    .digest("base64url");

  return `${payloadStr}.${signature}`;
}

// Verify and decode a session token
export function verifySessionToken(token: string): AdminSession | null {
  if (!token || !token.includes(".")) return null;
  const [payloadStr, signature] = token.split(".");
  if (!payloadStr || !signature) return null;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", getSecretKey())
      .update(payloadStr)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const session = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8")) as AdminSession;

    // Check expiration
    if (session.exp && session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Password Reset Token Helpers (Single-use, HMAC signed, 1h expiry)
// -------------------------------------------------------------

export interface ResetTokenPayload {
  userId: string;
  email: string;
  exp: number;
  purpose: "password_reset";
}

// Create a cryptographically signed password reset token bound to current password hash
export function createPasswordResetToken(
  user: { id: string; email: string },
  currentPasswordHash: string
): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour validity
  const payload: ResetTokenPayload = {
    userId: user.id,
    email: user.email.toLowerCase(),
    purpose: "password_reset",
    exp,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = `${getSecretKey()}:${currentPasswordHash}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadStr)
    .digest("base64url");

  return `${payloadStr}.${signature}`;
}

// Safely decode payload without verifying (used to find the user in database)
export function decodeResetTokenPayload(token: string): ResetTokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const [payloadStr] = token.split(".");
  if (!payloadStr) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf8")
    ) as ResetTokenPayload;
    if (payload.purpose !== "password_reset" || !payload.userId || !payload.email) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Verify password reset token against the user's current password hash
export function verifyPasswordResetToken(
  token: string,
  currentPasswordHash: string
): { userId: string; email: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payloadStr, signature] = token.split(".");
  if (!payloadStr || !signature) return null;

  try {
    const secret = `${getSecretKey()}:${currentPasswordHash}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadStr)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null; // Token was tampered with, or password was already changed (single-use)!
    }

    const payload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf8")
    ) as ResetTokenPayload;

    // Check expiration (1 hour)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
