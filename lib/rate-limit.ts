/**
 * In-Memory Security Rate Limiter for Authentication & Sensitive Endpoints
 * Protects against automated brute-force attacks and credential stuffing
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks whether an IP or user key is currently allowed to attempt login.
 */
export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };
  }

  // Window expired — clear record
  if (now > record.resetAt) {
    loginAttempts.delete(key);
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  return { allowed: true, remaining: MAX_FAILED_ATTEMPTS - record.count };
}

/**
 * Records a failed login attempt for a given key.
 */
export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
  } else {
    record.count += 1;
  }
}

/**
 * Clears failed attempts upon successful authentication.
 */
export function clearLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}

/**
 * Helper to extract client IP address from incoming Next.js request.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown-client";
}
