"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  Trophy, Award, Clock, FileQuestion, ArrowLeft, 
  CheckCircle, XCircle, HelpCircle, AlertCircle, Zap, Sparkles,
  BookOpen, Star, Target, ShieldCheck, RefreshCw, Flame, BrainCircuit, Activity
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

export default function PremiumAnalyticsPage({ params }) {
  const { id: resultId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [confettiPlayed, setConfettiPlayed] = useState(false);

  useEffect(() => {
    const fetchResultAndUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(`/api/attempts/${resultId}/result`, { headers });
        const data = await res.json();
        
        if (res.ok) {
          setResult(data.result);
          
          const meRes = await fetch("/api/auth/me", { headers });
          if (meRes.ok) {
            const meData = await meRes.json();
            setCurrentUser(meData.user);
            localStorage.setItem("user", JSON.stringify(meData.user));
          }

          if (!confettiPlayed && (data.result.passed || data.result.accuracy >= 80)) {
            import("canvas-confetti").then((module) => {
              const confetti = module.default;
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }).catch(e => console.error(e));
            setConfettiPlayed(true);
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
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] dark:bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-[#1157CF] dark:text-[#5B93EE]" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compiling Analytics Data...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="font-bold text-slate-900 dark:text-white">Result Record Not Found</p>
        <Link href="/student" className="text-xs font-bold text-[#1157CF] dark:text-[#5B93EE] hover:underline mt-2 inline-block">Return to Hub</Link>
      </div>
    );
  }

  const { exam, score, totalQuestions, correctAnswers, wrongAnswers, skippedAnswers, accuracy, timeTaken, xpEarned, passed, answersSnapshot } = result;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const subjectStats = {};
  answersSnapshot.forEach((ans) => {
    const q = ans.question;
    if (!q) return;
    const subject = q.subject || "General Medicine";
    if (!subjectStats[subject]) {
      subjectStats[subject] = { subject, correct: 0, incorrect: 0, total: 0 };
    }
    subjectStats[subject].total++;
    if (ans.isCorrect) subjectStats[subject].correct++;
    else if (ans.selectedOption !== null && ans.selectedOption !== undefined) subjectStats[subject].incorrect++;
  });

  const subjectChartData = Object.values(subjectStats).map((item) => ({
    ...item,
    accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
    fullMark: 100
  }));

  const weakSubjects = subjectChartData.filter((item) => item.accuracy < 75).sort((a, b) => a.accuracy - b.accuracy);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto py-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Student Hub
          </Link>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{exam?.name || "Examination Analytics"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Detailed performance metrics and competency analysis.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {passed ? (
            <div className="bg-[#DCFAED] border border-[#0F7B3E]/20 text-[#0F7B3E] px-4 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Status</span>
                <span className="text-sm font-black leading-none mt-1">PASSED</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#FDEAEC] border border-[#C0152A]/20 text-[#C0152A] px-4 py-2 rounded-lg flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Status</span>
                <span className="text-sm font-black leading-none mt-1">FAILED</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Final Score</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{score}</span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">/ {totalQuestions}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Accuracy</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#1157CF] dark:text-[#5B93EE] leading-none">{accuracy}%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Correct</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#0F7B3E] dark:text-emerald-400 leading-none">{correctAnswers}</span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Qs</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Incorrect</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#C0152A] dark:text-rose-455 leading-none">{wrongAnswers}</span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Qs</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm col-span-2 md:col-span-4 lg:col-span-1 bg-gradient-to-br from-slate-900 to-[#03122E] text-white">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1 block">XP Gained</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-amber-400 leading-none">+{xpEarned}</span>
            <Zap className="h-5 w-5 text-amber-400 fill-amber-400 mb-1" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        
        {/* Radar Chart */}
        <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-[#1157CF] dark:text-[#5B93EE]" /> Competency Radar
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={subjectChartData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="#1157CF" fill="#1157CF" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: '#0F111E', fontSize: '12px', fontWeight: 600 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl p-6 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#1157CF] dark:text-[#5B93EE]" /> Subject Accuracy Distribution
          </h3>
          <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={subjectChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                 <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 700 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 700 }} domain={[0, 100]} />
                 <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: '#0F111E', fontSize: '12px', fontWeight: 600 }} formatter={(val) => [`${val}%`, 'Accuracy']} />
                 <Bar dataKey="accuracy" fill="#1157CF" radius={[4, 4, 0, 0]} maxBarSize={50} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Clinical Review Mode */}
      <div className="bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Detailed Examination Review</h3>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-3 py-1 rounded-full">
            {totalQuestions} Questions
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {answersSnapshot.map((ans, idx) => {
            const q = ans.question;
            const isCorrect = ans.isCorrect;
            const isSkipped = ans.selectedOption === null || ans.selectedOption === undefined;

            return (
              <div key={idx} className="p-6 md:p-8 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-8">{(idx + 1).toString().padStart(2, '0')}</span>
                  {isSkipped ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">Skipped</span>
                  ) : isCorrect ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#DCFAED] dark:bg-emerald-950/20 text-[#0F7B3E] dark:text-emerald-400 border border-[#0F7B3E]/20 dark:border-emerald-900/30">Correct</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#FDEAEC] dark:bg-rose-955/20 text-[#C0152A] dark:text-rose-400 border border-[#C0152A]/20 dark:border-rose-900/30">Incorrect</span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#1157CF]/10 text-[#1157CF] dark:text-[#5B93EE] border border-[#1157CF]/20 dark:border-blue-900/30 ml-auto">{q?.subject}</span>
                </div>

                <div className="pl-11">
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-relaxed mb-6">{q?.question}</p>
                  
                  <div className="space-y-3 mb-6">
                    {q?.options.map((opt, oIdx) => {
                      const isOptionCorrect = oIdx === q.correctAnswer;
                      const isOptionSelected = ans.selectedOption === oIdx;

                      let style = "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 font-medium";
                      let badgeStyle = "border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400";

                      if (isOptionCorrect) {
                        style = "border-[#0F7B3E] dark:border-emerald-800 bg-[#DCFAED]/30 dark:bg-emerald-950/25 text-[#0F7B3E] dark:text-emerald-450 shadow-sm";
                        badgeStyle = "bg-[#0F7B3E] text-white border-[#0F7B3E]";
                      } else if (isOptionSelected && !isCorrect) {
                        style = "border-[#C0152A] dark:border-rose-800 bg-[#FDEAEC]/30 dark:bg-rose-955/25 text-[#C0152A] dark:text-rose-450";
                        badgeStyle = "bg-[#C0152A] text-white border-[#C0152A]";
                      }

                      return (
                        <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-xl border ${style}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-black shrink-0 ${badgeStyle}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className="text-sm font-semibold">{opt}</span>
                          {isOptionSelected && (
                            <div className="ml-auto">
                              {isCorrect ? <CheckCircle className="h-5 w-5 text-[#0F7B3E] dark:text-emerald-400" /> : <XCircle className="h-5 w-5 text-[#C0152A] dark:text-rose-400" />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q?.explanation && (
                    <div className="bg-[#1157CF]/5 dark:bg-[#1157CF]/10 border border-[#1157CF]/20 dark:border-[#1157CF]/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 text-[#1157CF] dark:text-[#5B93EE] mb-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Clinical Rationale</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
