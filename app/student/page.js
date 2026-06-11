"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bell, Search, MessageSquare, BookOpen, Clock,
  ChevronRight, ArrowUpRight, Trophy, TrendingUp,
  BarChart3, Zap, Flame, CheckCircle2, Activity,
  ArrowUp, Target, Users, Plus
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line
} from "recharts";

const miniBarData = [
  { v: 30 }, { v: 50 }, { v: 40 }, { v: 70 }, { v: 60 }, { v: 80 }
];
const miniLineData = [
  { v: 40 }, { v: 55 }, { v: 45 }, { v: 65 }, { v: 58 }, { v: 72 }, { v: 68 }, { v: 80 }
];
const miniScatterData = [
  { v: 20 }, { v: 45 }, { v: 30 }, { v: 60 }, { v: 40 }, { v: 55 }, { v: 70 }
];

// Radial gauge component
function RadialGauge({ value = 65, max = 100, size = 160 }) {
  const radius = 60;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - pct * 0.75);

  // Build tick marks
  const ticks = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * 270 - 135;
    const rad = (angle * Math.PI) / 180;
    const inner = 50, outer = i % 5 === 0 ? 44 : 47;
    return {
      x1: cx + inner * Math.cos(rad),
      y1: cy + inner * Math.sin(rad),
      x2: cx + outer * Math.cos(rad),
      y2: cy + outer * Math.sin(rad),
      major: i % 5 === 0,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth="10"
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        strokeDashoffset={circumference * 0.125}
        strokeLinecap="round"
        className="stroke-slate-200 dark:stroke-slate-800"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* Progress */}
      <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth="10"
        strokeDasharray={`${circumference * 0.75 * pct} ${circumference}`}
        strokeDashoffset={circumference * 0.125}
        strokeLinecap="round"
        className="stroke-[#1157CF] dark:stroke-[#5B93EE]"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          strokeWidth={t.major ? 1.5 : 1}
          className={t.major ? "stroke-slate-400 dark:stroke-slate-600" : "stroke-slate-300 dark:stroke-slate-700"} />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" className="fill-slate-900 dark:fill-white">{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-400">score / 100</text>
    </svg>
  );
}

