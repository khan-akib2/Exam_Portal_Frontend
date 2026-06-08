"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Clock, ChevronRight, ChevronLeft, 
  Bookmark, Check, AlertTriangle, AlertCircle, Maximize2, ZoomIn, X, RefreshCw
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export const dynamic = "force-dynamic";

export default function ExamPortalPage({ params }) {
  const { showAlert } = useDialog();
  // Resolve params
  const { id: examId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState("");
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);

  // Anti-Cheat State
  const [warnings, setWarnings] = useState(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningDetails, setWarningDetails] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom Image State
  const [zoomedImage, setZoomedImage] = useState(null);

  // Submit Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const containerRef = useRef(null);

  // Load Exam and start session
  useEffect(() => {
    const startSession = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/attempts/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ examId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start exam.");

        setAttemptId(data.attemptId);
        setExam(data.exam);
        setQuestions(data.questions || []);
        setAnswers(data.answers || []);
        setWarnings(data.warnings || 0);

        // Calculate time left from starting time and duration
        const durationSeconds = data.exam.duration * 60;
        const elapsedSeconds = Math.round((new Date().getTime() - new Date(data.startedAt).getTime()) / 1000);
        const remaining = Math.max(durationSeconds - elapsedSeconds, 0);
        
        setTimeLeft(remaining);
        setTimerActive(remaining > 0);
      } catch (err) {
        showAlert(err.message, "Exam Session Error");
        router.push("/student/exams");
      } finally {
        setLoading(false);
      }
    };
    startSession();
  }, [examId, router]);
  const triggerSecurityViolation = useCallback(async (type, details) => {
    // 1. Increment local warnings count
    setWarnings((w) => {
      const nextWarnings = w + 1;
      setWarningDetails(details);
      setWarningModalOpen(true);
      return nextWarnings;
    });

    // 2. Save violation in database attempt log
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          warning: { type, details },
        }),
      });
    } catch (err) {
      console.error("Failed to log warning in DB:", err);
    }
  }, [attemptId]);

  const handleSubmitExam = useCallback(async () => {
    setSubmitting(true);
    setTimerActive(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit exam.");

      // Close fullscreen mode if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      router.push(`/student/results/${data.resultId}`);
    } catch (err) {
      showAlert("Submission Error: " + err.message, "Error");
      setSubmitting(false);
    }
  }, [attemptId, router, showAlert]);

  const handleAutoSubmit = useCallback(() => {
    showAlert("Time has run out! Your exam is being submitted automatically.", "Time Out");
    handleSubmitExam();
  }, [showAlert, handleSubmitExam]);

  // Countdown timer effect
  useEffect(() => {
    let timer = null;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimerActive(false);
            handleAutoSubmit(); // Timeout submission!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, handleAutoSubmit]);

  // Anti-Cheat: Detect Focus Loss / Tab Switching
  useEffect(() => {
    if (!attemptId || loading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerSecurityViolation("tab_switch", "Tab switch or browser minimization detected.");
      }
    };

    const handleWindowBlur = () => {
      triggerSecurityViolation("tab_switch", "Browser window focus lost.");
    };

    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        triggerSecurityViolation("fullscreen_exit", "Exited fullscreen mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [attemptId, loading, triggerSecurityViolation]);

  // Keyboard Event Listener relocated below to satisfy variable declaration hoisting rules

  const requestFullscreenMode = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    }
  };

  // Auto-Save Answer selection state
  const handleSaveAnswerState = useCallback(async (qId, selectedOpt, marked, isVisit = false) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId: qId,
          selectedOption: selectedOpt,
          isMarkedForReview: marked,
          visited: isVisit,
        }),
      });
    } catch (err) {
      console.error("Failed to save answer state:", err);
    }
  }, [attemptId]);

  // UI Selection changes
  const handleSelectOption = useCallback((oIdx) => {
    const qId = questions[currentIndex]._id;
    
    // Update local state
    const updated = [...answers];
    const ansIdx = updated.findIndex((a) => a.question.toString() === qId.toString());
    
    if (ansIdx > -1) {
      updated[ansIdx].selectedOption = oIdx;
      setAnswers(updated);
      
      // Save in background
      handleSaveAnswerState(qId, oIdx, updated[ansIdx].isMarkedForReview, true);
    }
  }, [currentIndex, questions, answers, handleSaveAnswerState]);

  const handleClearResponse = useCallback(() => {
    const qId = questions[currentIndex]._id;
    const updated = [...answers];
    const ansIdx = updated.findIndex((a) => a.question.toString() === qId.toString());

    if (ansIdx > -1) {
      updated[ansIdx].selectedOption = null;
      setAnswers(updated);
      handleSaveAnswerState(qId, null, updated[ansIdx].isMarkedForReview, true);
    }
  }, [currentIndex, questions, answers, handleSaveAnswerState]);

  const handleToggleMarkForReview = useCallback(() => {
    const qId = questions[currentIndex]._id;
    const updated = [...answers];
    const ansIdx = updated.findIndex((a) => a.question.toString() === qId.toString());

    if (ansIdx > -1) {
      const nextMarked = !updated[ansIdx].isMarkedForReview;
      updated[ansIdx].isMarkedForReview = nextMarked;
      setAnswers(updated);
      handleSaveAnswerState(qId, updated[ansIdx].selectedOption, nextMarked, true);
    }
  }, [currentIndex, questions, answers, handleSaveAnswerState]);

  const handleNavigate = useCallback((idx) => {
    if (idx < 0 || idx >= questions.length) return;
    
    const qId = questions[idx]._id;
    
    // Mark next question as visited locally and in DB
    const updated = [...answers];
    const ansIdx = updated.findIndex((a) => a.question.toString() === qId.toString());
    if (ansIdx > -1 && !updated[ansIdx].visited) {
      updated[ansIdx].visited = true;
      setAnswers(updated);
      handleSaveAnswerState(qId, updated[ansIdx].selectedOption, updated[ansIdx].isMarkedForReview, true);
    }

    setCurrentIndex(idx);
  }, [questions, answers, handleSaveAnswerState]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  }, [currentIndex, questions.length, handleNavigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      handleNavigate(currentIndex - 1);
    }
  }, [currentIndex, handleNavigate]);

  // Keyboard Event Listener for student exam taking console
  useEffect(() => {
    if (loading || !exam || questions.length === 0) return;

    const handleKeyDown = (e) => {
      // Disable shortcuts if any modal is open
      if (warningModalOpen || submitModalOpen || zoomedImage) return;

      switch (e.code) {
        case "ArrowLeft":
        case "KeyP":
          e.preventDefault();
          handlePrev();
          break;
        case "ArrowRight":
        case "KeyN":
          e.preventDefault();
          handleNext();
          break;
        case "Digit1":
        case "Numpad1":
          e.preventDefault();
          handleSelectOption(0);
          break;
        case "Digit2":
        case "Numpad2":
          e.preventDefault();
          handleSelectOption(1);
          break;
        case "Digit3":
        case "Numpad3":
          e.preventDefault();
          handleSelectOption(2);
          break;
        case "Digit4":
        case "Numpad4":
          e.preventDefault();
          handleSelectOption(3);
          break;
        case "KeyC":
        case "Backspace":
          e.preventDefault();
          handleClearResponse();
          break;
        case "KeyM":
        case "KeyR":
          e.preventDefault();
          handleToggleMarkForReview();
          break;
        case "Enter":
        case "KeyS":
          e.preventDefault();
          setSubmitModalOpen(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    loading, exam, questions, currentIndex, answers, warningModalOpen, 
    submitModalOpen, zoomedImage, handlePrev, handleNext, 
    handleSelectOption, handleClearResponse, handleToggleMarkForReview
  ]);

  if (loading || !exam) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#00E5FF]" />
          <span className="text-sm font-semibold">Initializing exam console...</span>
        </div>
      </div>
    );
  }

  // Calculate stats for top bar
  const currentAnswer = answers.find(
    (a) => a.question.toString() === questions[currentIndex]?._id.toString()
  );
  
  const totalAnswered = answers.filter((a) => a.selectedOption !== null).length;
  const totalMarked = answers.filter((a) => a.isMarkedForReview).length;
  const totalUnvisited = answers.filter((a) => !a.visited).length;

  // Format Timer string
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeLeft < 5 * 60; // 5 minutes left warning

  // Color mapper for sidebar question numbers
  const getNavColor = (qId, idx) => {
    const ans = answers.find((a) => a.question.toString() === qId.toString());
    const isActive = currentIndex === idx;

    let baseClass = "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs border transition-all ";

    if (isActive) {
      baseClass += "ring-2 ring-[#00E5FF] ring-offset-2 ring-offset-slate-900 ";
    }

    if (!ans) return baseClass + "bg-slate-800 border-slate-700 text-slate-400";

    if (ans.isMarkedForReview) {
      return baseClass + "bg-purple-600 border-purple-500 text-white"; // Marked
    }
    if (ans.selectedOption !== null) {
      return baseClass + "bg-[#10B981] border-[#10B981] text-white"; // Answered
    }
    if (ans.visited) {
      return baseClass + "bg-slate-700 border-slate-600 text-slate-300"; // Visited but skipped
    }
    
    return baseClass + "bg-slate-800 border-slate-700 text-slate-400"; // Not Visited
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans anti-copy overflow-hidden"
    >
      {/* Top Header Controls */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-slate-800 bg-slate-900 shadow-lg shrink-0 gap-2">
        <div className="min-w-0 pr-2">
          <h2 className="text-sm md:text-md font-bold tracking-tight text-white truncate">{exam.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-3xs text-slate-400 mt-0.5">
            <span className="hidden sm:inline">Type: <strong>{exam.examType}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span>Total: <strong>{questions.length} Qs</strong></span>
            <span>|</span>
            <span className="text-red-400 font-semibold">Penalty: {exam.negativeMarking === 0 ? "None" : `-${Math.abs(exam.negativeMarking)}`}</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Palette Trigger Button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white transition-colors"
            title="Question Palette"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Fullscreen Button */}
          {!isFullscreen && (
            <button
              onClick={requestFullscreenMode}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fullscreen</span>
            </button>
          )}

          {/* Countdown Clock */}
          <div className={`flex items-center gap-2 rounded-lg bg-slate-950 border px-2.5 py-1.5 md:px-4 md:py-2 border-slate-800 ${isLowTime ? "timer-pulse-warning bg-red-950/20 border-red-900" : ""}`}>
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="font-mono font-bold text-xs md:text-sm tracking-widest">{formatTime(timeLeft)}</span>
          </div>

          {/* Submit */}
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition-colors"
          >
            <span>Submit</span>
            <span className="keycap text-4xs bg-red-700 border-red-800 text-red-200 hidden md:inline-flex">S</span>
          </button>
        </div>
      </header>

      {/* Main Board Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Question Board */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Question Card Title & Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                1.00 Mark
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-medium leading-relaxed text-white">
                {questions[currentIndex]?.question}
              </h3>

              {/* Question attachment image */}
              {questions[currentIndex]?.image && (
                <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-800 bg-slate-900 self-start">
                  <img
                    src={questions[currentIndex].image}
                    alt="Clinical attachment"
                    className="max-h-56 w-auto object-contain cursor-zoom-in"
                    onClick={() => setZoomedImage(questions[currentIndex].image)}
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-950/80 p-1.5 rounded-lg text-white pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>

            {/* Options Selection List */}
            <div className="space-y-3 pt-4">
              {questions[currentIndex]?.options.map((option, oIdx) => {
                const isSelected = currentAnswer?.selectedOption === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "bg-teal-950/30 border-[#00E5FF] text-teal-300 ring-2 ring-[#00E5FF]/20"
                        : "bg-slate-900/50 border-slate-800 text-slate-350 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 ${
                      isSelected 
                        ? "bg-[#2765A4] border-[#00E5FF] text-white" 
                        : "bg-slate-855 border-slate-700 text-slate-400"
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-sm font-semibold leading-snug">{option}</span>
                    
                    {/* Visual Keycap indicator */}
                    <span className="keycap text-3xs ml-auto font-mono hidden sm:inline-flex select-none">
                      {oIdx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-900/70 border border-slate-850 rounded-xl px-4 py-2.5 text-3xs text-slate-450 mt-6 select-none max-w-3xl mx-auto w-full">
              <span className="font-bold text-sky-450 uppercase tracking-widest">Keyboard Console Controls:</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs">1-4</span> Select Option</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs">←</span> / <span className="keycap font-black text-4xs">→</span> Navigate</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs">M</span> / <span className="keycap font-black text-4xs">R</span> Mark Review</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs">C</span> Clear Response</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs">S</span> / <span className="keycap font-black text-4xs">Enter</span> Submit</span>
            </div>
          </div>

          {/* Bottom Nav Actions Footer */}
          <footer className="mt-8 border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-3 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
                <span className="keycap text-4xs px-1 py-0.5 ml-1 hidden md:inline-flex">← / P</span>
              </button>
              
              <button
                onClick={handleClearResponse}
                disabled={currentAnswer?.selectedOption === null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
              >
                <span>Clear Response</span>
                <span className="keycap text-4xs px-1 py-0.5 ml-1 hidden md:inline-flex">C</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMarkForReview}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  currentAnswer?.isMarkedForReview
                    ? "bg-purple-950/30 border-purple-500 text-purple-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Bookmark className="h-4 w-4" />
                <span>Mark for Review</span>
                <span className="keycap text-4xs px-1 py-0.5 ml-1 hidden md:inline-flex">R</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E76C0] px-4 py-2 text-xs font-bold text-white hover:bg-[#1F548C] transition-colors disabled:opacity-30"
              >
                <span>Save & Next</span>
                <ChevronRight className="h-4 w-4" />
                <span className="keycap text-4xs px-1 py-0.5 ml-1 bg-[#1F548C] border-teal-800 text-teal-200 hidden md:inline-flex">→ / N</span>
              </button>
            </div>
          </footer>
        </div>

        {/* Right Side: Navigation Sidebar Panel */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900 p-6 flex flex-col justify-between shrink-0 overflow-y-auto hidden md:flex">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Question Palette
            </h3>

            {/* Grid numbers */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => (
                <button
                  key={q._id}
                  onClick={() => handleNavigate(idx)}
                  className={getNavColor(q._id, idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Palette Legend Indicator */}
          <div className="border-t border-slate-800 pt-6 mt-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legend</h4>
            
            <div className="grid grid-cols-2 gap-3 text-2xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-slate-800 border border-slate-700" />
                <span>Not Visited ({totalUnvisited})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-slate-700 border border-slate-600" />
                <span>Skipped</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-[#10B981] border border-[#10B981]" />
                <span>Answered ({totalAnswered})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-purple-600 border border-purple-500" />
                <span>Marked ({totalMarked})</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ANTI-CHEAT ALERT WARNING MODAL */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-slide-up text-left">
            <div className="flex items-center gap-3 text-red-500 font-bold border-b border-slate-800 pb-3">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-base uppercase tracking-wider">Security Violation Detected</h2>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {warningDetails}
            </p>

            <div className="rounded-lg bg-red-950/20 border border-red-900 p-4 text-xs text-red-400 space-y-2">
              <p>You have accumulated <strong>{warnings}</strong> warning(s).</p>
              <p className="leading-normal">Please make sure to return to <strong>Fullscreen Mode</strong> and keep your browser window focused. Multiple security breaches will be audited and logged to your final results report.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setWarningModalOpen(false);
                  requestFullscreenMode(); // Try re-triggering fullscreen
                }}
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOUD IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-4xl max-h-[85vh]">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-xs font-semibold"
            >
              <X className="h-5 w-5" /> Close
            </button>
            <img src={zoomedImage} alt="Zoomed view" className="max-w-full max-h-[80vh] object-contain rounded-lg border border-slate-800 bg-slate-900 shadow-2xl" />
          </div>
        </div>
      )}

      {/* EXAM SUBMIT CONFIRMATION DIALOG */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-slide-up text-left">
            <h2 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Finish & Submit Assessment?
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to end your examination? You will not be able to change any selected options.
            </p>

            <div className="rounded-lg bg-slate-950 border border-slate-850 p-4 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Total Answered:</span>
                <span className="font-bold text-white">{totalAnswered} / {questions.length} questions</span>
              </div>
              <div className="flex justify-between">
                <span>Flagged for Review:</span>
                <span className="font-bold text-purple-400">{totalMarked} questions</span>
              </div>
              <div className="flex justify-between text-[#F59E0B] font-semibold">
                <span>Security Warnings:</span>
                <span>{warnings} warnings</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                disabled={submitting}
              >
                Resume Test
              </button>
              <button
                onClick={handleSubmitExam}
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/10 transition-colors flex items-center gap-1.5"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Grading Paper...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Yes, Submit Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE QUESTION PALETTE DRAWER */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-fade-in" 
            onClick={() => setPaletteOpen(false)} 
          />
          {/* Content */}
          <aside className="relative w-80 bg-slate-900 p-6 border-l border-slate-800 shadow-2xl h-full flex flex-col justify-between overflow-y-auto animate-slide-right z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Question Palette
                </h3>
                <button onClick={() => setPaletteOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid numbers */}
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => (
                  <button
                    key={q._id}
                    onClick={() => {
                      handleNavigate(idx);
                      setPaletteOpen(false);
                    }}
                    className={getNavColor(q._id, idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette Legend */}
            <div className="border-t border-slate-800 pt-6 mt-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legend</h4>
              
              <div className="grid grid-cols-2 gap-3 text-2xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-slate-800 border border-slate-700" />
                  <span>Not Visited ({totalUnvisited})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-slate-700 border border-slate-600" />
                  <span>Skipped</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#10B981] border border-[#10B981]" />
                  <span>Answered ({totalAnswered})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-purple-600 border border-purple-500" />
                  <span>Marked ({totalMarked})</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
