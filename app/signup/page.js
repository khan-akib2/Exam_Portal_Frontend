"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, ShieldCheck, RefreshCw, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUser = (role) => {
    if (role === "super_admin") {
      router.push("/superadmin");
    } else if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/student");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Save token and user details
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));

      // Redirect user to their role's dashboard
      redirectUser(data.user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FAFBFC] overflow-hidden selection:bg-[#1157CF]/10 selection:text-[#1157CF]">
      {/* Top Navbar Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12 md:py-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#1157CF] rounded-xl flex items-center justify-center text-white shadow-sm shadow-[#1157CF]/20">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#03122E]">MedAssess Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm font-medium text-slate-500">Already have an account?</span>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#EEF4FF] text-[#1157CF] hover:bg-[#DCE9FD] active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            Log in
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_rgba(3,18,46,0.06)] p-8 md:p-10"
        >
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#03122E] mb-1.5">
              Create your account
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Join MedAssess Pro to start taking exams.
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
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email field */}
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

              {/* Phone field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm placeholder-slate-400 outline-none transition-all focus:border-[#1157CF] focus:ring-4 focus:ring-[#1157CF]/10 bg-white"
                    placeholder="Enter phone number (optional)"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">
                  Password
                </label>
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
                    placeholder="Create a password (min 6 chars)"
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
                    Sign Up
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center border-t border-slate-100 pt-6">
            <span className="sm:hidden text-xs font-medium text-slate-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-bold text-[#1157CF] hover:underline cursor-pointer"
              >
                Log in
              </button>
            </span>
          </div>
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
