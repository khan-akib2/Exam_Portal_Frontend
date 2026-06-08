"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Clock, FileQuestion, AlertTriangle, 
  HelpCircle, ChevronRight, X, User
} from "lucide-react";

export default function MockExamsList() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  
  // Start Exam Confirmation Dialog
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handleStartExam = () => {
    if (!selectedExam) return;
    router.push(`/student/exam/${selectedExam._id}`);
  };

  // Extract unique instructors
  const instructors = [];
  const seen = new Set();
  exams.forEach((exam) => {
    if (exam.createdBy && exam.createdBy._id && !seen.has(exam.createdBy._id)) {
      seen.add(exam.createdBy._id);
      instructors.push(exam.createdBy);
    }
  });

  const filteredExams = selectedInstructor
    ? exams.filter((exam) => exam.createdBy?._id === selectedInstructor)
    : exams;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mock Assessments</h1>
          <p className="text-sm text-slate-500">Practice timed simulated papers designed for NEET PG, FMGE, and university courses.</p>
        </div>
        
        {exams.length > 0 && instructors.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <label htmlFor="instructor-filter" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
              Instructor:
            </label>
            <select
              id="instructor-filter"
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="rounded-lg border border-slate-205 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer"
            >
              <option value="">All Instructors</option>
              {instructors.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-650" />
        </div>
      ) : exams.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
          <ShieldCheck className="h-12 w-12 text-slate-350 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-805">No mock exams assigned yet.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Check back later for mock exams and quizzes uploaded by your course instructor.
          </p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl animate-fade-in">
          <ShieldCheck className="h-12 w-12 text-slate-330 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-800">No exams match the selected filter.</p>
          <button 
            onClick={() => setSelectedInstructor("")} 
            className="text-xs text-teal-650 font-bold hover:underline mt-2.5 block mx-auto cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <div key={exam._id} className="premium-card p-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="space-y-2.5">
                <span className="text-[9px] bg-teal-50 border border-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider block w-fit">
                  {exam.examType}
                </span>
                <h3 className="text-md font-bold text-slate-855 tracking-tight leading-snug">{exam.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{exam.description || "Fully simulated clinical MCQ test."}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-650">
                {exam.createdBy?.name && (
                  <div className="flex items-center gap-1.5 text-2xs text-slate-500 mb-1 font-semibold">
                    <User className="h-3.5 w-3.5" />
                    <span>Created by: <strong className="text-slate-800">Instructor {exam.createdBy.name}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Timer Duration: <strong>{exam.duration} minutes</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Total questions: <strong>{exam.totalQuestions} Questions</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-red-700">
                    Negative marks: <strong>{exam.negativeMarking === 0 ? "Disabled" : `-${Math.abs(exam.negativeMarking)} XP per wrong`}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedExam(exam)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-650 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-650/10 hover:bg-teal-700 transition-all cursor-pointer active:scale-98"
              >
                <span>Attempt Examination</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* START EXAM CONFIRMATION DIALOG */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-teal-650" />
                Start Simulative Exam
              </h2>
              <button onClick={() => setSelectedExam(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs font-extrabold text-slate-800">
                You are about to launch: <span className="text-teal-700">{selectedExam.name}</span>
              </p>

              <div className="rounded-xl bg-slate-50/70 border border-slate-200 p-4 space-y-2.5 text-xs text-slate-650 font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold uppercase tracking-wider text-[10px]">Questions Count:</span>
                  <span className="text-slate-850">{selectedExam.totalQuestions} Qs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold uppercase tracking-wider text-[10px]">Total Duration:</span>
                  <span className="text-slate-850">{selectedExam.duration} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold uppercase tracking-wider text-[10px]">Passing Threshold:</span>
                  <span className="text-slate-850">{selectedExam.passingMarks}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold uppercase tracking-wider text-[10px]">Negative Marking:</span>
                  <span className="text-red-650">{selectedExam.negativeMarking === 0 ? "Disabled" : `-${Math.abs(selectedExam.negativeMarking)} XP`}</span>
                </div>
              </div>

              {/* Anti Cheat warning box */}
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1.5 text-2xs text-red-800 flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="font-extrabold block">Proctored Anti-Cheat Engine is Active</span>
                  <span className="block leading-relaxed text-red-700 font-semibold">
                    Focus loss (switching tabs, closing windows), copy-paste triggers, and right-clicks are monitored. Security violations are audited in real time and logged to sub-admins. Too many warnings will result in auto-submission of the paper.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setSelectedExam(null)}
                className="rounded-lg border border-slate-205 px-4 py-2.5 text-xs font-semibold text-slate-605 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExam}
                className="rounded-lg bg-teal-650 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/10 transition-all cursor-pointer active:scale-98"
              >
                Launch Exam Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
