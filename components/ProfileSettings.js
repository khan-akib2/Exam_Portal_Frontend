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
      <div className="flex h-48 items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-650" />
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
    <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in">
      {/* Title */}
      <div className="border-b border-slate-150 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="h-5.5 w-5.5 text-teal-650" />
          Account & Profile Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details, verify credentials, and update security parameters.
        </p>
      </div>

      {/* Overview Card */}
      <div className="premium-card p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Lights */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />
        
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest block">User Registry</span>
          <h2 className="text-xl font-black tracking-tight text-white">{currentUser.name}</h2>
          <p className="text-xs text-slate-350">{currentUser.email}</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-950/45 border border-slate-800 p-4 shrink-0 relative z-10">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Access Role</span>
            <span className={`inline-flex items-center text-[10px] font-bold px-3 py-1 rounded-full border mt-2 uppercase tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
              {currentUser.role.replace("_", " ")}
            </span>
          </div>

          {currentUser.role === "student" && (
            <>
              <div className="h-8 w-px bg-slate-700 mx-3" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Batch</span>
                <span className="text-xs font-black text-slate-200 block mt-2.5">{currentUser.batch || "General"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 shadow-3xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800 shadow-3xs">
          <AlertCircle className="h-5 w-5 text-red-505 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form 1: Profile Details */}
        <div className="premium-card p-6 space-y-4 bg-white border border-slate-200">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-150 pb-3 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-teal-650" />
            Personal Details
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Email Address (Read-only)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-450 pl-9 pr-3 py-2.5 text-xs outline-none cursor-not-allowed border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  placeholder="+7 (999) 123-4567"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-650 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition-all cursor-pointer active:scale-98 shadow-md shadow-teal-650/10 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Details</span>
            </button>
          </form>
        </div>

        {/* Form 2: Password Security */}
        <div className="premium-card p-6 space-y-4 bg-white border border-slate-200">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-150 pb-3 flex items-center gap-2">
            <Lock className="h-4.5 w-4.5 text-teal-650" />
            Security & Credentials
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Current Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-650 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition-all cursor-pointer active:scale-98 shadow-md shadow-teal-650/10 disabled:opacity-50"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
