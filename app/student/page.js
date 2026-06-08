"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Flame, Zap, Award, Trophy, Bell, ChevronRight, 
  HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck,
  BookOpen, Star, RefreshCw, Calendar, TrendingUp
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Get profile from localStorage
        const stored = localStorage.getItem("user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }

        // 2. Fetch weak topics analytics
        const weakRes = await fetch("/api/analytics/weak-topics", { headers });
        const weakData = await weakRes.json();
        if (weakRes.ok) setWeakTopics(weakData.analytics || []);

        // 3. Fetch leaderboard
        const leaderRes = await fetch("/api/leaderboard", { headers });
        const leaderData = await leaderRes.json();
        if (leaderRes.ok) setLeaderboard((leaderData.leaderboard || []).slice(0, 5));

        // 4. Fetch available exams
        const examsRes = await fetch("/api/exams", { headers });
        const examsData = await examsRes.json();
        if (examsRes.ok) setExams(examsData.exams || []);

        // 5. Fetch announcements
        const announceRes = await fetch("/api/notifications", { headers });
        const announceData = await announceRes.json();
        if (announceRes.ok) setNotifications((announceData.notifications || []).slice(0, 3));

        // 6. Fetch stats
        const statsRes = await fetch("/api/analytics/stats", { headers });
        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData.stats);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-slate-500">Preparing clinical command dashboard...</p>
        </div>
      </div>
    );
  }

  // XP & Level calculations
  const xp = stats?.xp || 0;
  const streak = stats?.streak || 0;
  
  const levelMap = {
    Intern: { min: 0, max: 200, next: "Resident", bg: "bg-blue-500/10 text-blue-600 border-blue-200", badge: "Intern", iconColor: "text-blue-500" },
    Resident: { min: 200, max: 500, next: "Senior Resident", bg: "bg-teal-500/10 text-teal-600 border-teal-200", badge: "Resident", iconColor: "text-teal-500" },
    "Senior Resident": { min: 500, max: 1000, next: "Consultant", bg: "bg-indigo-500/10 text-indigo-600 border-indigo-200", badge: "Senior Resident", iconColor: "text-indigo-500" },
    Consultant: { min: 1000, max: 2000, next: "Master", bg: "bg-pink-500/10 text-pink-600 border-pink-200", badge: "Consultant", iconColor: "text-pink-500" },
    Master: { min: 2000, max: 5000, next: "Max Tier", bg: "bg-amber-500/10 text-amber-600 border-amber-200", badge: "Master Specialist", iconColor: "text-amber-500" }
  };

  let levelName = "Intern";
  if (xp >= 2000) levelName = "Master";
  else if (xp >= 1000) levelName = "Consultant";
  else if (xp >= 500) levelName = "Senior Resident";
  else if (xp >= 200) levelName = "Resident";

  const levelInfo = levelMap[levelName];
  const levelXpMin = levelInfo.min;
  const levelXpMax = levelInfo.max;
  const range = levelXpMax - levelXpMin;
  const progressInLevel = xp - levelXpMin;
  const progressPercent = levelName === "Master" ? 100 : Math.min(Math.round((progressInLevel / range) * 100), 100);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Gamified Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-teal-50/40 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-32 w-32 rounded-full bg-blue-50/30 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${levelInfo.bg}`}>
                <Award className={`h-3.5 w-3.5 ${levelInfo.iconColor}`} />
                {levelInfo.badge}
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-655 border border-orange-100 px-3 py-1 rounded-full text-xs font-bold timer-pulse-warning">
                  <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  {streak} Day Streak
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, Dr. {currentUser.name}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
              Track your performance stats, review clinical recommendations, and achieve excellence in medical assessment.
            </p>
          </div>

          {/* Radial/Bar XP level controller */}
          <div className="w-full lg:w-72 bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-3 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">XP Progress</span>
              <span className="font-semibold text-slate-500 font-mono">{xp} / {levelXpMax} XP</span>
            </div>
            {/* Custom Bar progress indicator */}
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-teal-650 to-blue-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-3xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>{levelName}</span>
              <span>Next: {levelInfo.next} ({progressPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Total Attempts Card */}
        <div className="premium-card p-5 flex items-center gap-4 bg-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Total Attempts</p>
            <p className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">{stats?.totalExamsAttempted || 0}</p>
          </div>
        </div>

        {/* Average Accuracy Card */}
        <div className="premium-card p-5 flex items-center gap-4 bg-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-655 border border-emerald-105">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Avg Accuracy</p>
            <p className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">{stats?.averageAccuracy || 0}%</p>
          </div>
        </div>

        {/* Total XP Card */}
        <div className="premium-card p-5 flex items-center gap-4 bg-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Zap className="h-5.5 w-5.5 fill-amber-500/20 text-amber-500" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">XP Earned</p>
            <p className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">{stats?.xp || 0} XP</p>
          </div>
        </div>

        {/* Streak Card */}
        <div className="premium-card p-5 flex items-center gap-4 bg-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-655 border border-orange-100 relative">
            <Flame className="h-5.5 w-5.5 fill-orange-500 text-orange-500" />
            {streak > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 animate-ping" />}
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Active Streak</p>
            <p className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">{stats?.streak || 0} Days</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Analysis, Standings & Announcements */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subject Performance Analysis (Col span 2 on large screens) */}
        <div className="premium-card p-6 lg:col-span-2 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Subject Accuracy & Performance
            </h3>
            <span className="text-3xs text-slate-400 font-semibold uppercase tracking-wider">Visual analytics</span>
          </div>
          
          {weakTopics.length === 0 ? (
            <div className="text-center text-slate-400 py-24 text-xs">
              Complete mock exams to compile subject performance metrics.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={weakTopics} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 'auto']} />
                  <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '12px' }}
                    itemStyle={{ color: '#0ea5e9' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="correct" fill="#0f766e" stackId="a" name="Correct" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="incorrect" fill="#ef4444" stackId="a" name="Wrong" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Announcements Widget */}
        <div className="premium-card p-6 bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Bell className="h-4.5 w-4.5 text-teal-600" />
              Cohort Updates
            </h3>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs">No notifications or exam schedule releases.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n._id} className="text-left text-xs bg-slate-50 hover:bg-slate-100/70 border border-slate-100 hover:border-slate-200/60 rounded-xl p-3 transition-colors">
                    <span className="font-bold text-slate-800 block mb-1">{n.title}</span>
                    <span className="text-slate-500 leading-relaxed block line-clamp-2">{n.content}</span>
                    <span className="text-4xs font-semibold text-slate-400 block mt-2">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link href="/student/announcements" className="text-xs font-bold text-teal-600 hover:text-teal-800 mt-4 flex items-center gap-0.5 justify-end group">
            <span>View All Releases</span>
            <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Leaderboard Standings */}
      <div className="premium-card p-6 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10" />
            Top Performers Standings
          </h3>
          <span className="text-3xs text-slate-400 font-semibold uppercase tracking-wider">Active Cohort</span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center text-slate-400 py-12 text-xs">
            No rankings calculated yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {leaderboard.map((student, idx) => {
              const isMe = student.name === currentUser.name;
              return (
                <div 
                  key={student._id} 
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                    isMe 
                      ? "bg-teal-50/30 border-teal-355 shadow-sm" 
                      : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-2xs ${
                      idx === 0 ? "bg-amber-100 text-amber-800" :
                      idx === 1 ? "bg-slate-200 text-slate-800" :
                      idx === 2 ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider">{student.batch}</span>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-900 block truncate text-xs">{student.name} {isMe && "(You)"}</span>
                    <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5 block">{student.level}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3">
                    <span className="text-xs font-black text-teal-700">{student.xp} XP</span>
                    {student.streak > 0 && (
                      <span className="text-3xs text-orange-655 font-bold flex items-center gap-0.5">
                        <Flame className="h-3 w-3 fill-orange-500 text-orange-500" /> {student.streak}d
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Exams Shortcut */}
      <div className="premium-card p-6 bg-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Assigned Simulative Examinations</h3>
            <p className="text-3xs text-slate-400 font-medium mt-0.5">Mock exams available for your batch ({currentUser.batch})</p>
          </div>
          <Link href="/student/exams" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-0.5">
            <span>Browse All Exams</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="text-center text-slate-400 py-12 text-xs border border-dashed border-slate-200 rounded-xl">
            No exams published for your batch ({currentUser.batch}) at this moment.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.slice(0, 3).map((exam) => (
              <div key={exam._id} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50 flex flex-col justify-between hover:border-slate-350 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-4xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">{exam.examType}</span>
                    <span className="text-4xs text-red-500 font-bold uppercase tracking-wider">{exam.negativeMarking > 0 ? `-${exam.negativeMarking} Penalty` : "No Penalty"}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{exam.name}</h4>
                  <p className="text-2xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{exam.description || "Simulated clinical paper."}</p>
                </div>
                <div className="flex items-center justify-between mt-5 border-t border-slate-200/60 pt-3">
                  <span className="text-2xs text-slate-500 font-bold">Duration: {exam.duration} mins</span>
                  <Link 
                    href={`/student/exams`} 
                    className="inline-flex items-center gap-0.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-2xs font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/10 transition-colors"
                  >
                    <span>Attempt Exam</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
