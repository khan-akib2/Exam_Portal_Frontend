"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShieldCheck, Clock, FileQuestion, AlertTriangle, 
  ChevronRight, X, User, Calendar, CheckCircle2, FileText
} from "lucide-react";

function MockExamsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams ? searchParams.get("tab") : null;
  const isCompletedTab = tab === "completed";

  // State for Mock Exams (Unattempted)
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);

  // State for Completed Attempts
  const [completedAttempts, setCompletedAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);

  // Fetch unattempted mock exams
  useEffect(() => {
    if (isCompletedTab) return;
    const fetchExams = async () => {
      setLoading(true);
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
  }, [isCompletedTab]);

  // Fetch completed exam attempts
  useEffect(() => {
    if (!isCompletedTab) return;
    const fetchAttempts = async () => {
      setAttemptsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/attempts/my-attempts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setCompletedAttempts(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAttemptsLoading(false);
      }
    };
    fetchAttempts();
  }, [isCompletedTab]);

  const handleStartExam = () => {
    if (!selectedExam) return;
    router.push(`/student/exam/${selectedExam._id}`);
  };

  // Instructors list for mock exams tab filter
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

  if (isCompletedTab) {
    return (
      <div className="space-y-6 animate-fade-in text-left">
        <div className="border-b border-slate-100 dark:border-white/5 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Completed Assessments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review your past simulative attempts, accuracy scores, and detailed performance reports.</p>
        </div>

        {attemptsLoading ? (
          <div className="flex h-48 items-center justify-center bg-slate-50 dark:bg-transparent">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#1157CF] dark:border-t-[#5B93EE]" />
          </div>
        ) : completedAttempts.length === 0 ? (
          <div className="premium-card p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-2xl">
            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
            <p className="font-bold text-lg text-slate-800 dark:text-white">No completed exams found.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Once you attempt and submit an examination, it will show up here along with your performance history.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedAttempts.map((attempt) => {
              const examName = attempt.exam?.name || "Exam Attempt";
              const type = attempt.exam?.examType || "Assessment";
              const accuracy = attempt.accuracy || 0;
              const dateString = new Date(attempt.submittedAt).toLocaleDateString([], {
                year: 'numeric', month: 'short', day: 'numeric'
              });

              return (
                <div key={attempt._id} className="premium-card p-6 flex flex-col justify-between bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xs space-y-4 hover:shadow-lg transition-all duration-300">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider block w-fit">
                        {type}
                      </span>
                      <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md ${
                        attempt.passed 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' 
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border border-rose-200 dark:border-rose-900/30'
                      }`}>
                        {attempt.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <h3 className="text-md font-bold text-slate-800 dark:text-white tracking-tight leading-snug">{examName}</h3>
                    <div className="flex items-center gap-1.5 text-2xs text-slate-400 dark:text-slate-500 font-bold">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Completed on {dateString}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 font-bold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Score Achieved:</span>
                      <span className="text-slate-800 dark:text-slate-300">{attempt.score} / {attempt.totalQuestions} Marks</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Accuracy Rate:</span>
                      <span className={`flex items-center gap-1 ${accuracy >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> {accuracy}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">Correct vs Wrong:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        <strong className="text-emerald-600">{attempt.correctAnswers}</strong> C / <strong className="text-rose-600">{attempt.wrongAnswers}</strong> W
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/student/results/${attempt._id}`)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1157CF] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#0D46A8] transition-all cursor-pointer active:scale-98"
                  >
                    <span>View Performance Report</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Else: Default Mock Exams listing
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Mock Assessments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Practice timed simulated papers designed for NEET PG, FMGE, and university courses.</p>
        </div>
        
        {exams.length > 0 && instructors.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <label htmlFor="instructor-filter" className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Instructor:
            </label>
            <select
              id="instructor-filter"
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-[var(--card)] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#1157CF] focus:ring-1 focus:ring-[#1157CF] transition-all cursor-pointer"
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
        <div className="flex h-48 items-center justify-center bg-slate-50 dark:bg-transparent">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#1157CF] dark:border-t-[#5B93EE]" />
        </div>
      ) : exams.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-2xl">
          <ShieldCheck className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-800 dark:text-white">No mock exams assigned yet.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Check back later for mock exams and quizzes uploaded by your course instructor.
          </p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-2xl animate-fade-in">
          <ShieldCheck className="h-12 w-12 text-slate-300 dark:text-slate-550 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-800 dark:text-white">No exams match the selected filter.</p>
          <button 
            onClick={() => setSelectedInstructor("")} 
            className="text-xs text-[#1157CF] dark:text-[#5B93EE] font-bold hover:underline mt-2.5 block mx-auto cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <div key={exam._id} className="premium-card p-6 flex flex-col justify-between bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-2xl shadow-xs space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="space-y-2.5">
                <span className="text-[9px] bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[#1157CF] dark:text-[#5B93EE] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider block w-fit">
                  {exam.examType}
                </span>
                <h3 className="text-md font-bold text-slate-800 dark:text-white tracking-tight leading-snug">{exam.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{exam.description || "Fully simulated clinical MCQ test."}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 font-bold">
                {exam.createdBy?.name && (
                  <div className="flex items-center gap-1.5 text-2xs text-slate-500 dark:text-slate-400 mb-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Created by: <strong className="text-slate-800 dark:text-slate-300">Instructor {exam.createdBy.name}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Timer Duration: <strong className="text-slate-800 dark:text-slate-300">{exam.duration} minutes</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Total questions: <strong className="text-slate-800 dark:text-slate-300">{exam.totalQuestions} Questions</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-red-605 dark:text-red-400">
                    Negative marks: <strong>{exam.negativeMarking === 0 ? "Disabled" : `-${Math.abs(exam.negativeMarking)} XP per wrong`}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedExam(exam)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1157CF] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#0D46A8] transition-all cursor-pointer active:scale-98"
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
          <div className="w-full max-w-md bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-slide-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-[#1157CF]" />
                Start Simulative Exam
              </h2>
              <button onClick={() => setSelectedExam(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                You are about to launch: <span className="text-[#1157CF] dark:text-[#5B93EE]">{selectedExam.name}</span>
              </p>

              <div className="rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Questions Count:</span>
                  <span className="text-slate-800 dark:text-white">{selectedExam.totalQuestions} Qs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Total Duration:</span>
                  <span className="text-slate-800 dark:text-white">{selectedExam.duration} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Passing Threshold:</span>
                  <span className="text-slate-800 dark:text-white">{selectedExam.passingMarks}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Negative Marking:</span>
                  <span className="text-red-600 dark:text-red-400">{selectedExam.negativeMarking === 0 ? "Disabled" : `-${Math.abs(selectedExam.negativeMarking)} XP`}</span>
                </div>
              </div>

              {/* Anti Cheat warning box */}
              <div className="rounded-xl bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/20 p-4 space-y-1.5 text-2xs text-red-850 dark:text-red-400 flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="font-extrabold block text-red-900 dark:text-red-350">Proctored Anti-Cheat Engine is Active</span>
                  <span className="block leading-relaxed text-red-700 dark:text-red-400 font-semibold">
                    Focus loss (switching tabs, closing windows), copy-paste triggers, and right-clicks are monitored. Security violations are audited in real time and logged to sub-admins. Too many warnings will result in auto-submission of the paper.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-white/5">
              <button
                onClick={() => setSelectedExam(null)}
                className="rounded-lg border border-slate-200 dark:border-white/5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExam}
                className="rounded-lg bg-[#1157CF] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0D46A8] shadow-md shadow-blue-500/10 transition-all cursor-pointer active:scale-98"
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

export default function MockExamsList() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center bg-slate-50 dark:bg-transparent"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#1157CF] dark:border-t-[#5B93EE]" /></div>}>
      <MockExamsContent />
    </Suspense>
  );
}
