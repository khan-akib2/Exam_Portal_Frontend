"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Settings, Activity, ShieldAlert, ChevronRight, Zap, AlertTriangle, ShieldCheck } from "lucide-react";

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
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-650" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 rounded-2xl text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative backdrop */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">Core Administrator</span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Super Admin Control Center</h1>
          <p className="text-xs text-slate-350 max-w-xl leading-relaxed">
            Provision sub-admin feature privileges, regulate global anti-cheat rules, trigger offline maintenance states, and monitor platform logs.
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stat 1 */}
        <div className="premium-card p-6 flex items-center justify-between bg-white border border-slate-250/70 shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sub-Administrators</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats.adminsCount}</h3>
            <p className="text-2xs font-semibold text-slate-500 mt-1">{stats.activeAdmins} active accounts</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-3xs shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="premium-card p-6 flex items-center justify-between bg-white border border-slate-250/70 shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Global Anti-Cheat</span>
            <div className="pt-1">
              {settings?.antiCheatEnabled ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-250/50 px-3 py-1 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3 animate-pulse" /> Active Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-250/50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-2xs font-semibold text-slate-500 pt-0.5">Focus monitor & copy-paste blocks</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100/50 shadow-3xs shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="premium-card p-6 flex items-center justify-between bg-white border border-slate-250/70 shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Maintenance State</span>
            <div className="pt-1">
              {settings?.maintenanceMode ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-250/50 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> System Offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                  Online (Active)
                </span>
              )}
            </div>
            <p className="text-2xs font-semibold text-slate-500 pt-0.5">Limits student access limits</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100/50 shadow-3xs shrink-0">
            <Settings className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation Actions Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Action 1 */}
        <div className="premium-card p-6 flex flex-col justify-between bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Manage Sub-Admins
            </h2>
            <p className="text-xs text-slate-550 leading-relaxed">
              Create sub-administrator credentials, allocate workspace modules (exams, question pools), or suspend accounts dynamically.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              href="/superadmin/admins"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              <span>Manage Accounts</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Action 2 */}
        <div className="premium-card p-6 flex flex-col justify-between bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Global System Settings
            </h2>
            <p className="text-xs text-slate-550 leading-relaxed">
              Configure student XP reward bounds, streaking milestones, anti-cheat tolerances, and platform maintenance templates.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              href="/superadmin/settings"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-650 hover:text-teal-700 hover:underline"
            >
              <span>Adjust Variables</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Action 3 */}
        <div className="premium-card p-6 flex flex-col justify-between bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Activity className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Platform Audit Logs
            </h2>
            <p className="text-xs text-slate-550 leading-relaxed">
              Audit log histories of all logins, booklet ingestions, exam releases, and proctor-recorded cheating violations.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              href="/superadmin/audit-logs"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-650 hover:text-emerald-700 hover:underline"
            >
              <span>View System Logs</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
