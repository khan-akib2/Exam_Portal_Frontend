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
  ChevronRight,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-[260px] border-r border-slate-200 bg-[#FAFAFB] p-6 hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] z-30"
      >
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <nav className="flex flex-col gap-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-4 mt-2">
              Main Menu
            </p>
            
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin" && link.href !== "/student" && link.href !== "/superadmin" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-bg"
                      className="absolute inset-0 bg-white border border-slate-200 rounded-xl shadow-sm"
                      initial={false}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${isActive ? "text-[#2E76C0]" : "text-slate-400 group-hover:text-slate-600"}`} />
                      <span>{link.name}</span>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-slate-300" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User Mini Profile at bottom */}
        <div className="mt-auto pt-4 border-t border-slate-200">
           <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#2E76C0] to-[#00E5FF] flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{role.replace('_', ' ')}</p>
              </div>
           </div>
        </div>
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            {/* Drawer Content */}
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex w-[280px] max-w-[80vw] flex-col bg-white p-6 shadow-2xl h-full z-50"
            >
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-[#2E76C0] rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 tracking-tight">MedExam</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <nav className="flex flex-col gap-1.5">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Menu
                  </p>
                  {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href || (link.href !== "/admin" && link.href !== "/student" && link.href !== "/superadmin" && pathname.startsWith(link.href));

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-[13px] font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-[#F4F7FB] text-slate-900"
                            : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-[#2E76C0]" : "text-slate-400"}`} />
                          <span>{link.name}</span>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 text-slate-300" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
