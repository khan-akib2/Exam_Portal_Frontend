"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileQuestion,
  Settings,
  ShieldCheck,
  Trophy,
  Bell,
  Activity,
  UserCheck,
  User,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

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

    // Listen for mobile sidebar drawer toggle
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  if (!currentUser) return null;

  const role = currentUser.role;
  const permissions = currentUser.permissions || [];

  // Generate links based on roles and permissions
  const links = [];

  if (role === "super_admin") {
    links.push(
      { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
      { name: "Manage Sub-Admins", href: "/superadmin/admins", icon: UserCheck },
      { name: "Global Settings", href: "/superadmin/settings", icon: Settings },
      { name: "Audit Logs", href: "/superadmin/audit-logs", icon: Activity },
      { name: "Profile Settings", href: "/superadmin/profile", icon: User }
    );
  } else if (role === "admin") {
    links.push({ name: "Dashboard", href: "/admin", icon: LayoutDashboard });

    if (permissions.includes("manage_users")) {
      links.push({ name: "Manage Students", href: "/admin/students", icon: Users });
    }
    if (permissions.includes("manage_questions")) {
      links.push({ name: "Question Bank", href: "/admin/questions", icon: FileQuestion });
    }
    if (permissions.includes("manage_exams")) {
      links.push({ name: "Exam Builder", href: "/admin/exams", icon: FileText });
    }
    links.push({ name: "Profile Settings", href: "/admin/profile", icon: User });
  } else if (role === "student") {
    links.push(
      { name: "Student Dashboard", href: "/student", icon: LayoutDashboard },
      { name: "Mock Exams", href: "/student/exams", icon: ShieldCheck },
      { name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
      { name: "Announcements", href: "/student/announcements", icon: Bell },
      { name: "Profile Settings", href: "/student/profile", icon: User }
    );
  }

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-5 hidden md:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <nav className="flex flex-col gap-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Navigation Menu
          </p>
          
          {links.map((link) => {
            const Icon = link.icon;
            // Handle matching exact or nested sub-pages
            const isActive = pathname === link.href || (link.href !== "/admin" && link.href !== "/student" && link.href !== "/superadmin" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all duration-200 border-l-4 ${
                  isActive
                    ? "bg-teal-500/5 border-teal-650 text-teal-700 shadow-3xs"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-teal-650" : "text-slate-400"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer Content */}
          <aside className="relative flex w-64 max-w-xs flex-col bg-white p-5 shadow-2xl animate-slide-right h-full overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Navigation Menu
              </p>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/admin" && link.href !== "/student" && link.href !== "/superadmin" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-bold transition-all duration-200 border-l-4 ${
                      isActive
                        ? "bg-teal-500/5 border-teal-650 text-teal-700 shadow-3xs"
                        : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-teal-650" : "text-slate-400"}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
