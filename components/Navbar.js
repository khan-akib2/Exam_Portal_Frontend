"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Zap, Flame, ShieldAlert, Award } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Load user from localStorage or fetch session
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
    };
    loadUser();

    // Set up window listener for custom storage updates
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Clear cookies by calling a dummy endpoint or document.cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.dispatchEvent(new Event("storage"));
    router.push("/login");
  };

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/70 backdrop-blur-lg shadow-xs transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Branding & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-650 transition-all hover:bg-slate-50 active:scale-95 md:hidden shrink-0"
            title="Open Menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-650 to-teal-800 text-white shadow-md shadow-teal-500/10 shrink-0">
            <Zap className="h-4.5 w-4.5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">
              MedExam Portal
            </h1>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mt-1">
              Gamified Clinical Assessor
            </span>
          </div>
        </div>

        {/* Right: Gamification Info & User Profile */}
        <div className="flex items-center gap-2 md:gap-4">
          {currentUser.role === "student" && (
            <div className="flex items-center gap-2 md:gap-3 rounded-full border border-slate-250 bg-slate-50/50 p-1 pr-3 md:pr-4 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-all">
              {/* XP status */}
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 px-3 py-1 rounded-full border border-amber-500/10">
                <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{currentUser.xp || 0} XP</span>
              </div>

              {/* Streak status */}
              <div className="flex items-center gap-1.5 text-orange-750">
                <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500 animate-float" />
                <span>{currentUser.streak || 0} Day Streak</span>
              </div>
            </div>
          )}

          {currentUser.role === "super_admin" && (
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-2xs font-extrabold text-indigo-700 uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
              <span>Super Admin</span>
            </div>
          )}

          {currentUser.role === "admin" && (
            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-2xs font-extrabold text-blue-700 uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
              <span>Admin</span>
            </div>
          )}

          {/* User profile dropdown trigger & logout */}
          <div className="flex items-center gap-2 md:gap-3 border-l border-slate-250/70 pl-2 md:pl-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-none">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 capitalize mt-1.5">
                {currentUser.role.replace("_", " ")}
              </span>
            </div>

            <button
              onClick={() => {
                if (currentUser.role === "student") router.push("/student/profile");
                else if (currentUser.role === "admin") router.push("/admin/profile");
                else if (currentUser.role === "super_admin") router.push("/superadmin/profile");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-teal-50 hover:text-teal-650 active:scale-95 shadow-xs"
              title="Profile Settings"
            >
              <User className="h-4 w-4" />
            </button>

            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-650 transition-all hover:bg-red-50 hover:text-red-650 active:scale-95 shadow-xs"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
