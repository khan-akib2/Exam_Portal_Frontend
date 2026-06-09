"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Clock, ChevronRight, ChevronLeft, 
  Bookmark, Check, AlertTriangle, AlertCircle, Maximize2, ZoomIn, X, RefreshCw, PlayCircle
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
  const [examStarted, setExamStarted] = useState(false);
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

  // 1. Fetch Exam Details for the Start Screen
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch exam details");
        setExam(data.exam || data);
      } catch (err) {
        showAlert("Failed to load exam details.", "Error");
        router.push("/student/exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExamDetails();
  }, [examId, router, showAlert]);

  const requestFullscreenMode = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    }
  };

  const startSession = async () => {
    try {
      setLoading(true);
      requestFullscreenMode(); // Request fullscreen immediately on click
      
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
      setExamStarted(true);
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
    if (timerActive && timeLeft > 0 && examStarted) {
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
  }, [timerActive, timeLeft, handleAutoSubmit, examStarted]);

  // Anti-Cheat: Detect Focus Loss / Tab Switching
  useEffect(() => {
    if (!attemptId || !examStarted) return;

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
  }, [attemptId, examStarted, triggerSecurityViolation]);

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
    if (!examStarted || loading || !exam || questions.length === 0) return;

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
    examStarted, loading, exam, questions, currentIndex, answers, warningModalOpen, 
    submitModalOpen, zoomedImage, handlePrev, handleNext, 
    handleSelectOption, handleClearResponse, handleToggleMarkForReview
  ]);

  if (loading && !exam) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1A0B08] text-orange-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-red-600" />
          <span className="text-sm font-semibold text-orange-200">Initializing secure environment...</span>
        </div>
      </div>
    );
  }

  // --- Landing Screen for Assessment ---
  if (!examStarted && exam) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1A0B08] text-orange-50 font-sans p-4">
        <div className="max-w-xl w-full bg-[#2A1612] rounded-2xl shadow-2xl border border-[#4A2620] overflow-hidden">
          <div className="bg-red-900 p-6 text-white text-center border-b border-red-950">
            <h1 className="text-2xl font-black tracking-tight mb-2">Start Assessment</h1>
            <p className="text-sm text-red-200">{exam.name}</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1A0B08] border border-[#3A1D18] p-4 rounded-xl text-center">
                <span className="block text-xs font-bold text-orange-400/70 uppercase tracking-wider mb-1">Duration</span>
                <span className="text-lg font-bold text-orange-100">{exam.duration} mins</span>
              </div>
              <div className="bg-[#1A0B08] border border-[#3A1D18] p-4 rounded-xl text-center">
                <span className="block text-xs font-bold text-orange-400/70 uppercase tracking-wider mb-1">Questions</span>
                <span className="text-lg font-bold text-orange-100">{exam.questions?.length || "TBD"} Qs</span>
              </div>
            </div>

            <div className="bg-orange-950/40 border border-orange-900/50 rounded-xl p-4 flex gap-3 text-orange-200 text-sm">
              <ShieldAlert className="h-6 w-6 shrink-0 text-orange-500" />
              <div>
                <p className="font-bold mb-1 text-orange-300">Strict Proctoring Enabled</p>
                <p className="text-xs leading-relaxed text-orange-300/70">
                  This examination requires full-screen mode. Exiting full-screen, switching tabs, or minimizing the browser will be recorded as a security violation and may auto-submit your exam.
                </p>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 border border-red-700 shadow-lg shadow-red-900/30"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Maximize2 className="h-5 w-5" />
                  Enter Fullscreen & Start Exam
                </>
              )}
            </button>
          </div>
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
      baseClass += "ring-2 ring-red-600 ring-offset-2 ring-offset-[#1A0B08] ";
    }

    if (!ans) return baseClass + "bg-[#2A1612] border-[#4A2620] text-orange-300/60 hover:border-orange-500/50";

    if (ans.isMarkedForReview) {
      return baseClass + "bg-purple-900 border-purple-700 text-purple-100 shadow-sm shadow-purple-900/40"; // Marked
    }
    if (ans.selectedOption !== null) {
      return baseClass + "bg-emerald-900 border-emerald-700 text-emerald-100 shadow-sm shadow-emerald-900/40"; // Answered
    }
    if (ans.visited) {
      return baseClass + "bg-[#3A1D18] border-[#5A2E25] text-orange-400/70"; // Visited but skipped
    }
    
    return baseClass + "bg-[#2A1612] border-[#4A2620] text-orange-300/60 hover:border-orange-500/50"; // Not Visited
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      className="flex flex-col h-screen bg-[#1A0B08] text-orange-50 font-sans anti-copy overflow-hidden selection:bg-red-900/50"
    >
      {/* Top Header Controls */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-[#3A1D18] bg-[#2A1612] shadow-md shrink-0 gap-2 z-10">
        <div className="min-w-0 pr-2">
          <h2 className="text-sm md:text-md font-bold tracking-tight text-orange-100 truncate">{exam.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-3xs text-orange-400/60 mt-0.5">
            <span className="hidden sm:inline">Type: <strong className="text-orange-300/80">{exam.examType}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span>Total: <strong className="text-orange-300/80">{questions.length} Qs</strong></span>
            <span>|</span>
            <span className="text-red-400 font-semibold">Penalty: {exam.negativeMarking === 0 ? "None" : `-${Math.abs(exam.negativeMarking)}`}</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Palette Trigger Button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4A2620] bg-[#1A0B08] text-orange-400/70 hover:bg-[#3A1D18] hover:text-orange-100 transition-colors"
            title="Question Palette"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Fullscreen Indicator (Optional) */}
          {!isFullscreen && (
            <button
              onClick={requestFullscreenMode}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-red-800 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-900/50 transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Resume Fullscreen</span>
            </button>
          )}

          {/* Countdown Clock */}
          <div className={`flex items-center gap-2 rounded-lg bg-[#1A0B08] border px-2.5 py-1.5 md:px-4 md:py-2 border-[#4A2620] ${isLowTime ? "timer-pulse-warning bg-red-950/40 border-red-800 text-red-400" : "text-orange-200"}`}>
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
            <span className="font-mono font-bold text-xs md:text-sm tracking-widest">{formatTime(timeLeft)}</span>
          </div>

          {/* Submit */}
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-800 px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold text-white shadow-md shadow-red-900/30 hover:bg-red-700 hover:shadow-lg transition-all border border-red-700"
          >
            <span>Submit</span>
            <span className="keycap text-4xs bg-red-950 border-red-900 text-white hidden md:inline-flex opacity-80">S</span>
          </button>
        </div>
      </header>

      {/* Main Board Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Anti-cheat overlay if fullscreen is lost */}
        {examStarted && !isFullscreen && !warningModalOpen && !submitModalOpen && (
          <div className="absolute inset-0 z-40 bg-[#1A0B08]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-black text-orange-50 mb-2">Fullscreen Required</h2>
            <p className="text-orange-200/70 max-w-md mb-6">
              You must remain in fullscreen mode during the examination. Your session is temporarily paused.
            </p>
            <button
              onClick={requestFullscreenMode}
              className="bg-red-800 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 transition-colors shadow-lg border border-red-700"
            >
              Return to Fullscreen
            </button>
          </div>
        )}

        {/* Left Side: Question Board */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 bg-[#1A0B08]">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            {/* Main Content Card */}
            <div className="bg-[#2A1612] border border-[#4A2620] rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 md:p-8 space-y-6">
                
                {/* Question Card Title & Header */}
                <div className="flex items-center justify-between border-b border-[#3A1D18] pb-4">
                  <span className="text-xs font-bold text-orange-400/70 uppercase tracking-widest flex items-center gap-2">
                    <span className="bg-red-600 w-1.5 h-4 rounded-full"></span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs bg-[#1A0B08] border border-[#4A2620] px-2 py-1 rounded text-orange-300 font-semibold">
                    1.00 Mark
                  </span>
                </div>

                {/* Question Text */}
                <div className="space-y-4">
                  <h3 className="text-lg md:text-xl font-medium leading-relaxed text-orange-50">
                    {questions[currentIndex]?.question}
                  </h3>

                  {/* Question attachment image */}
                  {questions[currentIndex]?.image && (
                    <div className="relative group max-w-sm rounded-xl overflow-hidden border border-[#4A2620] bg-[#1A0B08] self-start cursor-zoom-in" onClick={() => setZoomedImage(questions[currentIndex].image)}>
                      <img
                        src={questions[currentIndex].image}
                        alt="Clinical attachment"
                        className="max-h-56 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-[#1A0B08]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-[#2A1612] text-orange-100 p-2 rounded-lg shadow-lg flex items-center gap-1.5 font-bold text-xs border border-[#4A2620]">
                          <ZoomIn className="h-4 w-4" /> Expand
                        </div>
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
                        className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                          isSelected
                            ? "bg-red-950/40 border-red-600 text-orange-50 ring-1 ring-red-600 shadow-md shadow-red-900/20"
                            : "bg-[#1A0B08] border-[#3A1D18] text-orange-200/80 hover:bg-[#3A1D18] hover:border-[#5A2E25]"
                        }`}
                      >
                        <span className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-colors ${
                          isSelected 
                            ? "bg-red-700 border-red-600 text-white" 
                            : "bg-[#2A1612] border-[#4A2620] text-orange-400/60"
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-sm font-semibold leading-snug">{option}</span>
                        
                        {/* Visual Keycap indicator */}
                        <span className="keycap text-3xs ml-auto font-mono hidden sm:inline-flex select-none border-[#4A2620] bg-[#2A1612] text-orange-500/50">
                          {oIdx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="flex flex-wrap items-center justify-center gap-4 bg-[#2A1612] border border-[#3A1D18] rounded-xl px-4 py-3 text-3xs text-orange-400/60 mt-6 select-none max-w-3xl mx-auto w-full shadow-sm">
              <span className="font-bold text-orange-300 uppercase tracking-widest">Keyboard Controls:</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs bg-[#1A0B08] border-[#4A2620] text-orange-500/70">1-4</span> Select</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs bg-[#1A0B08] border-[#4A2620] text-orange-500/70">←</span> / <span className="keycap font-black text-4xs bg-[#1A0B08] border-[#4A2620] text-orange-500/70">→</span> Navigate</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs bg-[#1A0B08] border-[#4A2620] text-orange-500/70">M</span> / <span className="keycap font-black text-4xs bg-[#1A0B08] border-[#4A2620] text-orange-500/70">R</span> Review</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs bg-[#1A0B08] border-[#4A2620] text-orange-500/70">C</span> Clear</span>
              <span className="flex items-center gap-0.5"><span className="keycap font-black text-4xs bg-[#1A0B08] border-[#4A2620] text-orange-500/70">S</span> Submit</span>
            </div>
          </div>

          {/* Bottom Nav Actions Footer */}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#4A2620] bg-[#2A1612] shadow-sm px-4 py-2.5 text-xs font-bold text-orange-200/80 hover:text-orange-50 hover:bg-[#3A1D18] transition-colors disabled:opacity-50 disabled:hover:bg-[#2A1612]"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              
              <button
                onClick={handleClearResponse}
                disabled={currentAnswer?.selectedOption === null}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#4A2620] bg-[#2A1612] shadow-sm px-4 py-2.5 text-xs font-bold text-orange-200/80 hover:text-orange-50 hover:bg-[#3A1D18] transition-colors disabled:opacity-50 disabled:hover:bg-[#2A1612]"
              >
                <span>Clear</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMarkForReview}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                  currentAnswer?.isMarkedForReview
                    ? "bg-purple-900/40 border-purple-800 text-purple-200"
                    : "border-[#4A2620] bg-[#2A1612] text-orange-200/80 hover:bg-[#3A1D18] hover:text-orange-50"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${currentAnswer?.isMarkedForReview ? "fill-purple-500 text-purple-500" : ""}`} />
                <span>Mark Review</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 border border-red-700 shadow-lg shadow-red-900/30 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-all disabled:opacity-50 disabled:hover:bg-red-800"
              >
                <span>Save & Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </div>

        {/* Right Side: Navigation Sidebar Panel */}
        <aside className="w-80 border-l border-[#3A1D18] bg-[#2A1612] shadow-2xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto hidden md:flex z-10">
          <div className="space-y-6">
            <h3 className="text-sm font-black text-orange-100 uppercase tracking-wider border-b border-[#3A1D18] pb-4">
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
          <div className="border-t border-[#3A1D18] pt-6 mt-6 space-y-4 bg-[#1A0B08] -mx-6 -mb-6 p-6">
            <h4 className="text-xs font-bold text-orange-500/70 uppercase tracking-widest">Status Legend</h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs text-orange-300/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-[#2A1612] border border-[#4A2620] shadow-sm" />
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-[#3A1D18] border border-[#5A2E25] shadow-sm" />
                <span>Skipped</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-emerald-900 border border-emerald-700 shadow-sm" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-purple-900 border border-purple-700 shadow-sm" />
                <span>Marked</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ANTI-CHEAT ALERT WARNING MODAL */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A0B08]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#2A1612] border border-red-900 rounded-2xl p-6 shadow-2xl space-y-4 animate-slide-up text-left">
            <div className="flex items-center gap-3 text-red-500 font-black border-b border-[#4A2620] pb-3">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-base uppercase tracking-wider">Security Violation</h2>
            </div>
            
            <p className="text-sm text-orange-200 leading-relaxed font-medium">
              {warningDetails}
            </p>

            <div className="rounded-xl bg-[#1A0B08] border border-red-900/50 p-4 text-xs text-red-400 space-y-2">
              <p>You have accumulated <strong>{warnings}</strong> warning(s).</p>
              <p className="leading-normal">Please make sure to return to <strong>Fullscreen Mode</strong> and keep your browser window focused. Multiple security breaches will be audited.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setWarningModalOpen(false);
                  requestFullscreenMode(); // Try re-triggering fullscreen
                }}
                className="rounded-xl bg-red-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md transition-colors border border-red-700"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOUD IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A0B08]/95 backdrop-blur-sm p-4">
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 text-orange-200 hover:text-white flex items-center gap-2 text-sm font-bold bg-[#2A1612] border border-[#4A2620] px-4 py-2 rounded-xl"
            >
              <X className="h-5 w-5" /> Close
            </button>
            <img src={zoomedImage} alt="Zoomed view" className="max-w-full max-h-[85vh] object-contain rounded-xl border border-[#4A2620] bg-[#1A0B08] shadow-2xl" />
          </div>
        </div>
      )}

      {/* EXAM SUBMIT CONFIRMATION DIALOG */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A0B08]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#2A1612] border border-[#4A2620] rounded-2xl p-6 shadow-2xl space-y-4 animate-slide-up text-left">
            <h2 className="text-lg font-black text-orange-50 border-b border-[#3A1D18] pb-3 flex items-center gap-2">
              <Check className="h-6 w-6 text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 p-1 rounded-lg" />
              Submit Assessment?
            </h2>

            <p className="text-sm text-orange-200/80 leading-relaxed">
              Are you sure you want to end your examination? You will not be able to change any selected options.
            </p>

            <div className="rounded-xl bg-[#1A0B08] border border-[#3A1D18] p-4 space-y-3 text-sm text-orange-200/80">
              <div className="flex justify-between items-center">
                <span>Total Answered:</span>
                <span className="font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded">{totalAnswered} / {questions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Flagged for Review:</span>
                <span className="font-bold text-purple-400 bg-purple-950/50 border border-purple-900/50 px-2 py-0.5 rounded">{totalMarked}</span>
              </div>
              {warnings > 0 && (
                <div className="flex justify-between items-center text-red-400 font-semibold border-t border-[#3A1D18] pt-2 mt-2">
                  <span>Security Warnings:</span>
                  <span>{warnings} warnings</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="rounded-xl bg-[#1A0B08] border border-[#4A2620] px-5 py-2.5 text-sm font-bold text-orange-300 hover:bg-[#3A1D18] hover:text-orange-100 transition-colors"
                disabled={submitting}
              >
                Resume Test
              </button>
              <button
                onClick={handleSubmitExam}
                className="rounded-xl bg-red-800 border border-red-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-900/30 transition-colors flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Submit</span>
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
            className="fixed inset-0 bg-[#1A0B08]/80 backdrop-blur-sm animate-fade-in" 
            onClick={() => setPaletteOpen(false)} 
          />
          {/* Content */}
          <aside className="relative w-80 bg-[#2A1612] p-6 shadow-2xl h-full flex flex-col justify-between overflow-y-auto animate-slide-right z-50 border-l border-[#4A2620]">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#3A1D18] pb-4">
                <h3 className="text-sm font-black text-orange-100 uppercase tracking-wider">
                  Question Palette
                </h3>
                <button onClick={() => setPaletteOpen(false)} className="text-orange-400/60 hover:text-orange-100 bg-[#1A0B08] border border-[#4A2620] p-1.5 rounded-lg">
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
            <div className="border-t border-[#3A1D18] pt-6 mt-6 space-y-4 bg-[#1A0B08] -mx-6 -mb-6 p-6">
              <h4 className="text-xs font-bold text-orange-500/70 uppercase tracking-widest">Legend</h4>
              
              <div className="grid grid-cols-2 gap-3 text-xs text-orange-300/80 font-medium">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#2A1612] border border-[#4A2620] shadow-sm" />
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#3A1D18] border border-[#5A2E25] shadow-sm" />
                  <span>Skipped</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-emerald-900 border border-emerald-700 shadow-sm" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-purple-900 border border-purple-700 shadow-sm" />
                  <span>Marked</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
