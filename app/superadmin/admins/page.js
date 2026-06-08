"use client";

import { useEffect, useState } from "react";
import { 
  Users, UserPlus, Shield, ToggleLeft, ToggleRight, 
  Key, Trash2, X, Check, Mail, Phone, Lock, Eye, Copy, ShieldAlert
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function SubAdminsManager() {
  const { showAlert, showConfirm } = useDialog();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", phone: "", permissions: [] });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  
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
    setTimeout(() => {
      fetchAdmins();
    }, 0);
  }, []);

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

      // Set generated credentials to show to user
      setGeneratedCreds({
        email: newAdmin.email,
        temporaryPassword: data.admin ? "Sent via email!" : "Check logs/email",
        permissions: newAdmin.permissions,
      });

      // Reset form
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

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Sub-Admins</h1>
          <p className="text-sm text-slate-500">Provision sub-administrators and allot fine-grained system features.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all active:scale-98 shrink-0 self-start sm:self-center cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Sub-Admin</span>
        </button>
      </div>

      {/* Generated Credentials Success Alert Box */}
      {generatedCreds && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 space-y-3 shadow-3xs animate-slide-down">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold">
            <Check className="h-4.5 w-4.5 rounded-full bg-emerald-600 text-white p-0.5" />
            <span>Sub-Admin Account Provisioned Successfully!</span>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed max-w-xl">
            The profile has been built. A temporary greeting link with passwords has been routed to <strong>{generatedCreds.email}</strong>.
          </p>
          <div className="text-2xs text-emerald-800 bg-white/60 border border-emerald-100/50 rounded-xl p-3.5 inline-block space-y-1 font-semibold">
            <p><strong>Email Username:</strong> {generatedCreds.email}</p>
            <p><strong>System Modules:</strong> {generatedCreds.permissions.map(p => p.replace('_', ' ')).join(', ') || 'Read-only Access'}</p>
          </div>
        </div>
      )}

      {/* Admins Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-650" />
        </div>
      ) : admins.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500 bg-white border border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-805">No sub-admins provisioned yet.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Click the button above to register an administrator and allot specific panel capabilities.
          </p>
        </div>
      ) : (
        <div className="premium-card overflow-hidden bg-white border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Allotted Modules</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-705">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{admin.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {admin.email}</span>
                        {admin.phone && <span className="flex items-center gap-1.5 text-2xs text-slate-450"><Phone className="h-3 w-3" /> {admin.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {admin.permissions.length === 0 ? (
                          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded-full font-bold">Read-Only</span>
                        ) : (
                          admin.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-750 px-2.5 py-0.5 rounded-full font-bold capitalize"
                            >
                              {perm.replace("_", " ")}
                            </span>
                          ))
                        )}
                        <button
                          onClick={() => {
                            setEditingAdmin(admin);
                            setEditPermissions(admin.permissions);
                          }}
                          className="text-[10px] text-indigo-650 hover:text-indigo-850 hover:underline font-extrabold ml-1.5 cursor-pointer"
                        >
                          Modify
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {admin.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-150 px-2.5 py-0.5 rounded-full">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Status Icon */}
                        <button
                          onClick={() => handleToggleStatus(admin._id, admin.status)}
                          className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                            admin.status === "active"
                              ? "border-emerald-100 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50"
                              : "border-amber-150 text-amber-600 bg-amber-50/20 hover:bg-amber-50"
                          }`}
                          title={admin.status === "active" ? "Suspend Account" : "Activate Account"}
                        >
                          {admin.status === "active" ? <ToggleRight className="h-4.5 w-4.5" /> : <ToggleLeft className="h-4.5 w-4.5" />}
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(admin._id, admin.name)}
                          className="p-2 rounded-xl border border-indigo-150 text-indigo-600 bg-indigo-50/20 hover:bg-indigo-50 transition-all active:scale-95 cursor-pointer"
                          title="Reset Password & Email Creds"
                        >
                          <Key className="h-4.5 w-4.5" />
                        </button>

                        {/* Delete Admin */}
                        <button
                          onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                          className="p-2 rounded-xl border border-red-100 text-red-650 bg-red-50/20 hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
                          title="Delete Admin"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SUB-ADMIN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5 text-indigo-650" />
                Provision Sub-Admin Account
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-750 uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="Dr. Rajesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-750 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="rajesh.kumar@hospital.org"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-755 uppercase mb-1.5">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-750 uppercase mb-2 block">Allot Administrative Features</label>
                  <div className="space-y-2.5">
                    {allPermissions.map((perm) => {
                      const checked = newAdmin.permissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => handlePermissionToggle(perm.key)}
                          className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-all ${
                            checked
                              ? "border-indigo-500 bg-indigo-50/20"
                              : "border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center h-5 mt-0.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="h-4 w-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800">{perm.label}</span>
                            <span className="block text-3xs text-slate-500 mt-0.5 leading-normal">{perm.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-605 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer active:scale-98"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-indigo-650" />
                Edit System Module Permissions
              </h2>
              <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold text-slate-650">
                Modify administrative capabilities for <strong>{editingAdmin.name}</strong> ({editingAdmin.email}).
              </p>
              
              <div className="space-y-2.5">
                {allPermissions.map((perm) => {
                  const checked = editPermissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handlePermissionToggle(perm.key, true)}
                      className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-all ${
                        checked
                          ? "border-indigo-500 bg-indigo-50/20"
                          : "border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      <div className="flex items-center h-5 mt-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="h-4 w-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">{perm.label}</span>
                        <span className="block text-3xs text-slate-500 mt-0.5 leading-normal">{perm.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-605 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePermissions}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer active:scale-98"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
