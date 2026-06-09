"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, FileText, FileQuestion, ArrowUp, ArrowDown,
  MoreHorizontal, Calendar, Activity, 
  BarChart3, UploadCloud, Plus, Settings, ChevronRight
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const scoreDistribution = [
    { range: '0-20', count: 12 },
    { range: '21-40', count: 45 },
    { range: '41-60', count: 120 },
    { range: '61-80', count: 210 },
    { range: '81-100', count: 85 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
          setTrendData(data.trendData || []);
          setRecentExams(data.recentExams || []);
          
          setUpcomingExams([
            { id: 1, name: "Cardiology Finals", date: "Tomorrow, 09:00 AM", students: 145, type: "Clinical" },
            { id: 2, name: "Neurology Mock", date: "Oct 15, 02:00 PM", students: 89, type: "Mock" },
            { id: 3, name: "Basic Anatomy", date: "Oct 18, 10:00 AM", students: 312, type: "Foundation" }
          ]);
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
      <div className="flex h-[80vh] items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1157CF] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 text-left w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 leading-normal">
            <span className="p-2 bg-blue-50 text-[#1157CF] rounded-xl shadow-sm border border-blue-100">
              <Activity className="h-6 w-6" />
            </span>
            Mission Control
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2">Platform overview and real-time metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/exams/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1157CF] to-blue-500 text-white text-xs font-black rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all active:scale-95">
            <Plus className="h-4 w-4" /> New Exam
          </Link>
          <Link href="/admin/questions/upload" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl hover:bg-slate-50 hover:shadow-md transition-all active:scale-95">
            <UploadCloud className="h-4 w-4 text-[#1157CF]" /> Import PDF
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/10 transition-colors duration-500" />
          <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3 relative z-10">Total Active Students</div>
          <div className="flex items-end justify-between relative z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats?.activeUsers || 0}</div>
            <div className="flex flex-col items-end mb-1">
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50 shadow-sm">
                <ArrowUp className="w-3 h-3" /> <span>3.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-500" />
          <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3 relative z-10">Exams Conducted</div>
          <div className="flex items-end justify-between relative z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats?.totalExams || 0}</div>
             <div className="flex flex-col items-end mb-1">
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50 shadow-sm">
                <ArrowUp className="w-3 h-3" /> <span>12.4%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
          <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3 relative z-10">Questions in Bank</div>
          <div className="flex items-end justify-between relative z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats?.totalQuestions || 0}</div>
             <div className="flex flex-col items-end mb-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                 <span>+240 this week</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors duration-500" />
          <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3 relative z-10">Avg. Monthly Score</div>
          <div className="flex items-end justify-between relative z-10">
            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats?.averageScore || 0}%</div>
            <div className="flex flex-col items-end mb-1">
              <div className="flex items-center gap-1 text-[11px] text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/50 shadow-sm">
                <ArrowDown className="w-3 h-3" /> <span>1.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left: Recent Exams */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" /> Recent Examinations
            </h3>
            <Link href="/admin/exams" className="text-xs font-bold text-[#1157CF] flex items-center gap-1 hover:text-[#0D46A8] bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Exam Name</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Type</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Avg Score</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/50">
                {recentExams.length > 0 ? (
                  recentExams.map((exam, i) => (
                    <tr key={exam._id || i} className="hover:bg-white transition-colors group">
                      <td className="px-6 py-4 text-sm font-black text-slate-900 border-l-2 border-transparent group-hover:border-indigo-500">{exam.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded-md">{exam.examType || 'Standard'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-700">68.4%</td>
                      <td className="px-6 py-4">
                        {exam.status === 'published' ? (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black text-emerald-700 bg-emerald-50 uppercase tracking-widest border border-emerald-200">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-600 bg-slate-100 uppercase tracking-widest border border-slate-200">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Draft
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-[#1157CF] hover:bg-blue-50 transition-colors p-2 rounded-xl">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 font-bold">
                      No recent exams found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Analytics */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl flex-1 min-h-[280px] flex flex-col shadow-sm hover:shadow-md transition-shadow relative">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-500" /> Score Distribution
            </h3>
            <div className="flex-1 w-full min-h-[200px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1157CF" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#0B3C94" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorLightBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B8D0FA" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#E6EEF7" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 700 }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1000}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.range === '61-80' ? 'url(#colorBlue)' : 'url(#colorLightBlue)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" /> Upcoming Schedule
              </h3>
            </div>
            <div className="divide-y divide-slate-100 p-3 bg-white/50">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-4 p-3 hover:bg-white rounded-xl transition-all cursor-pointer group shadow-none hover:shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1157CF] to-blue-400 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                    {new Date().getDate() + exam.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-[#1157CF] transition-colors truncate">{exam.name}</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{exam.date}</p>
                  </div>
                  <div className="shrink-0 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 font-black">
                    {exam.students} <span className="text-[10px] text-slate-400 font-bold ml-1">Students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </motion.div>
  );
}
