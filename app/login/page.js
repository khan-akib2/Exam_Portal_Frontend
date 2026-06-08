"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, ShieldCheck, RefreshCw, Award, Activity, Flame, GraduationCap, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password reset state
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const redirectUser = useCallback((role) => {
    if (role === "super_admin") {
      router.push("/superadmin");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/student");
    }
  }, [router]);

  useEffect(() => {
    // Check if we need to force logout (e.g. from welcome email link)
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "true") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      // Sync navbar
      window.dispatchEvent(new Event("storage"));
      router.replace("/login");
      return;
    }

    // Check force reset query
    if (params.get("forceReset") === "true") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.needsPasswordReset) {
            setTimeout(() => setShowReset(true), 0);
          }
        } catch (e) {}
      }
    }

    // Redirect if already logged in and doesn't need password reset
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (!u.needsPasswordReset) {
          redirectUser(u.role);
        } else {
          setTimeout(() => setShowReset(true), 0);
        }
      } catch (e) {}
    }
  }, [router, redirectUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save token and user details
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Trigger standard storage event for navbar to sync
      window.dispatchEvent(new Event("storage"));

      if (data.user.needsPasswordReset) {
        setTempPassword(password);
        setShowReset(true);
      } else {
        // Redirect
        redirectUser(data.user.role);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: tempPassword || password, // fallback to password if state cleared
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      // Save updated token and user details
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("storage"));
      redirectUser(data.user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReset = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.dispatchEvent(new Event("storage"));
    setShowReset(false);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-slate-50">
      {/* LEFT COLUMN: BRAND PROMOTION (Hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract background decorative blobs */}
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        
        {/* Branding header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">MedExam Portal</h1>
            <p className="text-3xs font-semibold text-teal-400 uppercase tracking-widest">Clinical Assessor</p>
          </div>
        </div>

        {/* Dynamic platform mockups / showcases */}
        <div className="space-y-8 relative z-10 my-auto">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Unlock Clinical Excellence with Gamified Mock Papers
            </h2>
            <p className="text-sm text-slate-350 max-w-md leading-relaxed">
              Designed for medical professionals. Practice NEET PG, FMGE, and university courses in a structured, high-stakes testing environment.
            </p>
          </div>

          {/* Interactive Floating Gamification Showcase */}
          <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-white/5 shadow-2xl space-y-4 max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/20">
                  <GraduationCap className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <span className="block text-xs font-bold">Dr. Sarah Jenkins</span>
                  <span className="block text-4xs text-slate-400 font-semibold uppercase tracking-wider">Clinical Intern</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full text-3xs font-bold animate-pulse-slow">
                <Flame className="h-3 w-3 fill-orange-400" />
                <span>12 Day Streak</span>
              </div>
            </div>

            {/* Level & XP bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-3xs font-semibold text-slate-300">
                <span>Current Level: 14</span>
                <span>8,420 / 10,000 XP</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full" style={{ width: "84.2%" }} />
              </div>
            </div>

            {/* Quick stats mini-row */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/5 text-center">
              <div>
                <span className="block text-4xs text-slate-400 uppercase tracking-wider">Accuracy</span>
                <span className="block text-xs font-black text-emerald-400 mt-0.5">87.5%</span>
              </div>
              <div>
                <span className="block text-4xs text-slate-400 uppercase tracking-wider">Exam Rank</span>
                <span className="block text-xs font-black text-amber-400 mt-0.5">Top 2%</span>
              </div>
              <div>
                <span className="block text-4xs text-slate-400 uppercase tracking-wider">MCQs Done</span>
                <span className="block text-xs font-black text-blue-400 mt-0.5">1,240</span>
              </div>
            </div>
          </div>

          {/* Quick core benefits list */}
          <div className="space-y-3.5 text-sm text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Simulated High-Stakes Proctored Timers</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Automatic PDF Ingestion & OCR Drafting</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-teal-400 shrink-0" />
              <span>AI-assisted Clinical Revision Recommendations</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-3xs text-slate-500 flex items-center justify-between border-t border-white/5 pt-4">
          <span>&copy; {new Date().getFullYear()} MedExam Systems.</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" /> Secure Clinical Registry
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM PANEL */}
      <div className="flex lg:col-span-7 min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 relative">
          
          {/* Reset password card or traditional login form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            {showReset ? (
              <>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                    <Lock className="h-6 w-6 animate-pulse" />
                  </div>
                  <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
                    Reset Password Required
                  </h2>
                  <p className="mt-2 text-xs text-slate-550 leading-relaxed">
                    Choose a secure new password to finalize your profile and log in.
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleResetSubmit}>
                  {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-red-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="new-password"
                          name="new-password"
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          placeholder="••••••••"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="confirm-password"
                          name="confirm-password"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          placeholder="••••••••"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex w-full justify-center items-center rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/10 hover:bg-teal-700 transition-colors focus:outline-none disabled:opacity-50"
                      suppressHydrationWarning
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        "Update Password & Log In"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelReset}
                      className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors py-1.5 font-semibold"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="mx-auto flex lg:hidden h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-500/20 mb-4">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    Welcome Back
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Sign in to access your exam hall, reports, and leaderboards.
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-red-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          placeholder="name@university.edu"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder-slate-400 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          placeholder="••••••••"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex w-full justify-center items-center rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-500/15 hover:bg-teal-700 transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
                      suppressHydrationWarning
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
