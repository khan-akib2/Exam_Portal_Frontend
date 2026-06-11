"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Settings, Activity, ShieldAlert, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ adminsCount: 0, activeAdmins: 0 });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch sub-admins
        const adminsRes = await fetch("/api/superadmin/admins", { headers });
        const adminsData = await adminsRes.json();
        
        // Fetch settings
        const settingsRes = await fetch("/api/superadmin/settings", { headers });
        const settingsData = await settingsRes.json();

        if (adminsRes.ok && settingsRes.ok) {
          const adminsList = adminsData.admins || [];
          setStats({
            adminsCount: adminsList.length,
            activeAdmins: adminsList.filter((a) => a.status === "active").length,
          });
          setSettings(settingsData.settings);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-[#1157CF] dark:border-t-blue-400 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 text-left w-full max-w-[1200px] mx-auto"
    >
      {/* Title Header Banner */}
      <div className="bg-gradient-to-br from-[#03122E] via-[#062459] to-[#1157CF] p-8 md:p-10 rounded-2xl text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
        {/* Decorative backdrop */}
        <div className="absolute right-0 top-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-[10px] font-bold text-white uppercase tracking-widest mb-2 border border-white/20">
            <ShieldAlert className="h-3 w-3" /> Core Administrator
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Super Admin Control Center</h1>
          <p className="text-sm text-blue-100 max-w-2xl font-medium leading-relaxed">
            Provision sub-admin feature privileges, regulate global anti-cheat rules, trigger offline maintenance states, and monitor platform logs.
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stat 1 */}
        <div className="premium-card p-6 flex items-center justify-between bg-white dark:bg-[var(--card)]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">Sub-Administrators</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stats.adminsCount}</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{stats.activeAdmins} active accounts</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1157CF]/10 text-[#1157CF] dark:bg-[#1157CF]/20 dark:text-blue-400 border border-[#1157CF]/20 dark:border-[#1157CF]/30 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="premium-card p-6 flex items-center justify-between bg-white dark:bg-[var(--card)]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">Global Anti-Cheat</span>
            <div className="pt-1">
              {settings?.antiCheatEnabled ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0F7B3E] bg-[#DCFAED] dark:text-emerald-450 dark:bg-emerald-500/10 border border-[#0F7B3E]/20 dark:border-emerald-500/20 px-2.5 py-1 rounded uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3 animate-pulse" /> Active Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#B45309] bg-[#FEF3CD] dark:text-amber-450 dark:bg-amber-500/10 border border-[#B45309]/20 dark:border-amber-500/20 px-2.5 py-1 rounded uppercase tracking-wider">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 pt-1.5">Focus monitor & copy-paste blocks</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="premium-card p-6 flex items-center justify-between bg-white dark:bg-[var(--card)]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">Maintenance State</span>
            <div className="pt-1">
              {settings?.maintenanceMode ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#C0152A] bg-[#FDEAEC] dark:text-red-405 dark:bg-red-500/10 border border-[#C0152A]/20 dark:border-red-500/20 px-2.5 py-1 rounded uppercase tracking-wider animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> System Offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded uppercase tracking-wider">
                  Online (Active)
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 pt-1.5">Limits student access</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700 shrink-0">
            <Settings className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation Actions Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Action 1 */}
        <div className="premium-card p-6 flex flex-col justify-between bg-white dark:bg-[var(--card)] group cursor-pointer hover:border-[#1157CF]/50">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1157CF]/10 text-[#1157CF] dark:bg-[#1157CF]/20 dark:text-blue-400 border border-[#1157CF]/20 dark:border-[#1157CF]/30">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Manage Sub-Admins</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Create sub-administrator credentials, allocate workspace modules (exams, question pools), or suspend accounts dynamically.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <Link
              href="/superadmin/admins"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1157CF] dark:text-blue-400 group-hover:text-[#0D46A8] dark:group-hover:text-blue-300 transition-colors"
            >
              <span>Manage Accounts</span>
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Action 2 */}
        <div className="premium-card p-6 flex flex-col justify-between bg-white dark:bg-[var(--card)] group cursor-pointer hover:border-[#1157CF]/50">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Global System Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Configure student XP reward bounds, streaking milestones, anti-cheat tolerances, and platform maintenance templates.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <Link
              href="/superadmin/settings"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
            >
              <span>Adjust Variables</span>
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Action 3 */}
        <div className="premium-card p-6 flex flex-col justify-between bg-white dark:bg-[var(--card)] group cursor-pointer hover:border-[#1157CF]/50">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Platform Audit Logs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Audit log histories of all logins, booklet ingestions, exam releases, and proctor-recorded cheating violations.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <Link
              href="/superadmin/audit-logs"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
            >
              <span>View System Logs</span>
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
