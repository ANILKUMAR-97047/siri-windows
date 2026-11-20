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
