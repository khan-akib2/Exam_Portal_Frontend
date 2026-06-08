"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, FileText, FileQuestion, CheckCircle2, 
  BarChart4, ArrowRight, Plus, FolderOpen, Calendar, 
  Sparkles, CheckCircle, AlertCircle, RefreshCw, LogOut, Clock, Target, Award
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome back");
  const [currentDateString, setCurrentDateString] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      // Generate Greeting based on time
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good morning");
      else if (hour < 17) setGreeting("Good afternoon");
      else setGreeting("Good evening");

      // Format current date
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDateString(new Date().toLocaleDateString('en-US', options));

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
          setTrendData(data.trendData || []);
          setRecentExams(data.recentExams || []);
          setRecentUsers(data.recentUsers || []);
          setRecentUploads(data.recentUploads || []);
        }
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <span className="text-sm font-semibold text-slate-500">Loading control center...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 text-left"
    >
      {/* Welcome Header */}
      <div className="bg-[#0F172A] p-4 md:p-8 rounded-2xl text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Visual mesh lights */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-[#2E76C0]/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-12 w-64 h-64 rounded-full bg-[#00E5FF]/10 blur-3xl" />

        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-extrabold text-[#00E5FF] uppercase tracking-widest block">{currentDateString}</span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{greeting}, Admin</h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Configure assessments, manage cohort data, review booklet ingestions, and audit student response logs from your central panel.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center relative z-10">
          <Link
            href="/admin/questions?tab=extract"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2E76C0] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#2765A4] shadow-md shadow-[#2E76C0]/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Booklet</span>
          </Link>
          <Link
            href="/admin/exams"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <span>Create Exam</span>
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card 1 */}
        <motion.div whileHover={{ y: -2 }} className="premium-card p-4 md:p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enrolled Students</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats?.totalUsers || 0}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/20">
              {stats?.activeUsers || 0} Active Accounts
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F7FB] text-[#2E76C0] border border-[#E6EEF7] shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </motion.div>

        {/* Stat Card 2 */}
        <motion.div whileHover={{ y: -2 }} className="premium-card p-4 md:p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total MCQs Pool</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats?.totalQuestions || 0}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-[#2E76C0] bg-[#2E76C0]/10 px-2 py-0.5 rounded-md border border-[#2E76C0]/20">
              Extracted Questions
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F7FB] text-[#2E76C0] border border-[#E6EEF7] shrink-0">
            <FileQuestion className="h-5 w-5" />
          </div>
        </motion.div>

        {/* Stat Card 3 */}
        <motion.div whileHover={{ y: -2 }} className="premium-card p-4 md:p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Exams</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats?.totalExams || 0}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-[#2E76C0] bg-[#2E76C0]/10 px-2 py-0.5 rounded-md border border-[#2E76C0]/20">
              Assigned Papers
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F7FB] text-[#2E76C0] border border-[#E6EEF7] shrink-0">
            <FileText className="h-5 w-5" />
          </div>
        </motion.div>

        {/* Stat Card 4 */}
        <motion.div whileHover={{ y: -2 }} className="premium-card p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submitted Papers</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{stats?.completedExams || 0}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/20">
              Completed attempts
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Charts & Analytical Breakdown */}
      <div className="grid gap-6 md:grid-cols-5 items-stretch">
        {/* Submissions Trend line chart */}
        <div className="premium-card p-4 md:p-6 md:col-span-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Activity Tracking</span>
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Daily Exam Attempt Submissions (Last 7 Days)
            </h3>
          </div>
          {trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs italic">
              No submissions tracked over the last 7 days.
            </div>
          ) : (
            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="submissionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E76C0" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2E76C0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F7FB" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255,255,255,0.95)", 
                      borderRadius: "12px", 
                      border: "1px solid #E5E7EB",
                      fontSize: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }} 
                  />
                  <Area type="monotone" dataKey="submissions" stroke="#2E76C0" strokeWidth={3} fillOpacity={1} fill="url(#submissionsGrad)" name="Submissions" />
                  <Line type="monotone" dataKey="avgScore" stroke="#00E5FF" strokeWidth={2} name="Avg Score (%)" dot={{ r: 4, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Aggregate Circular Progress / Percentages */}
        <div className="premium-card p-4 md:p-6 md:col-span-2 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
            Overall Student Performance Metrics
          </h3>
          <div className="flex flex-col justify-center divide-y divide-slate-100 flex-1">
            {/* Avg Score */}
            <div className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-xl bg-[#2E76C0]/10 border border-[#2E76C0]/20 flex items-center justify-center font-black text-[#2E76C0] text-xs shrink-0">
                {stats?.averageScore || 0}%
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Exam Score</span>
                <span className="block text-2xs text-slate-400">Grading percentage across all cohorts</span>
              </div>
            </div>

            {/* Avg Accuracy */}
            <div className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center font-black text-[#00B8CC] text-xs shrink-0">
                {stats?.averageAccuracy || 0}%
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Accuracy Rate</span>
                <span className="block text-2xs text-slate-400">Ratio of correct answers submitted</span>
              </div>
            </div>

            {/* Avg Time */}
            <div className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center font-black text-[#10B981] text-xs shrink-0">
                {stats?.averageTimeTaken ? `${Math.round(stats.averageTimeTaken / 60)}m` : "0m"}
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Duration Taken</span>
                <span className="block text-2xs text-slate-400">Average minutes spent per assessment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent Exams & Students */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Exams */}
        <div className="premium-card p-4 md:p-6 bg-white border border-slate-200 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                Recent Examination Papers
              </h3>
              <Link href="/admin/exams" className="text-[10px] font-bold text-teal-650 hover:underline">
                View All
              </Link>
            </div>

            {recentExams.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs italic">
                No examinations created yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentExams.map((e) => (
                  <div key={e._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{e.name}</strong>
                      <span className="text-[10px] text-slate-450 block mt-0.5">
                        Duration: <strong>{e.duration} mins</strong> | Type: <strong>{e.examType}</strong>
                      </span>
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      e.status === "published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="premium-card p-4 md:p-6 bg-white border border-slate-200 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                Recent Student Enrolments
              </h3>
              <Link href="/admin/students" className="text-[10px] font-bold text-teal-650 hover:underline">
                Manage Users
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs italic">
                No students enrolled yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentUsers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{u.name}</strong>
                      <span className="text-[10px] text-slate-450 block mt-0.5">Email: <span className="font-mono">{u.email}</span></span>
                    </div>
                    <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {u.batch}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Uploads Activity */}
      <div className="premium-card p-4 md:p-6 bg-white border border-slate-200 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-teal-600" />
            PDF Ingestions & Parser Audit Log
          </h3>
          <Link href="/admin/questions?tab=extract" className="text-[10px] font-bold text-teal-650 hover:underline">
            Open Extractor
          </Link>
        </div>

        {recentUploads.length === 0 ? (
          <div className="text-center text-slate-450 py-12 text-xs italic">
            No booklets uploaded yet. Upload clinical PDF mock files inside the Extractor tab.
          </div>
        ) : (
          <div className="overflow-x-auto w-full pb-2">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Booklet Name</th>
                  <th className="p-3.5">MCQs Detected</th>
                  <th className="p-3.5">Auto Approved</th>
                  <th className="p-3.5">Staged For Review</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentUploads.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 truncate max-w-xs">{report.pdfName}</td>
                    <td className="p-3.5 font-mono text-slate-800">{report.parsedCount} Qs</td>
                    <td className="p-3.5 text-emerald-600 font-bold font-mono">+{report.autoApprovedCount}</td>
                    <td className="p-3.5 text-amber-500 font-bold font-mono">-{report.needsReviewCount}</td>
                    <td className="p-3.5 text-slate-400 font-normal">{new Date(report.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