// Exam status tracker steps
function StatusTracker({ exam }) {
  const steps = ["Registered", "Scheduled", "In Progress", "Completed"];
  const statusMap = { draft: 1, published: 2, active: 3, completed: 4 };
  const current = statusMap[exam?.status] || 1;

  return (
    <div className="flex flex-col gap-2 mt-3">
      {steps.map((step, i) => {
        const done = i + 1 < current;
        const active = i + 1 === current;
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full shrink-0 border-2 flex items-center justify-center ${
              done ? "border-[#1157CF] dark:border-[#5B93EE] bg-[#1157CF] dark:bg-[#5B93EE]"
              : active ? "border-[#1157CF] dark:border-[#5B93EE] bg-white dark:bg-[var(--card)]"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--card)]"
            }`}>
              {done && <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-[var(--card)]" />}
              {active && <div className="h-1.5 w-1.5 rounded-full bg-[#1157CF] dark:bg-[#5B93EE]" />}
            </div>
            <span className={`text-xs ${
              active ? "font-bold text-slate-900 dark:text-white" 
              : done ? "text-slate-400 dark:text-slate-600 line-through" 
              : "text-slate-400 dark:text-slate-500"
            }`}>
              {step}
            </span>
            {active && exam?.scheduledAt && (
              <span className="ml-auto text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {new Date(exam.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StudentDashboardContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const searchParams = useSearchParams();
  const theme = searchParams ? searchParams.get("theme") : "light";

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const stored = localStorage.getItem("user");
        if (stored) setCurrentUser(JSON.parse(stored));

        const [examsRes, notifRes, statsRes] = await Promise.all([
          fetch("/api/exams", { headers }),
          fetch("/api/notifications", { headers }),
          fetch("/api/analytics/stats", { headers }),
        ]);

        const examsData = await examsRes.json();
        if (examsRes.ok) setExams(examsData.exams || []);

        const notifData = await notifRes.json();
        if (notifRes.ok) setNotifications((notifData.notifications || []).slice(0, 3));

        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData.stats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1157CF] rounded-full animate-spin" />
      </div>
    );
  }

  const totalExams = stats?.totalExamsAttempted || 0;
  const avgScore = stats?.averageAccuracy || 0;
  const xp = currentUser.xp || 0;
  const streak = currentUser.streak || 0;
  const featuredExam = exams[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-[1280px] mx-auto space-y-6"
    >
      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {currentUser.name?.split(" ")[0]}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            You have {exams.filter(e => e.status === "published").length} available exam{exams.filter(e => e.status === "published").length !== 1 ? "s" : ""} ready to take.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Icon Linked to Announcements */}
          <Link 
            href="/student/announcements" 
            className="h-10 w-10 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors relative"
            title="View Announcements"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#1157CF] dark:bg-[#5B93EE] text-[9px] font-black text-white flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Link>
          <Link
            href="/student/exams"
            className="h-10 px-5 rounded-full bg-[#1157CF] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#0D46A8] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Start New Exam
          </Link>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex items-center justify-between gap-4 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">This month's exams</p>
            <div className="flex items-end gap-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{totalExams}</span>
                <span className="ml-2 text-xs font-bold text-emerald-500 inline-flex items-center gap-0.5">
                  <ArrowUp className="h-3 w-3" />25%
                </span>
              </div>
            </div>
          </div>
          <div className="w-28 h-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miniBarData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="v" fill="#DBEAFE" className="fill-[#1157CF]/20 dark:fill-[#5B93EE]/10" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex items-center justify-between gap-4 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Average score</p>
            <div className="flex items-end gap-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{avgScore}%</span>
                <span className="ml-2 text-xs font-bold text-emerald-500 inline-flex items-center gap-0.5">
                  <ArrowUp className="h-3 w-3" />12%
                </span>
              </div>
            </div>
          </div>
          <div className="w-28 h-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miniLineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="v" fill="#DBEAFE" className="fill-[#1157CF]/20 dark:fill-[#5B93EE]/10" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex items-center justify-between gap-4 transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">XP & Streak</p>
            <div className="flex items-end gap-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{xp}</span>
                <span className="ml-2 text-xs font-bold text-amber-500 inline-flex items-center gap-0.5">
                  <Flame className="h-3 w-3" />{streak}d
                </span>
              </div>
            </div>
          </div>
          <div className="w-28 h-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniScatterData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <Line type="monotone" dataKey="v" stroke="#1157CF" className="stroke-[#1157CF] dark:stroke-[#5B93EE]" strokeWidth={2} dot={{ r: 3, fill: "#1157CF", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">

          {/* Exam Details card */}
          <div className="bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex flex-col transition-colors">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Exam Details</h3>
            </div>
            {featuredExam ? (
              <>
                <p className="text-[11px] text-[#1157CF] dark:text-[#5B93EE] font-bold mb-3">
                  {featuredExam.examType || "Mock"} · {featuredExam.status === "published" ? "Available" : "Upcoming"}
                </p>
                {/* 3 metric chips */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Duration", val: `${featuredExam.duration}m` },
                    { label: "Questions", val: featuredExam.questions?.length || featuredExam.questionCount || "—" },
                    { label: "Marks", val: featuredExam.totalMarks || "—" },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-2 text-center">
                      <p className="text-sm font-black text-slate-800 dark:text-white">{val}</p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {/* Student info row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#1157CF] to-[#5B93EE] flex items-center justify-center text-white font-black text-sm shadow-sm">
                      {currentUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 font-medium">Batch {currentUser.batch || "N/A"}</p>
                    </div>
                  </div>
                  <Link
                    href="/student/exams"
                    className="h-9 w-9 rounded-full bg-[#1157CF] dark:bg-[#1157CF] flex items-center justify-center hover:bg-[#0D46A8] dark:hover:bg-[#0D46A8] transition-colors shadow-sm"
                  >
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 text-xs text-center">
                <BookOpen className="h-8 w-8 mb-2 text-slate-400 mx-auto" />
                No exams available yet
              </div>
            )}
          </div>

          {/* Radial gauge card */}
          <div className="bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex flex-col items-center transition-colors">
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Score Gauge</h3>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-full mb-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-800 inline-block" />
                Avg Score
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1157CF] dark:bg-[#5B93EE] inline-block" />
                Your Score
              </span>
            </div>
            <RadialGauge value={Math.round(avgScore)} max={100} size={160} />
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="flex flex-col gap-4">

          {/* Exam Status card */}
          <div className="bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Exam Status</h3>
              <Link href="/student/exams" className="text-xs font-bold text-[#1157CF] dark:text-[#5B93EE] flex items-center gap-0.5 hover:underline">
                View more <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {featuredExam ? (
              <div className="flex gap-4">
                {/* Blue "ticket" block */}
                <div className="w-40 shrink-0 bg-[#1157CF] dark:bg-[#1157CF] rounded-xl p-4 flex flex-col items-center justify-center text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-wider opacity-80">Start</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                    <span className="text-xs font-black uppercase tracking-wider opacity-80">End</span>
                  </div>
                  <div className="text-center mb-3">
                    <BookOpen className="h-8 w-8 mx-auto mb-1 opacity-80" />
                    <p className="text-[10px] font-bold opacity-70">{featuredExam.duration} mins</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                    <div className="bg-white rounded-full h-1.5 w-[30%]" />
                  </div>
                  <p className="text-[10px] font-bold mt-1.5 opacity-80">Ready to start</p>
                </div>

                {/* Right: exam ID + status timeline */}
                <div className="flex-1">
                  <p className="text-base font-black text-slate-900 dark:text-white mb-3 truncate">#{featuredExam._id?.slice(-8).toUpperCase() || "EXAM0001"}</p>
                  <StatusTracker exam={featuredExam} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <BookOpen className="h-8 w-8 mb-2 text-slate-400 mx-auto" />
                No exams scheduled
              </div>
            )}

            {/* Bottom: progress row */}
            {featuredExam && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9">
                    <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-slate-200 dark:stroke-slate-800" />
                      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                        className="stroke-[#1157CF] dark:stroke-[#5B93EE]"
                        strokeDasharray={`${2 * Math.PI * 15 * 0.3} ${2 * Math.PI * 15}`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700 dark:text-slate-300">30%</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ready</span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium capitalize">{featuredExam.examType || "Mock"} Exam</span>
              </div>
            )}
          </div>

          {/* Featured exam promo card */}
          <div className="bg-[#1157CF] dark:bg-[#1157CF] rounded-2xl p-5 flex gap-4 relative overflow-hidden shadow-md">
            {/* Decorative circle */}
            <div className="absolute -right-8 -bottom-8 h-36 w-36 rounded-full bg-white/10" />
            <div className="absolute -right-2 -top-6 h-24 w-24 rounded-full bg-white/5" />

            <div className="flex-1 z-10">
              <h3 className="text-base font-black text-white leading-snug mb-1">
                {featuredExam?.name || "MedAssess Mock Exam"}
              </h3>
              <p className="text-[11px] text-blue-200 dark:text-blue-300 mb-3">
                {featuredExam?.examType || "Clinical"} · Practice Series
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { label: "Questions", val: featuredExam?.questions?.length || featuredExam?.questionCount || "—" },
                  { label: "Load limit", val: `${featuredExam?.totalMarks || "—"} marks` },
                  { label: "Duration", val: `${featuredExam?.duration || "—"} min` },
                  { label: "Pass marks", val: `${featuredExam?.passingScore || "—"}%` },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-[10px] text-blue-300 dark:text-blue-400 font-medium">{label}</p>
                    <p className="text-xs font-black text-white">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side icon */}
            <div className="shrink-0 z-10 flex flex-col items-center justify-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <button className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                </button>
                <button className="h-7 w-7 rounded-lg bg-[#0D46A8] flex items-center justify-center hover:bg-[#0B3C8A] transition-colors">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — full-height "map" equivalent */}
        <div className="bg-white dark:bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col transition-colors" style={{ minHeight: "440px" }}>
          <div className="p-5 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Leaderboard</h3>
          </div>

          {/* Leaderboard body */}
          <div className="flex-1 relative bg-slate-50 dark:bg-slate-900/10 overflow-hidden">
            {/* Faint grid lines */}
            <div className="absolute inset-0 opacity-100 dark:opacity-40" style={{
              backgroundImage: "linear-gradient(rgba(229, 231, 235, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.4) 1px, transparent 1px)",
              backgroundSize: "28px 28px"
            }} />

            {/* Content */}
            <div className="relative z-10 p-4 flex flex-col gap-3 h-full">
              {/* Current user position badge */}
              <div className="bg-[#1157CF] dark:bg-[#1157CF] text-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-md w-fit">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-black">Your Rank</span>
              </div>

              {/* Rank list */}
              <div className="flex flex-col gap-2 mt-1">
                {[
                  { name: currentUser.name, score: avgScore, rank: 1, isYou: true },
                  { name: "Top Student", score: Math.min(avgScore + 10, 100), rank: 2 },
                  { name: "Peer A", score: Math.max(avgScore - 5, 0), rank: 3 },
                  { name: "Peer B", score: Math.max(avgScore - 12, 0), rank: 4 },
                  { name: "Peer C", score: Math.max(avgScore - 18, 0), rank: 5 },
                ].map((item) => (
                  <div key={item.rank}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border shadow-sm transition-colors ${
                      item.isYou 
                        ? "bg-[#1157CF] border-[#0D46A8] text-white" 
                        : "bg-white dark:bg-[#1C1D29]/40 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className={`text-[11px] font-black w-5 text-center ${item.isYou ? "text-blue-250" : "text-slate-400 dark:text-slate-500"}`}>
                      #{item.rank}
                    </span>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      item.isYou ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs font-bold flex-1 truncate ${item.isYou ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                      {item.isYou ? "You" : item.name}
                    </span>
                    <span className={`text-xs font-black shrink-0 ${item.isYou ? "text-blue-250" : "text-slate-500 dark:text-slate-400"}`}>
                      {Math.round(item.score)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom coordinates-style display */}
              <div className="mt-auto pt-2 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-550">
                <span>Batch {currentUser.batch || "N/A"}</span>
                <Link href="/student/leaderboard" className="text-[#1157CF] dark:text-[#5B93EE] hover:underline flex items-center gap-0.5">
                  Full board <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom zoom-like controls */}
          <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-605 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-base font-bold">+</button>
              <button className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-605 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-base font-bold">−</button>
            </div>
            <Link href="/student/leaderboard" className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-605 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 border-t-[#1157CF] rounded-full animate-spin" /></div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
