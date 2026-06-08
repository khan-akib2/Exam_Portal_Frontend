"use client";

import { useEffect, useState } from "react";
import { 
  Users, UserPlus, FileDown, Upload, X, Check, Mail, 
  Phone, Calendar, Shield, Trash2, Key, RefreshCw,
  Search, CheckSquare, Square, ChevronRight, ShieldAlert
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function StudentsManager() {
  const { showAlert, showConfirm } = useDialog();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Single User Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "", batch: "General" });
  
  // Bulk CSV Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);
  
  // Edit user state
  const [editingStudent, setEditingStudent] = useState(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkBatch, setBulkBatch] = useState("");
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelectToggle = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredStudents = (filteredIds) => {
    if (selectedStudentIds.length === filteredIds.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredIds);
    }
  };

  const handleBulkStatusChange = async (nextStatus) => {
    const actionName = nextStatus === "active" ? "activate" : "suspend";
    const confirmed = await showConfirm(
      `Are you sure you want to ${actionName} accounts for ${selectedStudentIds.length} selected students?`,
      `Bulk ${actionName === "active" ? "Activation" : "Suspension"}`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedStudentIds.map((id) =>
          fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: nextStatus }),
          })
        )
      );
      showAlert(`Successfully updated status to "${nextStatus}" for selected students.`, "Success");
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err) {
      showAlert(err.message, "Bulk Update Error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkChangeBatch = async (e) => {
    e.preventDefault();
    if (!bulkBatch.trim()) {
      showAlert("Please enter a target batch name.", "Warning");
      return;
    }

    const confirmed = await showConfirm(
      `Move ${selectedStudentIds.length} selected students to batch "${bulkBatch}"?`,
      "Bulk Change Batch"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedStudentIds.map((id) =>
          fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ batch: bulkBatch.trim() }),
          })
        )
      );
      showAlert(`Successfully moved selected students to batch "${bulkBatch}".`, "Success");
      setBulkBatch("");
      setSelectedStudentIds([]);
      setShowBulkPanel(false);
      fetchStudents();
    } catch (err) {
      showAlert(err.message, "Bulk Batch Update Error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteStudents = async () => {
    const confirmed = await showConfirm(
      `Are you sure you want to permanently delete accounts for all ${selectedStudentIds.length} selected students? This action is irreversible!`,
      "Bulk Delete Accounts"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedStudentIds.map((id) =>
          fetch(`/api/admin/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      showAlert(`Successfully deleted selected student accounts.`, "Success");
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err) {
      showAlert(err.message, "Bulk Delete Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchStudents();
    }, 0);
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStudent),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add student");

      showAlert(`Student account created! Welcome email triggered to ${newStudent.email}.`, "Success");
      setNewStudent({ name: "", email: "", phone: "", batch: "General" });
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      showAlert(err.message, "Enrollment Error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (id, name) => {
    const confirmed = await showConfirm(`Are you sure you want to reset the password for student "${name}"? They will receive an email with their new password.`, "Reset Password?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resetPassword: true }),
      });
      if (res.ok) {
        showAlert("Password reset successfully. Check student mailbox.", "Success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    const confirmed = await showConfirm(`Are you sure you want to permanently delete student "${name}"? This action cannot be undone.`, "Delete Student?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditStudentBatch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${editingStudent._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batch: editingStudent.batch }),
      });
      if (res.ok) {
        setEditingStudent(null);
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Parse CSV client-side for immediate preview
  const handleParseCsv = (content) => {
    setCsvContent(content);
    const rows = content.split("\n").map(r => r.trim()).filter(r => r.length > 0);
    
    // Format should be: Name,Email,Phone,Batch
    const parsed = [];
    for (let i = 0; i < rows.length; i++) {
      // Skip header row if it contains 'email'
      if (i === 0 && rows[i].toLowerCase().includes("email")) continue;

      const cols = rows[i].split(",").map(c => c.trim());
      if (cols.length >= 2) {
        parsed.push({
          name: cols[0],
          email: cols[1],
          phone: cols[2] || "",
          batch: cols[3] || "General",
        });
      }
    }
    setBulkPreview(parsed);
  };

  const handleBulkUpload = async () => {
    if (bulkPreview.length === 0) return;
    setLoading(true);
    setBulkResult(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ users: bulkPreview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk upload failed.");

      setBulkResult(data.summary);
      setBulkPreview([]);
      setCsvContent("");
      fetchStudents();
    } catch (err) {
      showAlert(err.message, "Import Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Students</h1>
          <p className="text-sm text-slate-500">Add individual student records or upload batches instantly via CSV.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Button */}
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setBulkResult(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Bulk CSV Upload</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2E76C0] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2E76C0]/10 hover:bg-[#1F548C] transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Bulk Results Alert */}
      {bulkResult && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-5 space-y-2">
          <h3 className="font-bold text-teal-800 flex items-center gap-2">
            <Check className="h-4 w-4 bg-[#2E76C0] text-white rounded-full p-0.5" />
            Bulk Import Completed!
          </h3>
          <p className="text-sm text-[#1F548C] leading-relaxed">
            CSV roster processed: <strong>{bulkResult.created}</strong> students enrolled. 
            {bulkResult.duplicates > 0 && ` (${bulkResult.duplicates} duplicates skipped).`}
            {bulkResult.errors > 0 && ` (${bulkResult.errors} formatting errors found).`}
          </p>
        </div>
      )}

      {/* Search & Filters Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-[#00E5FF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Batch Filter */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:border-[#00E5FF] outline-none"
          >
            <option value="">All Batches</option>
            {Array.from(new Set(students.map(s => s.batch))).filter(Boolean).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:border-[#00E5FF] outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          {(searchQuery || batchFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setBatchFilter("");
                setStatusFilter("");
              }}
              className="text-xs font-semibold text-red-650 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Drawer */}
      {selectedStudentIds.length > 0 && (
        <div className="premium-card p-4 border-l-4 border-[#2765A4] bg-teal-50/10 space-y-3 animate-slide-down">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Bulk Cohort Management</h4>
              <span className="text-3xs text-slate-500">Perform changes on {selectedStudentIds.length} selected student accounts.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange("active")}
                className="bg-[#10B981] text-white font-bold text-2xs px-3 py-1.5 rounded-lg hover:bg-[#059669] transition-colors"
              >
                Activate Accounts
              </button>
              <button
                onClick={() => handleBulkStatusChange("suspended")}
                className="bg-[#F59E0B] text-white font-bold text-2xs px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Suspend Accounts
              </button>
              <button
                onClick={handleBulkDeleteStudents}
                className="bg-red-650 text-white font-bold text-2xs px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Accounts
              </button>
              <button
                onClick={() => setShowBulkPanel(!showBulkPanel)}
                className="border border-slate-200 bg-white text-slate-700 font-bold text-2xs px-3 py-1.5 rounded-lg hover:bg-slate-50"
              >
                {showBulkPanel ? "Hide Batch Move" : "Move to Batch"}
              </button>
            </div>
          </div>

          {showBulkPanel && (
            <form onSubmit={handleBulkChangeBatch} className="flex items-end gap-3 max-w-sm animate-slide-down">
              <div className="flex-1">
                <label className="block text-4xs font-bold text-slate-500 uppercase mb-1">Target Batch Name</label>
                <input
                  type="text"
                  required
                  value={bulkBatch}
                  onChange={(e) => setBulkBatch(e.target.value)}
                  placeholder="e.g. NEET-2026-B"
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs bg-white"
                />
              </div>
              <button
                type="submit"
                className="bg-[#2765A4] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-teal-750"
              >
                Change Batch
              </button>
            </form>
          )}
        </div>
      )}

      {/* Table Section */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2E76C0]" />
        </div>
      ) : students.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-lg">No students registered yet.</p>
          <p className="text-sm mt-1">Enroll your class roster using manual creation or import a CSV file.</p>
        </div>
      ) : (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto w-full pb-2">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 w-12">
                    <button
                      type="button"
                      onClick={() => handleSelectAllFilteredStudents(
                        students.filter((student) => {
                          const matchesSearch = 
                            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.email.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesBatch = batchFilter === "" || student.batch === batchFilter;
                          const matchesStatus = statusFilter === "" || student.status === statusFilter;
                          return matchesSearch && matchesBatch && matchesStatus;
                        }).map(s => s._id)
                      )}
                      className="text-slate-450 hover:text-teal-655"
                    >
                      {selectedStudentIds.length === students.filter((student) => {
                        const matchesSearch = 
                          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesBatch = batchFilter === "" || student.batch === batchFilter;
                        const matchesStatus = statusFilter === "" || student.status === statusFilter;
                        return matchesSearch && matchesBatch && matchesStatus;
                      }).length && students.length > 0 ? (
                        <CheckSquare className="h-4.5 w-4.5 text-[#2E76C0]" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">XP Status</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700 font-medium">
                {students.filter((student) => {
                  const matchesSearch = 
                    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.email.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesBatch = batchFilter === "" || student.batch === batchFilter;
                  const matchesStatus = statusFilter === "" || student.status === statusFilter;
                  return matchesSearch && matchesBatch && matchesStatus;
                }).map((student) => {
                  const isRowSelected = selectedStudentIds.includes(student._id);
                  return (
                    <tr key={student._id} className={`hover:bg-slate-50/50 transition-colors ${isRowSelected ? "bg-teal-50/10" : ""}`}>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleStudentSelectToggle(student._id)}
                          className="text-slate-400 hover:text-[#2E76C0]"
                        >
                          {isRowSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-[#2E76C0]" />
                          ) : (
                            <Square className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col font-normal text-slate-600">
                          <span className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> {student.email}</span>
                          {student.phone && <span className="flex items-center gap-1 text-2xs text-slate-400 mt-0.5"><Phone className="h-2.5 w-2.5" /> {student.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {student.batch}
                        </span>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="text-xs text-[#2765A4] hover:text-teal-800 font-bold ml-2.5"
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{student.xp} XP</span>
                          <span className="text-2xs text-slate-400 font-normal">Level: {student.level} | Streak: {student.streak} days</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.status === "active" ? (
                          <span className="inline-flex items-center text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Status Suspension */}
                          <button
                            onClick={() => handleToggleStatus(student._id, student.status)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              student.status === "active"
                                ? "border-amber-100 text-amber-600 hover:bg-amber-50"
                                : "border-green-100 text-green-600 hover:bg-green-50"
                            }`}
                            title={student.status === "active" ? "Suspend Account" : "Activate Account"}
                          >
                            <Shield className="h-4 w-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(student._id, student.name)}
                            className="p-1.5 rounded-lg border border-teal-100 text-[#2E76C0] hover:bg-teal-50 transition-colors"
                            title="Reset Password & Email student"
                          >
                            <Key className="h-4 w-4" />
                          </button>

                          {/* Delete Student */}
                          <button
                            onClick={() => handleDeleteStudent(student._id, student.name)}
                            className="p-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#2E76C0]" />
                Enroll New Student
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20"
                    placeholder="Siddharth Roy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20"
                    placeholder="siddharth@medcollege.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20"
                    placeholder="+91 9998887770"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Batch / Class</label>
                  <input
                    type="text"
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20"
                    placeholder="NEET-2026-A"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2E76C0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F548C] shadow-md shadow-[#2E76C0]/10 transition-colors"
                >
                  Create & Email Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BATCH MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-md font-bold text-slate-900">Edit Student Batch</h2>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudentBatch}>
              <div className="p-6">
                <p className="text-sm text-slate-600 mb-4">
                  Update batch assignment for <strong>{editingStudent.name}</strong> ({editingStudent.email}).
                </p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Batch / Class</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.batch}
                    onChange={(e) => setEditingStudent({ ...editingStudent, batch: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2E76C0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F548C] shadow-md shadow-[#2E76C0]/10 transition-colors"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CSV IMPORT MODAL */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#2E76C0]" />
                Bulk CSV Roster Enrollment
              </h2>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">CSV Data Format (No Headers required)</label>
                <p className="text-2xs text-slate-500 mb-2">Input format: <code>Name, Email, Phone, Batch</code> (one record per line). Phone/Batch are optional.</p>
                <textarea
                  value={csvContent}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  rows="6"
                  className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs outline-none transition-all focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20"
                  placeholder="Aman Sharma, aman@university.com, 9876543210, Batch-A&#10;Priya Patel, priya@university.com,, Batch-B"
                />
              </div>

              {/* Parsed Preview Table */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preview Parsed Roster ({bulkPreview.length} students)</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Batch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {bulkPreview.slice(0, 10).map((p, index) => (
                          <tr key={index}>
                            <td className="p-2 font-medium text-slate-800">{p.name}</td>
                            <td className="p-2">{p.email}</td>
                            <td className="p-2">{p.phone || "-"}</td>
                            <td className="p-2">{p.batch}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bulkPreview.length > 10 && (
                      <p className="p-2 bg-slate-50 text-2xs text-slate-400 text-center font-medium border-t border-slate-100">
                        Showing top 10 rows. +{bulkPreview.length - 10} more rows parsed.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-500">
                {bulkPreview.length} valid rows parsed.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={bulkPreview.length === 0}
                  className="rounded-lg bg-[#2E76C0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1F548C] shadow-md shadow-[#2E76C0]/10 transition-colors disabled:opacity-50"
                >
                  Import & Trigger Welcome Mails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
