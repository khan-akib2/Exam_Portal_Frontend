"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Menu,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [theme, setTheme] = useState("light");

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

    // Theme initialization
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

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
      { name: "Dashboard", href: "/superadmin", icon: Home },
      { name: "Manage Sub-Admins", href: "/superadmin/admins", icon: UserCheck },
      { name: "Global Settings", href: "/superadmin/settings", icon: Settings },
      { name: "Audit Logs", href: "/superadmin/audit-logs", icon: Activity },
      { name: "Profile Settings", href: "/superadmin/profile", icon: User }
    );
  } else if (role === "admin") {
    links.push({ name: "Dashboard", href: "/admin", icon: Home });
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
      { name: "Dashboard", href: "/student", icon: Home },
      { name: "Mock Exams", href: "/student/exams", icon: ShieldCheck, badge: 3 },
      { name: "Completed", href: "/student/exams?tab=completed", icon: FileText, badge: 0 },
      { name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
      { name: "Announcements", href: "/student/announcements", icon: Bell, badge: 2 },
      { name: "Profile Settings", href: "/student/profile", icon: User }
    );
  }

  const handleLinkClick = () => setIsMobileOpen(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const checkIsActive = (linkHref) => {
    // Parse link.href to isolate query parameters
    if (linkHref.includes("?")) {
      const [linkPathname, queryString] = linkHref.split("?");
      const params = new URLSearchParams(queryString);
      const linkTab = params.get("tab");
      const activeTab = searchParams ? searchParams.get("tab") : null;
      return pathname === linkPathname && activeTab === linkTab;
    }
    
    // For standard paths, make sure no active tab is currently selected in searchParams
    const activeTab = searchParams ? searchParams.get("tab") : null;
    if (activeTab && pathname === linkHref) {
      return false;
    }
    
    return pathname === linkHref || (linkHref !== "/admin" && linkHref !== "/student" && linkHref !== "/superadmin" && pathname.startsWith(linkHref));
  };

  // Determine if sidebar is expanded based on collapse state and hover
  const expanded = !isCollapsed || isHovered;

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: expanded ? 260 : 76 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
        className="bg-[#FAFBFD] dark:bg-[#03122E] border-r border-[#EFEFF4] dark:border-white/5 hidden md:flex flex-col sticky top-0 h-screen z-50 text-slate-600 dark:text-slate-300 transition-colors duration-300"
      >
        {/* Brand Logo Header */}
        <div className="relative flex items-center h-16 border-b border-[#F2F2F6] dark:border-white/5 w-full shrink-0 px-4">
          <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-400 ease-in-out ${expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
            <div className="h-8 w-8 min-w-[32px] bg-gradient-to-tr from-[#1157CF] to-[#5B93EE] rounded-xl flex items-center justify-center shadow-md shadow-[#1157CF]/10">
              <Activity className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-slate-800 dark:text-white tracking-tight text-sm">MedAssess Pro</span>
          </div>

          {/* Logo Collapsed Icon */}
          {!expanded && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <div className="h-8 w-8 min-w-[32px] bg-gradient-to-tr from-[#1157CF] to-[#5B93EE] rounded-xl flex items-center justify-center shadow-md shadow-[#1157CF]/10">
                <Activity className="h-4.5 w-4.5 text-white" />
              </div>
            </div>
          )}
          
          <button 
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsHovered(false);
            }}
            className={`absolute flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all duration-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 ${expanded ? 'right-3' : 'hidden'}`}
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Links Navigation */}
        <div className="flex-1 overflow-y-auto py-5 hide-scrollbar px-3">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = checkIsActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative group block"
                  title={!expanded ? link.name : ""}
                >
                  <div className={`relative flex items-center ${expanded ? 'px-3.5 py-3' : 'justify-center py-3'} rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-[#1157CF] text-white shadow-md shadow-[#1157CF]/15"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#1157CF] dark:hover:text-white hover:bg-[#1157CF]/5 dark:hover:bg-white/10"
                  }`}>
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-300 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-[#1157CF] dark:group-hover:text-white"}`} />
                    
                    <AnimatePresence>
                      {expanded && (
                        <motion.span 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="ml-3 truncate flex-1 flex items-center justify-between"
                        >
                          <span className="font-semibold text-[13px]">{link.name}</span>
                          
                          <div className="flex items-center gap-1.5">
                            {link.badge > 0 && (
                              <span className={`min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5 transition-colors duration-300 ${
                                isActive 
                                  ? "bg-white/20 text-white" 
                                  : "bg-[#EEF4FF] text-[#1157CF] dark:bg-[#1157CF]/20 dark:text-[#5B93EE]"
                              }`}>
                                {link.badge}
                              </span>
                            )}
                            
                            {isActive && (
                              <ChevronRight className="h-4 w-4 text-white shrink-0" />
                            )}
                          </div>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Collapsed badge dot */}
                  {!expanded && link.badge > 0 && (
                    <span className="absolute top-1 right-1 h-4.5 w-4.5 rounded-full bg-[#1157CF] text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-[#03122E]">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Mini Profile & Theme Pill Toggle */}
        <div className="p-4 border-t border-[#F2F2F6] dark:border-white/5 flex flex-col gap-3">
          {/* User Profile Card */}
          <div 
            className={`flex items-center ${expanded ? 'gap-3 px-3 py-2' : 'justify-center p-1.5'} rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors duration-300 cursor-pointer`}
            onClick={() => {
              if (currentUser.role === "student") window.location.href = "/student/profile";
              else if (currentUser.role === "admin") window.location.href = "/admin/profile";
              else window.location.href = "/superadmin/profile";
            }}
          >
            <div className="h-9 w-9 min-w-[36px] rounded-full bg-gradient-to-tr from-[#1157CF] to-[#5B93EE] text-white font-bold text-sm flex items-center justify-center shadow-sm">
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
                  <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium capitalize truncate">
                    {role.replace('_', ' ')} • Active
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Pill Toggle Container */}
          {expanded ? (
            <div className="bg-[#EFF0F6] dark:bg-white/5 p-1 rounded-full flex items-center w-full transition-all duration-300">
              <button 
                onClick={() => handleThemeChange("light")}
                className={`flex-1 flex items-center justify-center py-1.5 px-3 rounded-full text-xs font-bold transition-all duration-300 ${
                  theme === "light" 
                    ? "bg-[#181920] text-white shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Light
              </button>
              <button 
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 flex items-center justify-center py-1.5 px-3 rounded-full text-xs font-bold transition-all duration-300 ${
                  theme === "dark" 
                    ? "bg-[#1157CF] text-white shadow-sm" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Dark
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleThemeChange(theme === "light" ? "dark" : "light")}
              className="w-9 h-9 mx-auto flex items-center justify-center rounded-xl bg-[#EFF0F6] dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-[#1157CF]/10 hover:text-[#1157CF] transition-all duration-300"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? (
                <span className="text-xs font-bold text-[#1157CF]">L</span>
              ) : (
                <span className="text-xs font-bold text-[#1157CF]">D</span>
              )}
            </button>
          )}
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
              className="relative flex w-[280px] max-w-[80vw] flex-col bg-[#FAFBFD] dark:bg-[#03122E] p-4 shadow-2xl h-full z-[101] border-r border-[#EFEFF4] dark:border-white/5"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F2F2F6] dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gradient-to-tr from-[#1157CF] to-[#5B93EE] rounded-xl flex items-center justify-center">
                    <Activity className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-white tracking-tight text-sm">MedAssess</span>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Mobile Links */}
              <div className="flex-1 overflow-y-auto hide-scrollbar mb-4">
                <nav className="flex flex-col gap-1.5">
                  {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = checkIsActive(link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-3.5 text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? "bg-[#1157CF] text-white shadow-md shadow-[#1157CF]/15"
                            : "text-slate-600 dark:text-slate-400 hover:text-[#1157CF] dark:hover:text-white hover:bg-[#1157CF]/5 dark:hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-505 dark:text-slate-400"}`} />
                          <span className="font-semibold">{link.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {link.badge > 0 && (
                            <span className={`min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1.5 ${
                              isActive 
                                ? "bg-white/20 text-white" 
                                : "bg-[#EEF4FF] text-[#1157CF] dark:bg-[#1157CF]/20 dark:text-[#5B93EE]"
                            }`}>
                              {link.badge}
                            </span>
                          )}
                          {isActive && <ChevronRight className="h-4.5 w-4.5 text-white" />}
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Profile & Theme Toggle */}
              <div className="mt-auto pt-4 border-t border-[#F2F2F6] dark:border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#1157CF] to-[#5B93EE] text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium capitalize">
                      {role.replace('_', ' ')} • Active
                    </p>
                  </div>
                </div>

                <div className="bg-[#EFF0F6] dark:bg-white/5 p-1 rounded-full flex items-center w-full transition-all duration-300">
                  <button 
                    onClick={() => handleThemeChange("light")}
                    className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-xs font-bold transition-all duration-300 ${
                      theme === "light" 
                        ? "bg-[#181920] text-white shadow-sm" 
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => handleThemeChange("dark")}
                    className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-xs font-bold transition-all duration-300 ${
                      theme === "dark" 
                        ? "bg-[#1157CF] text-white shadow-sm" 
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarContent />
    </Suspense>
  );
}
