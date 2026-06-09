"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ShieldCheck, RefreshCw, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "true") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.dispatchEvent(new Event("storage"));
      router.replace("/login");
      return;
    }

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

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));

      if (data.user.needsPasswordReset) {
        setTempPassword(password);
        setShowReset(true);
      } else {
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
          currentPassword: tempPassword || password,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

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
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FAFBFC] overflow-hidden selection:bg-[#1157CF]/10 selection:text-[#1157CF]">
      {/* Top Navbar Header (ClickUp style) */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12 md:py-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#1157CF] rounded-xl flex items-center justify-center text-white shadow-sm shadow-[#1157CF]/20">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#03122E]">MedAssess Pro</span>
        </div>
        {!showReset && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-medium text-slate-500">Don&apos;t have an account?</span>
            <button
              onClick={() => router.push("/signup")}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#EEF4FF] text-[#1157CF] hover:bg-[#DCE9FD] active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              Sign up
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_rgba(3,18,46,0.06)] p-8 md:p-10"
        >
          {showReset ? (
            /* Secure Password Reset Flow */
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
                  Secure Your Account
                </h2>
                <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                  Establish a strong password to finalize your profile setup.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleResetSubmit}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 flex items-center gap-2.5 shadow-xs"
                  >
                    <ShieldCheck className="h-4.5 w-4.5 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-xl bg-[#1157CF] hover:bg-[#0D46A8] active:scale-[0.99] px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-[#1157CF]/10 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      "Update Password & Sign In"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReset}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-semibold py-2 transition-colors cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Standard Login Flow */
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#03122E] mb-1.5">
                  Welcome back!
                </h2>
                <p className="text-sm text-slate-400 font-medium">
                  Enter your credentials to access the medical portal.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 flex items-center gap-2.5 shadow-xs"
                  >
                    <ShieldCheck className="h-4.5 w-4.5 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">
                        Password
                      </label>
                      <a
                        href="#"
                        className="text-xs font-bold text-[#1157CF] hover:text-[#0D46A8] hover:underline transition-colors"
                      >
                        Forgot Password?
                      </a>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white"
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1157CF] hover:bg-[#0D46A8] active:scale-[0.99] px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-[#1157CF]/15 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Log In
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center border-t border-slate-100 pt-6">
                <a
                  href="#"
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  or login with SSO
                </a>
                <span className="sm:hidden text-xs font-medium text-slate-500">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => router.push("/signup")}
                    className="font-bold text-[#1157CF] hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </span>
              </div>
            </>
          )}
        </motion.div>
      </main>

      {/* Decorative Wave Background (ClickUp inspired, using MedAssess Pro theme colors) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute bottom-0 left-0 w-full h-[35vh] lg:h-[45vh]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1157CF" />
              <stop offset="100%" stopColor="#2E6FE0" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#03122E" />
              <stop offset="50%" stopColor="#062459" />
              <stop offset="100%" stopColor="#1157CF" />
            </linearGradient>
          </defs>
          {/* Back wavy decoration */}
          <path
            fill="url(#wave-grad-1)"
            opacity="0.12"
            d="M0,160 C320,80 640,240 960,192 C1120,168 1280,120 1440,144 L1440,320 L0,320 Z"
          />
          {/* Main front wave */}
          <path
            fill="url(#wave-grad-2)"
            d="M0,224 C240,160 480,96 720,192 C960,288 1200,224 1440,160 L1440,320 L0,320 Z"
          />
        </svg>
      </div>

      {/* Small clean footer branding */}
      <footer className="relative z-10 w-full py-6 text-center">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Powered by MedAssess Infrastructure
        </p>
      </footer>
    </div>
  );
}
