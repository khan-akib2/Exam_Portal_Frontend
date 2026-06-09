"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Zap, Flame, ShieldAlert, ChevronRight, Menu } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
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

    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.dispatchEvent(new Event("storage"));
    router.push("/login");
  };

  if (!currentUser) return null;

  // Generate simple breadcrumbs from pathname
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = paths.map((path, index) => {
    const isLast = index === paths.length - 1;
    const title = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    const href = '/' + paths.slice(0, index + 1).join('/');
    return { title, isLast, href };
  });

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-[var(--border)] bg-white/80 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-slate-500 transition-all hover:bg-slate-50 active:scale-95 md:hidden shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs - Hidden on small mobile */}
        <div className="hidden sm:flex items-center text-sm font-medium text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center">
              {idx > 0 && <ChevronRight className="h-4 w-4 mx-2 text-slate-300" />}
              {crumb.isLast ? (
                <span className="text-slate-900 font-semibold">
                  {crumb.title}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-slate-800 transition-colors cursor-pointer">
                  {crumb.title}
                </Link>
              )}
            </div>
          ))}
          {breadcrumbs.length === 0 && (
            <span className="text-slate-900 font-semibold">Dashboard</span>
          )}
        </div>
      </div>

      {/* Right: Info & User Profile */}
      <div className="flex items-center gap-3 md:gap-5">
        {currentUser.role === "student" && (
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-slate-50 p-1 shadow-xs">
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-[var(--border)]">
              <Zap className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold text-slate-700">{currentUser.xp || 0} XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-[var(--border)]">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">{currentUser.streak || 0} Day</span>
            </div>
          </div>
        )}

        {(currentUser.role === "super_admin" || currentUser.role === "admin") && (
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-[var(--border)] px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <ShieldAlert className={`h-3.5 w-3.5 ${currentUser.role === 'super_admin' ? 'text-amber-500' : 'text-[#1157CF]'}`} />
            <span>{currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
          </div>
        )}

        {/* Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
          <button
            onClick={() => {
              if (currentUser.role === "student") router.push("/student/profile");
              else if (currentUser.role === "admin") router.push("/admin/profile");
              else router.push("/superadmin/profile");
            }}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
             <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs shadow-inner">
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
