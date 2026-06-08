"use client";

import { useEffect, useState } from "react";
import { 
  FileText, Plus, X, Check, Copy, Trash2, Calendar, 
  HelpCircle, Settings, ToggleLeft, ToggleRight, Sparkles,
  ChevronRight, ChevronLeft, Award, Clock, FileQuestion, AlertTriangle
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function ExamsManager() {
  const { showAlert, showConfirm } = useDialog();
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newExam, setNewExam] = useState({
    name: "",
    description: "",
    duration: 60,
    passingMarks: 50,
    negativeMarking: 0,
    examType: "Practice",
    assignedBatches: ["General"],
    autoSelect: true,
    autoSelectCount: 10,
    subjectFilter: "",
    difficultyFilter: "",
    questions: [],
  });

  const [subjectsList, setSubjectsList] = useState([]);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const qList = data.questions || [];
        setQuestions(qList);
        // Extract unique subjects
        const subjects = [...new Set(qList.map((q) => q.subject))].filter(Boolean);
        setSubjectsList(subjects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      await fetchExams();
      await fetchQuestions();
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleWizardNext = () => {
    if (wizardStep === 1) {
      if (!newExam.name.trim()) {
        showAlert("Please enter an Exam Title.", "Validation Error");
        return;
      }
    } else if (wizardStep === 2) {
      if (!newExam.duration || newExam.duration <= 0) {
        showAlert("Please enter a valid duration (in minutes).", "Validation Error");
        return;
      }
      if (!newExam.passingMarks || newExam.passingMarks <= 0 || newExam.passingMarks > 100) {
        showAlert("Please enter a valid passing percentage (1-100).", "Validation Error");
        return;
      }
    } else if (wizardStep === 3) {
      if (!newExam.assignedBatches || newExam.assignedBatches.filter(Boolean).length === 0) {
        showAlert("Please assign at least one batch.", "Validation Error");
        return;
      }
    } else if (wizardStep === 4) {
      if (newExam.autoSelect) {
        if (!newExam.autoSelectCount || newExam.autoSelectCount <= 0) {
          showAlert("Please specify a valid question count for auto-select.", "Validation Error");
          return;
        }
      } else {
        if (newExam.questions.length === 0) {
          showAlert("Please select at least one question from the pool.", "Validation Error");
          return;
        }
      }
    }
    setWizardStep((prev) => prev + 1);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newExam),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to build exam");

      showAlert("Exam created successfully in draft mode.", "Success");
      setNewExam({
        name: "",
        description: "",
        duration: 60,
        passingMarks: 50,
        negativeMarking: 0,
        examType: "Practice",
        assignedBatches: ["General"],
        autoSelect: true,
        autoSelectCount: 10,
        subjectFilter: "",
        difficultyFilter: "",
        questions: [],
      });
      setModalOpen(false);
      setWizardStep(1);
      fetchExams();
    } catch (err) {
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateExam = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duplicate: true }),
      });
      if (res.ok) {
        showAlert("Exam duplicated as a new draft.", "Success");
        fetchExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExam = async (id, name) => {
    const confirmed = await showConfirm(`Are you sure you want to permanently delete exam "${name}"?`, "Delete Exam?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuestionSelect = (qId) => {
    setNewExam((prev) => ({
      ...prev,
      questions: prev.questions.includes(qId)
        ? prev.questions.filter((id) => id !== qId)
        : [...prev.questions, qId],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Exam Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Configure simulated tests, assign cohorts, allot negative marking rules, and deploy assessments.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2E76C0] px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-[#2E76C0]/20 hover:bg-[#2765A4] transition-all active:scale-95 shrink-0 self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Build Assessment</span>
        </button>
      </div>

      {/* Exams List Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center bg-[#FAFAFB]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2E76C0]" />
        </div>
      ) : exams.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500 bg-white border border-slate-200">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-800">No examinations created yet.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Click the build button to configure your first simulated exam paper or auto-generate one from the MCQ pool.
          </p>
        </div>
      ) : (
        <div className="premium-card overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto w-full pb-2">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAFB] border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Exam Details</th>
                  <th className="px-6 py-4">Timer & Regulations</th>
                  <th className="px-6 py-4">Question Count</th>
                  <th className="px-6 py-4">Cohorts</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 bg-white">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-slate-900 text-[13px]">{exam.name}</span>
                        <span className="text-[11px] text-slate-500 max-w-xs truncate leading-normal">{exam.description || "No description provided."}</span>
                        <span className="text-[9px] bg-[#E6EEF7] border border-[#C7DBEE] text-[#2765A4] px-2 py-0.5 rounded-md self-start font-bold uppercase tracking-wider mt-1">
                          {exam.examType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 text-slate-600">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> <strong>{exam.duration} mins</strong></span>
                        <span className="text-[11px]">Pass Rate: <strong>{exam.passingMarks}%</strong></span>
                        <span className="text-[11px] text-red-600 font-semibold">Penalties: <strong>{exam.negativeMarking || 0} per wrong</strong></span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-[13px]">
                      <span className="flex items-center gap-1.5"><FileQuestion className="h-4 w-4 text-[#2E76C0]" /> {exam.totalQuestions} Qs</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {exam.assignedBatches.map((b) => (
                          <span key={b} className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {exam.status === "published" ? (
                        <span className="inline-flex items-center text-[10px] font-extrabold uppercase bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2.5 py-1 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Publish / Unpublish Toggle */}
                        <button
                          onClick={() => handleToggleStatus(exam._id, exam.status)}
                          className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                            exam.status === "published"
                              ? "border-[#10B981]/20 text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20"
                              : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                          }`}
                          title={exam.status === "published" ? "Unpublish to Draft" : "Publish to Students"}
                        >
                          {exam.status === "published" ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicateExam(exam._id)}
                          className="p-2 rounded-xl border border-[#2E76C0]/20 text-[#2E76C0] bg-[#2E76C0]/10 hover:bg-[#2E76C0]/20 transition-all active:scale-95 cursor-pointer"
                          title="Duplicate Exam Draft"
                        >
                          <Copy className="h-4.5 w-4.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteExam(exam._id, exam.name)}
                          className="p-2 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95 cursor-pointer"
                          title="Delete Exam"
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

      {/* CREATE EXAM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-slide-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-250 bg-slate-50">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-teal-600" />
                Build Examination Paper
              </h2>
              <button 
                onClick={() => {
                  setModalOpen(false);
                  setWizardStep(1);
                }} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Wizard step breadcrumbs indicator */}
            <div className="bg-[#FAFAFB] border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-1 overflow-x-auto">
              {[
                { step: 1, label: "Info" },
                { step: 2, label: "Rules" },
                { step: 3, label: "Audience" },
                { step: 4, label: "MCQs" },
                { step: 5, label: "Deploy" }
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] border transition-all ${
                    wizardStep === s.step 
                      ? "bg-[#2E76C0] border-[#2E76C0] text-white shadow-md shadow-[#2E76C0]/20" 
                      : wizardStep > s.step 
                      ? "bg-[#E6EEF7] border-[#C7DBEE] text-[#2E76C0]" 
                      : "bg-white border-slate-200 text-slate-400"
                  }`}>
                    {wizardStep > s.step ? "✓" : s.step}
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    wizardStep === s.step ? "text-[#2E76C0]" : "text-slate-500"
                  }`}>
                    {s.label}
                  </span>
                  {s.step < 5 && <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />}
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateExam}>
              <div className="p-6 max-h-[55vh] overflow-y-auto">
                {/* STEP 1: BASIC INFO */}
                {wizardStep === 1 && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">1. Basic Assessment Details</h3>
                      <p className="text-2xs text-slate-550">Provide the public title, curriculum description, and paper type.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Exam Title</label>
                        <input
                          type="text"
                          required
                          value={newExam.name}
                          onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          placeholder="NEET PG 2026 - Cardiology Mock Test 1"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Description & Guidelines</label>
                        <textarea
                          value={newExam.description}
                          onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          rows="3"
                          placeholder="Covers anterior wall infarctions, thyroid malignancies, and clinical ECG diagnostics."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Exam Type</label>
                        <select
                          value={newExam.examType}
                          onChange={(e) => setNewExam({ ...newExam, examType: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none bg-white transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        >
                          <option value="Practice">Practice Sheet</option>
                          <option value="Mock Test">Mock Test Paper</option>
                          <option value="Daily Challenge">Daily Challenge</option>
                          <option value="Semester Exam">Semester Exam</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: REGULATIONS */}
                {wizardStep === 2 && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">2. Grading Rules & Timers</h3>
                      <p className="text-2xs text-slate-555">Configure time allocation thresholds and negative marks scoring constraints.</p>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-650 uppercase mb-1.5">Duration (Minutes)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={newExam.duration}
                          onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) || "" })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-655 uppercase mb-1.5">Passing Threshold (%)</label>
                        <input
                          type="number"
                          required
                          min="1; "
                          max="100"
                          value={newExam.passingMarks}
                          onChange={(e) => setNewExam({ ...newExam, passingMarks: parseInt(e.target.value) || "" })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-660 uppercase mb-1.5 font-semibold text-red-650">Negative Marks Penalty</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="10"
                          value={newExam.negativeMarking}
                          onChange={(e) => setNewExam({ ...newExam, negativeMarking: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          placeholder="e.g. 0.25"
                        />
                        <span className="text-[9px] text-red-500 font-bold block mt-1">XP deducted per incorrect choice.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: AUDIENCE */}
                {wizardStep === 3 && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">3. Cohort Assignment</h3>
                      <p className="text-2xs text-slate-555">Allot access rules. Select which student divisions will see this exam.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Assigned Batches (Comma Separated)</label>
                      <input
                        type="text"
                        required
                        value={newExam.assignedBatches.join(", ")}
                        onChange={(e) => setNewExam({ ...newExam, assignedBatches: e.target.value.split(",").map(s => s.trim()) })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                        placeholder="General, NEET-2026-A, FMGE-Interns"
                      />
                      <span className="text-[10px] text-slate-450 block mt-1.5">Only accounts belonging to matching cohorts will be eligible to attempt.</span>
                    </div>
                  </div>
                )}

                {/* STEP 4: QUESTIONS SELECTION */}
                {wizardStep === 4 && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">4. Question Sourcing</h3>
                      <p className="text-2xs text-slate-555">Add MCQs dynamically using criteria queries or perform manual checkout selection.</p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div>
                        <span className="block text-xs font-bold text-slate-800 uppercase">Auto-Select Random Questions</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">Generate papers by query filtering subject and difficulty categories.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewExam({ ...newExam, autoSelect: !newExam.autoSelect })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          newExam.autoSelect ? "bg-teal-650" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            newExam.autoSelect ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {newExam.autoSelect ? (
                      <div className="grid gap-3 sm:grid-cols-3 bg-slate-50/50 border border-slate-200 rounded-xl p-4 animate-slide-down">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={newExam.autoSelectCount}
                            onChange={(e) => setNewExam({ ...newExam, autoSelectCount: parseInt(e.target.value) || "" })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Subject</label>
                          <select
                            value={newExam.subjectFilter}
                            onChange={(e) => setNewExam({ ...newExam, subjectFilter: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="">All Subjects</option>
                            {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Difficulty</label>
                          <select
                            value={newExam.difficultyFilter}
                            onChange={(e) => setNewExam({ ...newExam, difficultyFilter: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                          >
                            <option value="">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      // Manual Questions selector
                      <div className="space-y-2 animate-slide-down">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Select Questions Manually ({newExam.questions.length} selected)</label>
                        <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                          {questions.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">No questions available in pool. Please upload booklets.</div>
                          ) : (
                            questions.map((q) => {
                              const isSelected = newExam.questions.includes(q._id);
                              return (
                                <div
                                  key={q._id}
                                  onClick={() => handleQuestionSelect(q._id)}
                                  className={`flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                                    isSelected ? "bg-teal-50/20" : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="h-4 w-4 rounded border-slate-350 text-teal-600 focus:ring-teal-500 mt-0.5"
                                  />
                                  <div>
                                    <span className="block text-xs font-semibold text-slate-800 leading-snug">{q.question}</span>
                                    <span className="inline-flex items-center gap-1.5 text-3xs text-slate-500 mt-1 font-semibold">
                                      Subject: <strong className="text-slate-800">{q.subject}</strong> | Difficulty: <strong className="text-slate-850">{q.difficulty}</strong>
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 5: REVIEW & DEPLOY */}
                {wizardStep === 5 && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">5. Deploy Parameters Audit</h3>
                      <p className="text-2xs text-slate-555">Review your variables before releasing the paper draft.</p>
                    </div>

                    <div className="premium-card p-5 bg-slate-50/60 border border-slate-200 rounded-xl grid gap-4 sm:grid-cols-2 text-xs text-slate-750">
                      <div>
                        <strong className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Exam Title</strong>
                        <span className="text-slate-900 font-extrabold text-sm">{newExam.name}</span>
                      </div>
                      <div>
                        <strong className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Classification Type</strong>
                        <span className="text-slate-900 font-bold">{newExam.examType}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <strong className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Description</strong>
                        <span className="text-slate-650 leading-relaxed block">{newExam.description || "None provided."}</span>
                      </div>
                      <div>
                        <strong className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Time Limit</strong>
                        <span className="text-slate-900 font-semibold">{newExam.duration} Minutes</span>
                      </div>
                      <div>
                        <strong className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Regulations</strong>
                        <span className="text-slate-900 font-semibold">Pass: {newExam.passingMarks}% | Penalties: {newExam.negativeMarking} XP</span>
                      </div>
                      <div>
                        <strong className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Cohort Target</strong>
                        <span className="text-slate-900 font-semibold">{newExam.assignedBatches.join(", ")}</span>
                      </div>
                      <div>
                        <strong className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Question Sourcing</strong>
                        {newExam.autoSelect ? (
                          <span className="text-slate-900 font-semibold">
                            Auto-selected: <strong>{newExam.autoSelectCount} questions</strong> from {newExam.subjectFilter || "All"} ({newExam.difficultyFilter || "All"})
                          </span>
                        ) : (
                          <span className="text-slate-900 font-semibold">
                            Manually selected: <strong>{newExam.questions.length} questions</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Nav Controls Footer */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#FAFAFB] border-t border-slate-200 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setWizardStep(1);
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                
                <div className="flex items-center gap-3">
                  {wizardStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep((prev) => prev - 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                  )}

                  {wizardStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleWizardNext}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-[13px] font-bold text-[#0F172A] hover:bg-[#00B8CC] shadow-md shadow-[#00E5FF]/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2E76C0] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#2765A4] shadow-md shadow-[#2E76C0]/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Deploy Assessment</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
