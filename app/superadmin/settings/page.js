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
      <div className="flex h-48 items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-650" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in text-left">
      <div className="border-b border-slate-150 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Settings</h1>
        <p className="text-sm text-slate-500">Configure platform behaviors, anti-cheat defaults, and student reward parameters.</p>
      </div>

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2 shadow-3xs animate-slide-down">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span>System settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="premium-card p-6 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        {/* Toggle 1: Maintenance Mode */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <label className="block text-sm font-black text-slate-900 leading-tight">Global Maintenance Mode</label>
            <span className="block text-xs text-slate-500 leading-normal max-w-lg">
              When enabled, students will see a maintenance page and cannot attempt exams or browse results. Admins and Super Admins retain full access.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.maintenanceMode ? "bg-red-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Anti-Cheat Toggle */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <label className="block text-sm font-black text-slate-900 flex items-center gap-1.5 leading-tight">
              <ShieldAlert className="h-4 w-4 text-teal-655" />
              Strict Anti-Cheat Engine
            </label>
            <span className="block text-xs text-slate-500 leading-normal max-w-lg">
              Enables active browser window focus monitoring, copy-paste block, and right-click intercept. Focus loss will log warnings to user attempts and pop up warnings.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, antiCheatEnabled: !settings.antiCheatEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.antiCheatEnabled ? "bg-teal-650" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.antiCheatEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Numeric parameters */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Gamification Parameters</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">XP Per Correct Answer</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.xpPerCorrectAnswer}
                onChange={(e) => setSettings({ ...settings, xpPerCorrectAnswer: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 font-semibold text-slate-800"
              />
              <span className="block text-4xs text-slate-400 mt-1.5 uppercase font-bold">Standard reward is 10 XP</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Streak Bonus XP</label>
              <input
                type="number"
                min="0"
                max="200"
                value={settings.streakBonusXp}
                onChange={(e) => setSettings({ ...settings, streakBonusXp: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 font-semibold text-slate-800"
              />
              <span className="block text-4xs text-slate-400 mt-1.5 uppercase font-bold">Extra daily streaking points</span>
            </div>
          </div>
        </div>

        {/* Warning Indicator */}
        {settings.maintenanceMode && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 flex items-start gap-2.5 shadow-3xs animate-pulse">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Maintenance Mode is Active</span>
              <span className="block mt-0.5 leading-normal text-slate-650 font-medium">
                Students will be locked out of the exam room and dashboards until this switch is turned off.
              </span>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-650 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/10 hover:bg-teal-700 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
