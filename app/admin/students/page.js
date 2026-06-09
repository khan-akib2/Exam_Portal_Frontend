"use client";

import { useEffect, useState } from "react";
import { 
  Users, UserPlus, Upload, X, Check, Mail, 
  Phone, Calendar, Shield, Trash2, Key, RefreshCw,
  Search, CheckSquare, Square, MoreHorizontal, Download, Filter
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import { motion } from "framer-motion";

export default function StudentsManager() {
  const { showAlert, showConfirm } = useDialog();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "", batch: "General" });
  
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);
  
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

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleStudentSelectToggle = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = batchFilter === "" || student.batch === batchFilter;
    const matchesStatus = statusFilter === "" || student.status === statusFilter;
    return matchesSearch && matchesBatch && matchesStatus;
  });

  const handleSelectAllFilteredStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s._id));
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

  const handleDeleteStudent = async (id, name) => {
    const confirmed = await showConfirm(`Are you sure you want to permanently delete student "${name}"?`, "Delete Student?");
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

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const uniqueBatches = Array.from(new Set(students.map(s => s.batch))).filter(Boolean);
  const activeCount = students.filter(s => s.status === 'active').length;

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage enrollments, statuses, and student credentials.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setBulkResult(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4 text-slate-500" /> Bulk Import
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1157CF] text-white text-xs font-bold rounded-lg hover:bg-[#0D46A8] transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Top Statistics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="premium-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Enrolled</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{students.length}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-slate-500" />
          </div>
        </div>
        <div className="premium-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Accounts</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{activeCount}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#DCFAED] flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#0F7B3E]" />
          </div>
        </div>
        <div className="premium-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Batches</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{uniqueBatches.length}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#EEF4FF] flex items-center justify-center">
            <Calendar className="h-5 w-5 text-[#1157CF]" />
          </div>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="premium-card bg-white flex flex-col overflow-hidden shadow-sm">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-[#1157CF] focus:ring-1 focus:ring-[#1157CF] transition-shadow"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:border-[#1157CF] appearance-none"
              >
                <option value="">All Batches</option>
                {uniqueBatches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 md:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:border-[#1157CF] appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-[#1157CF]/5 border-b border-[#1157CF]/10 px-4 py-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1157CF] bg-[#1157CF]/10 px-2 py-0.5 rounded">
                {selectedStudentIds.length} Selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleBulkStatusChange("active")} className="text-[10px] font-bold text-[#0F7B3E] bg-white border border-[#0F7B3E]/20 hover:bg-[#DCFAED] px-3 py-1.5 rounded transition-colors shadow-sm">
                Activate
              </button>
              <button onClick={() => handleBulkStatusChange("suspended")} className="text-[10px] font-bold text-[#B45309] bg-white border border-[#B45309]/20 hover:bg-[#FEF3CD] px-3 py-1.5 rounded transition-colors shadow-sm">
                Suspend
              </button>
              <button onClick={handleBulkDeleteStudents} className="text-[10px] font-bold text-[#C0152A] bg-white border border-[#C0152A]/20 hover:bg-[#FDEAEC] px-3 py-1.5 rounded transition-colors shadow-sm">
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 w-12 text-center">
                  <button onClick={handleSelectAllFilteredStudents} className="text-slate-400 hover:text-[#1157CF] flex items-center justify-center w-full">
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="h-4.5 w-4.5 text-[#1157CF]" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Student Profile</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Batch</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm font-medium text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#1157CF]" />
                    Loading grid...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm font-medium text-slate-500">
                    No students found matching filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student._id);
                  return (
                    <tr key={student._id} className={`hover:bg-slate-50 transition-colors ${isSelected ? "bg-[#1157CF]/5" : ""}`}>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleStudentSelectToggle(student._id)} className="text-slate-400 hover:text-[#1157CF] flex items-center justify-center w-full">
                          {isSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-[#1157CF]" />
                          ) : (
                            <Square className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{student.name}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          {student.batch}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {student.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#0F7B3E] bg-[#DCFAED] uppercase tracking-wider border border-[#0F7B3E]/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0F7B3E]" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-slate-100 uppercase tracking-wider border border-slate-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                          <button onClick={() => handleToggleStatus(student._id, student.status)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors" title="Toggle Status">
                            <Shield className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteStudent(student._id, student.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-[#1157CF] hover:bg-[#EEF4FF] rounded transition-colors" title="More Options">
                            <MoreHorizontal className="h-4 w-4" />
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50/50">
          <div>Showing {filteredStudents.length} results</div>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Prev</button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Enroll Student</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input type="text" required value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1157CF] focus:ring-1 focus:ring-[#1157CF]" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input type="email" required value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1157CF] focus:ring-1 focus:ring-[#1157CF]" placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone (Optional)</label>
                    <input type="text" value={newStudent.phone} onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1157CF] focus:ring-1 focus:ring-[#1157CF]" placeholder="+1 555 1234" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Batch</label>
                    <input type="text" value={newStudent.batch} onChange={(e) => setNewStudent({...newStudent, batch: e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1157CF] focus:ring-1 focus:ring-[#1157CF]" placeholder="Fall 2026" />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-[#1157CF] text-white text-xs font-bold rounded hover:bg-[#0D46A8] transition-colors shadow-sm disabled:opacity-50">
                  {loading ? "Creating..." : "Create & Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Bulk Import CSV</h2>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 text-center">
               <div className="w-16 h-16 rounded-full bg-[#1157CF]/10 text-[#1157CF] mx-auto flex items-center justify-center mb-4">
                 <Download className="h-6 w-6" />
               </div>
               <h3 className="text-sm font-bold text-slate-900 mb-1">Upload CSV Document</h3>
               <p className="text-xs text-slate-500 mb-4">Format: Name, Email, Phone, Batch</p>
               
               <button className="px-4 py-2 border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs rounded hover:bg-slate-100 transition-colors">
                 Select File from Computer
               </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
