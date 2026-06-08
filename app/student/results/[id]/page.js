"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  Trophy, Award, Clock, FileQuestion, ArrowLeft, 
  CheckCircle, XCircle, HelpCircle, AlertCircle, Zap, Sparkles,
  BookOpen, Star, Target, ShieldCheck, RefreshCw, Flame
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";

export const dynamic = "force-dynamic";

export default function ExamResultPage({ params }) {
  // Resolve params
  const { id: resultId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Confetti trigger tracking
  const [confettiPlayed, setConfettiPlayed] = useState(false);

  useEffect(() => {
    const fetchResultAndUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Result
        const res = await fetch(`/api/attempts/${resultId}/result`, { headers });
        const data = await res.json();
        
        if (res.ok) {
          setResult(data.result);
          
          // 2. Fetch fresh user profile details
          const meRes = await fetch("/api/auth/me", { headers });
          if (meRes.ok) {
            const meData = await meRes.json();
            setCurrentUser(meData.user);
            localStorage.setItem("user", JSON.stringify(meData.user));
          }

          // Trigger confetti if they passed or got high accuracy
          if (!confettiPlayed) {
            if (data.result.passed || data.result.accuracy >= 80) {
              import("canvas-confetti").then((module) => {
                const confetti = module.default;
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 }
                });
              }).catch(e => console.error("Confetti load error:", e));
              setConfettiPlayed(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResultAndUser();
  }, [resultId, confettiPlayed]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-slate-500">Grading mock response booklet...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="premium-card p-12 text-center text-slate-500 animate-fade-in">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="font-semibold text-lg">Result Record Not Found</p>
        <Link href="/student" className="text-sm text-teal-655 hover:underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { exam, score, totalQuestions, correctAnswers, wrongAnswers, skippedAnswers, accuracy, timeTaken, xpEarned, passed, answersSnapshot } = result;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins} min ${remainingSecs} sec`;
  };

  // 1. Calculate subject-wise accuracy from snapshot
  const subjectStats = {};
  answersSnapshot.forEach((ans) => {
    const q = ans.question;
    if (!q) return;

    const subject = q.subject || "General Medicine";
    if (!subjectStats[subject]) {
      subjectStats[subject] = {
        subject,
        correct: 0,
        incorrect: 0,
        total: 0
      };
    }

    subjectStats[subject].total++;
    if (ans.isCorrect) {
      subjectStats[subject].correct++;
    } else if (ans.selectedOption !== null && ans.selectedOption !== undefined) {
      subjectStats[subject].incorrect++;
    }
  });

  const subjectChartData = Object.values(subjectStats).map((item) => ({
    ...item,
    accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0
  }));

  // Identify weak areas (accuracy < 75%)
  const weakSubjects = subjectChartData.filter((item) => item.accuracy < 75);
  weakSubjects.sort((a, b) => a.accuracy - b.accuracy);

  // Level thresholds mappings for gamification display
  const levelMap = {
    Intern: { max: 200, badge: "Intern" },
    Resident: { max: 500, badge: "Resident" },
    "Senior Resident": { max: 1000, badge: "Senior Resident" },
    Consultant: { max: 2000, badge: "Consultant" },
    Master: { max: 5000, badge: "Master Specialist" }
  };

  const currentLevel = currentUser?.level || "Intern";
  const currentXp = currentUser?.xp || 0;
  const nextXpMax = levelMap[currentLevel]?.max || 200;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Back Header navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {passed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-green-50 text-green-800 px-3.5 py-1 rounded-full border border-green-250">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Passed Assessment</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-800 px-3.5 py-1 rounded-full border border-red-200">
            <XCircle className="h-4 w-4 text-red-650" />
            <span>Did Not Pass</span>
          </span>
        )}
      </div>

      {/* Main Scorecard Header with custom Gamification overlay */}
      <div className="premium-card p-6 bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-36 w-36 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
        
        <div className="space-y-2">
          <span className="text-2xs text-teal-300 font-extrabold uppercase tracking-wider block">Exam Assessment Scorecard</span>
          <h2 className="text-2xl font-black tracking-tight text-white">{exam?.name || "Clinical Mock Examination"}</h2>
          <p className="text-2xs text-slate-400">Response booklet evaluated on {new Date(result.submittedAt).toLocaleString()}</p>
        </div>

        {/* Gamified Rewards */}
        <div className="flex items-center gap-4 bg-slate-950/45 border border-slate-800 rounded-2xl p-4 shrink-0">
          <div className="text-center">
            <span className="text-4xs text-slate-400 font-bold uppercase tracking-widest block">XP Awarded</span>
            <span className="text-2xl font-black text-amber-400 flex items-center justify-center gap-0.5 mt-1">
              <Zap className="h-6 w-6 fill-amber-400 text-amber-400" />
              +{xpEarned}
            </span>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          <div className="text-center">
            <span className="text-4xs text-slate-400 font-bold uppercase tracking-widest block">Level Designation</span>
            <span className="text-xs font-extrabold text-teal-300 block mt-2">{currentLevel}</span>
            <span className="text-5xs text-slate-400 font-semibold block">{currentXp} / {nextXpMax} XP</span>
          </div>
        </div>
      </div>

      {/* Stats Board GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="premium-card p-5 text-center bg-white">
          <span className="text-2xs font-bold text-slate-450 uppercase tracking-wider block">Final Score</span>
          <h4 className="text-2xl font-extrabold text-slate-900 mt-2">{score} / {totalQuestions}</h4>
          <span className="text-3xs text-slate-455 block mt-1">Penalty adjustments applied</span>
        </div>

        <div className="premium-card p-5 text-center bg-white">
          <span className="text-2xs font-bold text-slate-450 uppercase tracking-wider block">Correct Answers</span>
          <h4 className="text-2xl font-extrabold text-green-600 mt-2">+{correctAnswers}</h4>
          <span className="text-3xs text-slate-455 block mt-1">{Math.round((correctAnswers / totalQuestions) * 100)}% of questions</span>
        </div>

        <div className="premium-card p-5 text-center bg-white">
          <span className="text-2xs font-bold text-slate-455 uppercase tracking-wider block">Wrong Selection</span>
          <h4 className="text-2xl font-extrabold text-red-500 mt-2">-{wrongAnswers}</h4>
          <span className="text-3xs text-slate-455 block mt-1">Negative penalty: {exam?.negativeMarking === 0 ? "None" : `-${Math.abs(exam?.negativeMarking || 0) * wrongAnswers}`}</span>
        </div>

        <div className="premium-card p-5 text-center bg-white">
          <span className="text-2xs font-bold text-slate-455 uppercase tracking-wider block">Accuracy Rate</span>
          <h4 className="text-2xl font-extrabold text-indigo-650 mt-2">{accuracy}%</h4>
          <span className="text-3xs text-slate-455 block mt-1">Correct / total attempted</span>
        </div>

        <div className="premium-card p-5 text-center bg-white">
          <span className="text-2xs font-bold text-slate-455 uppercase tracking-wider block">Time Spent</span>
          <h4 className="text-lg font-extrabold text-slate-800 mt-2.5 truncate">{formatDuration(timeTaken)}</h4>
          <span className="text-3xs text-slate-455 block mt-1.5">Timer Limit: {exam?.duration} mins</span>
        </div>
      </div>

      {/* Advanced Chart Analysis & Weakness clinical topic Recommendations */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subject accuracy charts bar */}
        <div className="premium-card p-6 lg:col-span-2 bg-white">
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Subject accuracy breakdown</h3>
            <span className="text-3xs text-slate-400 font-semibold uppercase tracking-widest">Performance metrics</span>
          </div>

          {subjectChartData.length === 0 ? (
            <div className="text-center text-slate-400 py-16 text-xs">
              No subject tagging metadata found in exam papers.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={subjectChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '11px' }}
                    formatter={(val) => [`${val}%`, 'Accuracy']}
                  />
                  <Bar dataKey="accuracy" fill="#0284c7" name="Accuracy Rate" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Clinical Weakness Recommendations Indicator */}
        <div className="premium-card p-6 bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Target className="h-4.5 w-4.5 text-rose-500" />
                Clinical Revision Targets
              </h3>
            </div>

            {weakSubjects.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs flex flex-col items-center justify-center">
                <Award className="h-10 w-10 text-emerald-500 mb-2 fill-emerald-50" />
                <p className="font-bold text-slate-700">All Tiers Proficient</p>
                <p className="text-2xs text-slate-455 mt-1">Excellent diagnostic precision across all tested clinical subjects!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {weakSubjects.slice(0, 3).map((item) => (
                  <div key={item.subject} className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <span className="font-bold text-slate-800 block">{item.subject}</span>
                    <div className="flex justify-between items-center text-2xs text-slate-500 mt-1">
                      <span>Diagnostic Accuracy:</span>
                      <span className="font-extrabold text-red-500">{item.accuracy}%</span>
                    </div>
                    <p className="text-3xs text-slate-455 mt-2 border-t border-slate-200/60 pt-1.5 italic">
                      Review incorrect case files for this subject in the rationale registry below.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-4xs text-slate-450 font-semibold border-t border-slate-100 pt-3 text-right">
            Study clinical explanations to raise diagnostic accuracy.
          </div>
        </div>
      </div>

      {/* Review Mode: Scrollable Question details */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
          Detailed Clinical Question Review
        </h3>

        <div className="space-y-6">
          {answersSnapshot.map((ans, index) => {
            const q = ans.question;
            const isCorrect = ans.isCorrect;
            const isSkipped = ans.selectedOption === null || ans.selectedOption === undefined;

            return (
              <div 
                key={index} 
                className={`premium-card p-6 border-t-4 bg-white ${
                  isSkipped ? "border-slate-300 bg-slate-50/50" :
                  isCorrect ? "border-green-500" : "border-red-400"
                }`}
              >
                {/* Meta details */}
                <div className="flex justify-between items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Question {index + 1}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                      {q?.subject || "General Medicine"}
                    </span>
                    {isSkipped ? (
                      <span className="text-2xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Skipped</span>
                    ) : isCorrect ? (
                      <span className="text-2xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Correct</span>
                    ) : (
                      <span className="text-2xs bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Incorrect</span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-sm font-bold text-slate-900 leading-relaxed mb-4">
                  {q?.question}
                </p>

                {/* Option list */}
                <div className="space-y-2 mb-4">
                  {q?.options.map((option, oIdx) => {
                    const isOptionCorrect = oIdx === q.correctAnswer;
                    const isOptionSelected = ans.selectedOption === oIdx;

                    let optionStyle = "border-slate-200 text-slate-600 bg-white ";
                    let badgeColor = "bg-slate-100 border-slate-300 text-slate-500 ";

                    if (isOptionCorrect) {
                      optionStyle = "bg-green-50/50 border-green-500 text-green-800 font-medium ";
                      badgeColor = "bg-green-600 border-green-500 text-white ";
                    } else if (isOptionSelected && !isCorrect) {
                      optionStyle = "bg-red-50/50 border-red-400 text-red-800 font-medium ";
                      badgeColor = "bg-red-600 border-red-500 text-white ";
                    }

                    return (
                      <div 
                        key={oIdx} 
                        className={`flex items-center gap-3 rounded-lg border p-3.5 text-xs transition-colors ${optionStyle}`}
                      >
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-2xs border ${badgeColor}`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation text */}
                {q?.explanation && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-1 text-teal-700">
                      <Sparkles className="h-4 w-4" />
                      Clinical Rationale & Explanation
                    </p>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
