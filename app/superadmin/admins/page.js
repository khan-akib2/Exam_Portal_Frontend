"use client";

import { useEffect, useState } from "react";
import { 
  Users, UserPlus, Shield, ToggleLeft, ToggleRight, 
  Key, Trash2, X, Check, Mail, Phone, Lock, Eye, Copy, ShieldAlert,
  Search, CheckSquare, Square, MoreHorizontal, Filter, RefreshCw
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import { motion } from "framer-motion";

export default function SubAdminsManager() {
  const { showAlert, showConfirm } = useDialog();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", phone: "", permissions: [] });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);

  // States for permissions edit modal
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);
  
  const allPermissions = [
    { key: "manage_users", label: "Manage Students", desc: "Provision student divisions, run CSV batches, and verify records." },
    { key: "manage_questions", label: "Manage Questions", desc: "Extract MCQ booklets, learn markings, and edit repository drafts." },
    { key: "manage_exams", label: "Manage Exams", desc: "Build simulated tests, assign cohorts, and release assessments." },
  ];

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/superadmin/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error("Failed to load admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdminSelectToggle = (id) => {
    setSelectedAdminIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || admin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAllFilteredAdmins = () => {
    if (selectedAdminIds.length === filteredAdmins.length) {
      setSelectedAdminIds([]);
    } else {
      setSelectedAdminIds(filteredAdmins.map(a => a._id));
    }
  };

  const handlePermissionToggle = (permKey, isEdit = false) => {
    if (isEdit) {
      setEditPermissions((prev) =>
        prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
      );
    } else {
      setNewAdmin((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(permKey)
          ? prev.permissions.filter((p) => p !== permKey)
          : [...prev.permissions, permKey],
      }));
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedCreds(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/superadmin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create admin");

      setGeneratedCreds({
        email: newAdmin.email,
        temporaryPassword: data.admin ? "Sent via email!" : "Check logs/email",
        permissions: newAdmin.permissions,
      });

      setNewAdmin({ name: "", email: "", phone: "", permissions: [] });
      setModalOpen(false);
      fetchAdmins();
    } catch (err) {
      showAlert(err.message, "Creation Error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/admins/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingAdmin) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/admins/${editingAdmin._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions: editPermissions }),
      });
      if (res.ok) {
        setEditingAdmin(null);
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (id, name) => {
    const confirmed = await showConfirm(`Are you sure you want to reset password for admin "${name}"? They will receive an email with new details.`, "Reset Password?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/admins/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resetPassword: true }),
      });
      if (res.ok) {
        showAlert("Password reset successfully. Credentials have been emailed.", "Success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    const confirmed = await showConfirm(`Are you sure you want to permanently delete admin "${name}"? This action cannot be undone.`, "Delete Admin?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/admins/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const activeCount = admins.filter(a => a.status === 'active').length;
  const fullAccessCount = admins.filter(a => a.permissions.length === 3).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 w-full max-w-[1200px] mx-auto text-left"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Admin Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Provision sub-administrators and allot fine-grained system features.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1157CF] text-white text-xs font-bold rounded-lg hover:bg-[#0D46A8] transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4" /> Add Sub-Admin
          </button>
        </div>
      </div>

      {/* Top Statistics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="premium-card p-4 flex items-center justify-between bg-white dark:bg-[var(--card)]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Sub-Admins</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{admins.length}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Users className="h-5 w-5 text-slate-500 dark:text-slate-455" />
          </div>
        </div>
        <div className="premium-card p-4 flex items-center justify-between bg-white dark:bg-[var(--card)]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Active Admins</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{activeCount}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#DCFAED] dark:bg-emerald-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#0F7B3E] dark:text-emerald-400" />
          </div>
        </div>
        <div className="premium-card p-4 flex items-center justify-between bg-white dark:bg-[var(--card)]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Full Access</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{fullAccessCount}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#EEF4FF] dark:bg-[#1157CF]/20 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-[#1157CF] dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Generated Credentials Success Alert Box */}
      {generatedCreds && (
        <div className="rounded-xl bg-[#DCFAED] border border-[#0F7B3E]/20 p-5 space-y-3 shadow-sm animate-slide-down">
          <div className="flex items-center gap-2 text-[#0F7B3E] font-bold text-sm">
            <Check className="h-5 w-5 rounded-full bg-[#0F7B3E] text-white p-0.5" />
            <span>Sub-Admin Account Provisioned Successfully!</span>
          </div>
          <p className="text-xs text-[#0F7B3E]/80 font-medium">
            The profile has been built. A temporary greeting link with passwords has been routed to <strong>{generatedCreds.email}</strong>.
          </p>
        </div>
      )}

      {/* Main Data Grid */}
      <div className="premium-card bg-white dark:bg-[var(--card)] border dark:border-white/5 flex flex-col overflow-hidden shadow-sm">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:border-[#1157CF] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#1157CF] dark:focus:ring-blue-500 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto text-left">
            <div className="relative flex-1 md:w-40 text-left">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:border-[#1157CF] dark:focus:border-blue-500 appearance-none"
              >
                <option value="" className="dark:bg-slate-950 dark:text-white">All Statuses</option>
                <option value="active" className="dark:bg-slate-950 dark:text-white">Active</option>
                <option value="suspended" className="dark:bg-slate-950 dark:text-white">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedAdminIds.length > 0 && (
          <div className="bg-[#1157CF]/5 border-b border-[#1157CF]/10 dark:border-white/5 px-4 py-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 text-left">
              <span className="text-xs font-bold text-[#1157CF] dark:text-blue-400 bg-[#1157CF]/10 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                {selectedAdminIds.length} Selected
              </span>
            </div>
            {/* Note: Bulk actions can be added here if needed for Admins */}
          </div>
        )}

        {/* Data Grid */}
        <div className="overflow-x-auto text-left">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/5">
                <th className="px-4 py-3 w-12 text-center">
                  <button onClick={handleSelectAllFilteredAdmins} className="text-slate-400 hover:text-[#1157CF] dark:hover:text-blue-400 flex items-center justify-center w-full cursor-pointer">
                    {selectedAdminIds.length === filteredAdmins.length && filteredAdmins.length > 0 ? (
                      <CheckSquare className="h-4.5 w-4.5 text-[#1157CF] dark:text-blue-450" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Administrator</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Access Modules</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#1157CF] dark:text-blue-400" />
                    Loading grid...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    No sub-admins found.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isSelected = selectedAdminIds.includes(admin._id);
                  return (
                    <tr key={admin._id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${isSelected ? "bg-[#1157CF]/5 dark:bg-blue-500/5" : ""}`}>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleAdminSelectToggle(admin._id)} className="text-slate-400 hover:text-[#1157CF] dark:hover:text-blue-400 flex items-center justify-center w-full cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-[#1157CF] dark:text-blue-450" />
                          ) : (
                            <Square className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 shrink-0">
                            {getInitials(admin.name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{admin.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {admin.permissions.length === 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">READ-ONLY</span>
                          ) : (
                            admin.permissions.map((perm) => (
                              <span key={perm} className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1157CF]/10 text-[#1157CF] dark:bg-blue-500/10 dark:text-blue-400 border border-[#1157CF]/20 dark:border-blue-500/20">
                                {perm.replace("_", " ").toUpperCase()}
                              </span>
                            ))
                          )}
                          <button
                            onClick={() => {
                              setEditingAdmin(admin);
                              setEditPermissions(admin.permissions);
                            }}
                            className="text-[10px] font-bold text-[#1157CF] dark:text-blue-400 hover:underline ml-2 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-left">
                        {admin.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#0F7B3E] dark:text-emerald-400 bg-[#DCFAED] dark:bg-emerald-500/10 uppercase tracking-wider border border-[#0F7B3E]/20 dark:border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0F7B3E] dark:bg-emerald-450" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" style={{ opacity: 1 }}>
                          <button onClick={() => handleToggleStatus(admin._id, admin.status)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer" title="Toggle Status">
                            <Shield className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleResetPassword(admin._id, admin.name)} className="p-1.5 text-slate-400 hover:text-[#1157CF] dark:hover:text-blue-400 hover:bg-[#EEF4FF] dark:hover:bg-[#1157CF]/10 rounded transition-colors cursor-pointer" title="Reset Password">
                            <Key className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteAdmin(admin._id, admin.name)} className="p-1.5 text-slate-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors cursor-pointer" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>Showing {filteredAdmins.length} administrators</div>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 cursor-pointer" disabled>Prev</button>
            <button className="px-2.5 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 cursor-pointer" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* CREATE SUB-ADMIN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0F111E] rounded-xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Provision Sub-Admin</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div className="p-5 space-y-4 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white focus:border-[#1157CF] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#1157CF]"
                    placeholder="Dr. Rajesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white focus:border-[#1157CF] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#1157CF]"
                    placeholder="rajesh.kumar@hospital.org"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white focus:border-[#1157CF] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#1157CF]"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Allot Features</label>
                  <div className="space-y-2">
                    {allPermissions.map((perm) => {
                      const checked = newAdmin.permissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => handlePermissionToggle(perm.key)}
                          className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-all ${
                            checked
                              ? "border-[#1157CF] bg-[#1157CF]/5 dark:border-blue-500 dark:bg-blue-500/5"
                              : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center h-4 mt-0.5">
                            {checked ? (
                               <CheckSquare className="h-4 w-4 text-[#1157CF] dark:text-blue-450" />
                            ) : (
                               <Square className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-900 dark:text-white">{perm.label}</span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{perm.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#1157CF] text-white text-xs font-bold rounded hover:bg-[#0D46A8] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Provisioning..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0F111E] rounded-xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Edit Capabilities</h2>
              <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-left">
              <p className="text-xs font-medium text-slate-650 dark:text-slate-350">
                Modify administrative capabilities for <strong>{editingAdmin.name}</strong>.
              </p>
              
              <div className="space-y-2">
                {allPermissions.map((perm) => {
                  const checked = editPermissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handlePermissionToggle(perm.key, true)}
                      className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-all ${
                        checked
                          ? "border-[#1157CF] bg-[#1157CF]/5 dark:border-blue-500 dark:bg-blue-500/5"
                          : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center h-4 mt-0.5">
                         {checked ? (
                             <CheckSquare className="h-4 w-4 text-[#1157CF] dark:text-blue-450" />
                          ) : (
                             <Square className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          )}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">{perm.label}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{perm.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePermissions}
                className="px-4 py-2 bg-[#1157CF] text-white text-xs font-bold rounded hover:bg-[#0D46A8] transition-colors shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
