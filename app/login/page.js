"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, ShieldCheck, RefreshCw, Activity, ArrowRight, Building, Users } from "lucide-react";
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
    <div className="flex min-h-screen bg-white">
      {/* Left Panel: Branding & Trust (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-[#03122E] via-[#062459] to-[#1157CF] p-12 relative overflow-hidden text-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        
        {/* Top: Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight">MedAssess Pro</span>
        </motion.div>

        {/* Center: Hero Messaging */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-lg mt-16"
        >
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Assessment Infrastructure for Medical Excellence.
          </h1>
          <p className="text-lg text-blue-100/80 leading-relaxed font-medium">
            The enterprise-grade platform trusted by leading universities and examination boards worldwide to deliver secure, scalable, and precise assessments.
          </p>
        </motion.div>

        {/* Bottom: Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 grid grid-cols-2 gap-8 pt-12 border-t border-white/10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2 text-white/90 font-bold">
              <Building className="h-5 w-5 text-blue-300" />
              <span>500+ Institutions</span>
            </div>
            <p className="text-sm text-blue-200/60 font-medium">Deploying world-class exams globally.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 text-white/90 font-bold">
              <ShieldCheck className="h-5 w-5 text-blue-300" />
              <span>Bank-Grade Security</span>
            </div>
            <p className="text-sm text-blue-200/60 font-medium">Advanced proctoring & data protection.</p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel: Authentication Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#FAFBFC] relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          {showReset ? (
            <>
              <div className="mb-8">
                <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 border border-amber-200/50 shadow-sm">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Secure Your Account</h2>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                  As part of our security protocol, please establish a new, strong password to finalize your profile.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleResetSubmit}>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200 flex items-center gap-3 shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">NEW PASSWORD</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Lock className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-[15px] placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white shadow-xs"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">CONFIRM PASSWORD</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Lock className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-[15px] placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white shadow-xs"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-xl bg-[#1157CF] px-4 py-3 text-[15px] font-bold text-white shadow-md hover:bg-[#0D46A8] transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Update Password & Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReset}
                    className="w-full text-center text-sm text-slate-500 hover:text-slate-800 font-semibold py-2 transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Mobile Logo Only */}
              <div className="flex lg:hidden items-center gap-3 mb-10">
                <div className="h-10 w-10 bg-[#1157CF] rounded-xl flex items-center justify-center shadow-md">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900">MedAssess</span>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome Back</h2>
                <p className="text-[15px] text-slate-500 font-medium">Sign in to your account to continue.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200 flex items-center gap-3 shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">EMAIL ADDRESS</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-[15px] placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white shadow-xs"
                        placeholder="name@institution.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">PASSWORD</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <Lock className="h-4.5 w-4.5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-[15px] placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white shadow-xs"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#1157CF] focus:ring-[#1157CF] transition-colors" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-bold text-[#1157CF] hover:text-[#0D46A8] transition-colors">Forgot password?</a>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1157CF] px-4 py-3.5 text-[15px] font-bold text-white shadow-md shadow-[#1157CF]/20 hover:bg-[#0D46A8] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
          
          <div className="mt-12 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Powered by MedAssess Infrastructure</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
