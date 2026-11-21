"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  XCircle,
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [tokenError, setTokenError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("No security reset token was found in the link.");
      return;
    }

    const checkToken = async () => {
      try {
        const res = await fetch(
          `/api/admin/auth/verify-reset-token?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (!res.ok || !data.valid) {
          setTokenValid(false);
          setTokenError(
            data.error || "This reset link is invalid, expired, or has already been used."
          );
        } else {
          setTokenValid(true);
          setAdminName(data.name || "Administrator");
          setAdminEmail(data.email || "");
        }
      } catch (err: any) {
        setTokenValid(false);
        setTokenError(err?.message || "Failed to verify reset link.");
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update password.");
        setSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 mx-auto flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Update Admin Password
          </h2>
          <p className="text-xs text-slate-400">
            Siri Windows & Doors • Secure Password Reset
          </p>
        </div>

        {/* Loading State */}
        {verifying ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-amber-500" />
            <p className="text-xs">Validating security token with database...</p>
          </div>
        ) : !tokenValid ? (
          /* Invalid / Expired Token View */
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
              <XCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Reset Link Invalid or Expired</h3>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                {tokenError ||
                  "This password reset link is invalid, expired (1 hour limit), or has already been used."}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href="/admin/forgot-password"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <span>Request a New Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/admin/login"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          /* Success View */
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Password Updated!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your administrator password has been securely updated in the database. You can now log in with your new credentials.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/login"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <span>Proceed to Admin Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Active Form View */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Account Info Pill */}
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">{adminName}</div>
                <div className="text-[11px] text-slate-400">{adminEmail}</div>
              </div>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`w-full bg-slate-800/80 border rounded-xl pl-9 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 text-xs ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-500/60 focus:ring-red-500/30"
                      : "border-slate-700 focus:ring-amber-500/30 focus:border-amber-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-slate-400 hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || (!!confirmPassword && confirmPassword !== password)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 active:scale-95 mt-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password in Database...</span>
                </>
              ) : (
                <>
                  <span>Save New Password & Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-800 text-center">
              <Link
                href="/admin/login"
                className="text-[11px] text-slate-400 hover:text-amber-400 transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Admin Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p className="text-xs text-slate-400">Loading password reset form...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
