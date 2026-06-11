"use client";

import { useEffect, useState } from "react";
import { Settings, Save, ShieldAlert, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function GlobalSettingsManager() {
  const { showAlert } = useDialog();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    antiCheatEnabled: true,
    xpPerCorrectAnswer: 10,
    streakBonusXp: 20,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/superadmin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchSettings();
    }, 0);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/superadmin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      showAlert(err.message, "Settings Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in text-left">
      <div className="border-b border-slate-150 dark:border-white/5 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-7 w-7 text-teal-650 dark:text-teal-400" />
          Global Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Configure platform behaviors, anti-cheat defaults, and student reward parameters.</p>
      </div>

      {success && (
        <div className="rounded-xl bg-emerald-50/80 backdrop-blur-md border border-emerald-200/50 dark:border-emerald-500/25 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 shadow-sm animate-slide-down dark:bg-emerald-500/10">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>System settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 space-y-8 rounded-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl group-hover:bg-teal-400/20 transition-colors duration-700 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl group-hover:bg-indigo-400/20 transition-colors duration-700 pointer-events-none" />

        {/* Toggle 1: Maintenance Mode */}
        <div className="flex items-start justify-between gap-6 border-b border-slate-100/50 dark:border-white/5 pb-6 relative z-10">
          <div className="space-y-1.5">
            <label className="block text-sm font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
              Global Maintenance Mode
            </label>
            <span className="block text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg font-medium">
              When enabled, students will see a maintenance page and cannot attempt exams or browse results. Admins and Super Admins retain full access.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            className={`relative mt-1 inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 ${
              settings.maintenanceMode ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
                settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Anti-Cheat Toggle */}
        <div className="flex items-start justify-between gap-6 border-b border-slate-100/50 dark:border-white/5 pb-6 relative z-10">
          <div className="space-y-1.5">
            <label className="block text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
              <ShieldAlert className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
              Strict Anti-Cheat Engine
            </label>
            <span className="block text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg font-medium">
              Enables active browser window focus monitoring, copy-paste block, and right-click intercept. Focus loss will log warnings to user attempts.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, antiCheatEnabled: !settings.antiCheatEnabled })}
            className={`relative mt-1 inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 ${
              settings.antiCheatEnabled ? "bg-teal-600 shadow-[0_0_12px_rgba(13,148,136,0.4)]" : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
                settings.antiCheatEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Numeric parameters */}
        <div className="space-y-5 pt-2 relative z-10">
          <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest flex items-center gap-2">
            <span className="h-px w-6 bg-teal-200 dark:bg-teal-800 rounded-full"></span>
            Gamification Parameters
          </h3>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="group/input">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">XP Per Correct Answer</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.xpPerCorrectAnswer}
                onChange={(e) => setSettings({ ...settings, xpPerCorrectAnswer: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border-2 border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-950/40 px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-teal-500/10 font-bold text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700"
              />
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase font-bold tracking-wide">Standard reward is 10 XP</span>
            </div>

            <div className="group/input">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Streak Bonus XP</label>
              <input
                type="number"
                min="0"
                max="200"
                value={settings.streakBonusXp}
                onChange={(e) => setSettings({ ...settings, streakBonusXp: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border-2 border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-950/40 px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-teal-500/10 font-bold text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700"
              />
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase font-bold tracking-wide">Extra daily streaking points</span>
            </div>
          </div>
        </div>

        {/* Warning Indicator */}
        {settings.maintenanceMode && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 p-5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm animate-pulse relative z-10 backdrop-blur-sm">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-sm block mb-1">Maintenance Mode is Active</span>
              <span className="block leading-relaxed text-amber-800/80 dark:text-amber-300/80 font-medium">
                Students will be locked out of the exam room and dashboards until this switch is turned off.
              </span>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-6 border-t border-slate-100/50 dark:border-white/5 relative z-10">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
