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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-xs transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6 max-w-[1600px] mx-auto">
        {/* Left: Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 active:scale-95 md:hidden shrink-0"
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
        </div>

        {/* Right: Info & User Profile */}
        <div className="flex items-center gap-3 md:gap-5 ml-auto">
          {currentUser.role === "student" && (
            <div className="flex items-center gap-2 md:gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-1 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300">
              {/* XP status */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                <Zap className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-slate-700">{currentUser.xp || 0} XP</span>
              </div>

              {/* Streak status */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs mr-1">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-slate-700">{currentUser.streak || 0} Day Streak</span>
              </div>
            </div>
          )}

          {currentUser.role === "super_admin" && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
              <span>Super Admin</span>
            </div>
          )}

          {currentUser.role === "admin" && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 text-[#2E76C0]" />
              <span>Admin</span>
            </div>
          )}

          {/* User profile dropdown trigger & logout */}
          <div className="flex items-center gap-2 pl-2">
            <button
              onClick={() => {
                if (currentUser.role === "student") router.push("/student/profile");
                else if (currentUser.role === "admin") router.push("/admin/profile");
                else if (currentUser.role === "super_admin") router.push("/superadmin/profile");
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95"
              title="Profile Settings"
            >
               <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#2E76C0] to-[#00E5FF] flex items-center justify-center text-white font-bold text-xs shadow-inner">
                 {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
               </div>
               <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-none">
                    {currentUser.name}
                  </span>
               </div>
            </button>

            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 shadow-sm ml-1"
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
