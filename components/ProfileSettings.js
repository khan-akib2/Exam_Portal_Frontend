"use client";

import { useState, useEffect } from "react";
import { User, Phone, Lock, Save, Shield, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function ProfileSettings() {
  const { showAlert } = useDialog();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setTimeout(() => {
          setCurrentUser(user);
          setFormData({
            name: user.name || "",
            phone: user.phone || "",
          });
        }, 0);
      } catch (e) {
        console.error("Failed to load user info", e);
      }
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="flex h-48 items-center justify-center bg-slate-50 dark:bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-teal-600 dark:border-t-teal-550" />
      </div>
    );
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      window.dispatchEvent(new Event("storage"));
      
      setSuccessMsg("Profile details updated successfully.");
      showAlert("Profile updated successfully.", "Success");
    } catch (err) {
      setErrorMsg(err.message);
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setLoading(false);
      setErrorMsg("New passwords do not match.");
      showAlert("New passwords do not match.", "Error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password.");

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      window.dispatchEvent(new Event("storage"));

      setSuccessMsg("Password changed successfully.");
      showAlert("Password updated successfully.", "Success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setErrorMsg(err.message);
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    if (role === "super_admin") return "bg-indigo-500/10 border-indigo-500/20 text-indigo-700";
    if (role === "admin") return "bg-blue-500/10 border-blue-500/20 text-blue-700";
    return "bg-teal-500/10 border-teal-500/20 text-teal-700";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left animate-fade-in pt-4">
      {/* Title */}
      <div className="border-b border-slate-150 dark:border-white/5 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3 leading-normal">
          <span className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Shield className="h-6 w-6" />
          </span>
          Account & Profile Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Manage your personal details, verify credentials, and update security parameters.
        </p>
      </div>

      {/* Overview Card */}
      <div className="p-8 bg-gradient-to-br from-[#062459] via-[#0A3580] to-[#03122E] text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#1157CF]/30 shadow-2xl relative overflow-hidden rounded-3xl group">
        {/* Lights */}
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl group-hover:bg-teal-400/30 transition-colors duration-700 pointer-events-none" />
        <div className="absolute left-0 bottom-0 -mb-16 -ml-16 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-colors duration-700 pointer-events-none" />
        
        <div className="space-y-3 relative z-10 flex-1">
          <span className="text-[10px] font-extrabold text-teal-300 uppercase tracking-widest block">User Registry</span>
          <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">{currentUser.name}</h2>
          <p className="text-sm text-blue-100 font-medium">{currentUser.email}</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 shrink-0 relative z-10 hover:bg-white/15 transition-colors duration-300 shadow-lg">
          <div className="text-center">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest block">Access Role</span>
            <span className="inline-flex items-center text-[10px] font-black px-4 py-1.5 rounded-full border border-teal-400/30 bg-teal-400/10 text-teal-300 mt-2.5 uppercase tracking-widest shadow-sm">
              {currentUser.role.replace("_", " ")}
            </span>
          </div>

          {currentUser.role === "student" && (
            <>
              <div className="h-10 w-px bg-white/20 mx-2" />
              <div className="text-center">
                <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest block">Batch</span>
                <span className="text-sm font-black text-white block mt-2.5">{currentUser.batch || "General"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50/80 backdrop-blur-md border border-emerald-200/50 p-4 text-sm font-bold text-emerald-800 shadow-sm animate-slide-down">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50/80 backdrop-blur-md border border-red-200/50 p-4 text-sm font-bold text-red-800 shadow-sm animate-slide-down">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Form 1: Profile Details */}
        <div className="bg-white/70 dark:bg-[var(--card)] backdrop-blur-xl border border-slate-200 dark:border-white/5 p-8 space-y-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-4 flex items-center gap-2 relative z-10">
            <User className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Personal Details
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-5 relative z-10">
            <div className="group/input">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 group-focus-within/input:text-teal-500 transition-colors">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 pl-11 pr-4 py-3 text-sm outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-bold text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="group/input opacity-80">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Email Address (Read-only)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 pl-11 pr-4 py-3 text-sm outline-none cursor-not-allowed font-bold text-slate-500 dark:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            <div className="group/input">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 group-focus-within/input:text-teal-500 transition-colors">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 pl-11 pr-4 py-3 text-sm outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-bold text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  placeholder="+7 (999) 123-4567"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Save className="h-4 w-4" />
              <span>Save Details</span>
            </button>
          </form>
        </div>

        {/* Form 2: Password Security */}
        <div className="bg-white/70 dark:bg-[var(--card)] backdrop-blur-xl border border-slate-200 dark:border-white/5 p-8 space-y-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-150 dark:border-white/5 pb-4 flex items-center gap-2 relative z-10">
            <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Security & Credentials
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-5 relative z-10">
            <div className="group/input">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 group-focus-within/input:text-indigo-500 transition-colors">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 pl-11 pr-4 py-3 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="group/input">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 group-focus-within/input:text-indigo-500 transition-colors">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-955/40 pl-11 pr-4 py-3 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div className="group/input">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-455 group-focus-within/input:text-indigo-500 transition-colors">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-955/40 pl-11 pr-4 py-3 text-sm outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <KeyRound className="h-4 w-4" />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
