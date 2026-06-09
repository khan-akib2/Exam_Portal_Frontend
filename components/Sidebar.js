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
  ChevronLeft,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  if (!currentUser) return null;

  const role = currentUser.role;
  const permissions = currentUser.permissions || [];

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

  const handleLinkClick = () => setIsMobileOpen(false);

  // Determine if sidebar is expanded based on collapse state and hover
  const expanded = !isCollapsed || isHovered;

  return (
    <>
      {/* Desktop Sidebar - Enterprise Navy */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: expanded ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
        className="bg-[#03122E] border-r border-[#1e293b]/50 hidden md:flex flex-col sticky top-0 h-screen z-50 text-slate-300"
      >
        <div className="flex items-center h-16 px-4 justify-between border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="h-8 w-8 min-w-[32px] bg-gradient-to-tr from-[#1157CF] to-[#5B93EE] rounded-lg flex items-center justify-center shadow-md">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold text-white tracking-tight"
                >
                  MedAssess Pro
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsHovered(false);
            }}
            className="hidden md:flex text-slate-500 hover:text-white transition-colors"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 hide-scrollbar px-3">
          <nav className="flex flex-col gap-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin" && link.href !== "/student" && link.href !== "/superadmin" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative group block"
                  title={!expanded ? link.name : ""}
                >
                  <div className={`relative flex items-center ${expanded ? 'px-3' : 'justify-center'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#1157CF] text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}>
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                    
                    <AnimatePresence>
                      {expanded && (
                        <motion.span 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="ml-3 truncate flex-1"
                        >
                          {link.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Mini Profile */}
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center ${expanded ? 'gap-3 px-3 py-2' : 'justify-center p-2'} rounded-lg hover:bg-white/5 transition-colors cursor-pointer`}
               onClick={() => {
                 if (currentUser.role === "student") window.location.href = "/student/profile";
                 else if (currentUser.role === "admin") window.location.href = "/admin/profile";
                 else window.location.href = "/superadmin/profile";
               }}>
            <div className="h-8 w-8 min-w-[32px] rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs shadow-inner border border-white/10">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            
            <AnimatePresence>
              {expanded && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{role.replace('_', ' ')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-[100] flex md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#03122E]/80 backdrop-blur-md"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex w-[280px] max-w-[80vw] flex-col bg-[#03122E] p-4 shadow-2xl h-full z-[101] border-r border-white/10"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-[#1157CF] rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-white tracking-tight">MedAssess</span>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-full p-2 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                <nav className="flex flex-col gap-1">
                  {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href || (link.href !== "/admin" && link.href !== "/student" && link.href !== "/superadmin" && pathname.startsWith(link.href));

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-[#1157CF] text-white"
                            : "text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{link.name}</span>
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
