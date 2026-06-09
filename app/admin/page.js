"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, FileText, FileQuestion, ArrowUp, ArrowDown,
  Building2, MoreHorizontal, Calendar, Activity, 
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
  const [institutions, setInstitutions] = useState([]);
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
          
          setInstitutions([
            { id: 1, name: "IIM Medical", tier: "Premium", students: 1250, exams: 12, avgScore: 76, lastActive: "2 hours ago" },
            { id: 2, name: "AIIMS Board", tier: "Enterprise", students: 4890, exams: 45, avgScore: 68, lastActive: "15 mins ago" },
            { id: 3, name: "NMC Certified", tier: "Standard", students: 850, exams: 8, avgScore: 54, lastActive: "1 day ago" }
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

  const getScoreColor = (score) => {
    if (score >= 75) return "#0F7B3E";
    if (score >= 60) return "#B45309";
    return "#C0152A";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 text-left w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mission Control</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Platform overview and real-time metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/exams/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1157CF] text-white text-xs font-bold rounded-lg hover:bg-[#0D46A8] transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> New Exam
          </Link>
          <Link href="/admin/questions/upload" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <UploadCloud className="h-4 w-4 text-slate-500" /> Import PDF
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="premium-card p-5 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Total Active Students</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.activeUsers || 0}</div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[11px] text-[#0F7B3E] font-bold bg-[#DCFAED] px-2 py-0.5 rounded">
                <ArrowUp className="w-3 h-3" /> <span>3.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-5 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Exams Conducted</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.totalExams || 0}</div>
             <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[11px] text-[#0F7B3E] font-bold bg-[#DCFAED] px-2 py-0.5 rounded">
                <ArrowUp className="w-3 h-3" /> <span>12.4%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-5 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Questions in Bank</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.totalQuestions || 0}</div>
             <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                 <span>+240 this week</span>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-5 relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Avg. Monthly Score</div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.averageScore || 0}%</div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[11px] text-[#C0152A] font-bold bg-[#FDEAEC] px-2 py-0.5 rounded">
                <ArrowDown className="w-3 h-3" /> <span>1.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left: Recent Exams */}
        <div className="lg:col-span-7 premium-card flex flex-col overflow-hidden bg-white">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Examinations</h3>
            <Link href="/admin/exams" className="text-xs font-bold text-[#1157CF] flex items-center gap-1 hover:text-[#0D46A8] transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Exam Name</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Type</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Avg Score</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentExams.length > 0 ? (
                  recentExams.map((exam, i) => (
                    <tr key={exam._id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{exam.name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">{exam.examType || 'Standard'}</td>
                      <td className="px-5 py-3.5 text-sm font-black text-slate-700">68.4%</td>
                      <td className="px-5 py-3.5">
                        {exam.status === 'published' ? (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-[#0F7B3E] bg-[#DCFAED] uppercase tracking-wider border border-[#0F7B3E]/20">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#0F7B3E]" /> Live
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 bg-slate-100 uppercase tracking-wider border border-slate-200">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Draft
                           </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
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
          
          <div className="premium-card p-5 flex-1 min-h-[280px] flex flex-col bg-white">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Score Distribution</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600 }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={600}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.range === '61-80' ? '#1157CF' : '#B8D0FA'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="premium-card bg-white flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Upcoming Schedule</h3>
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100 p-2">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                  <div className="w-[3px] h-[32px] rounded-full bg-[#1157CF] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1157CF] transition-colors">{exam.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{exam.date}</p>
                  </div>
                  <div className="shrink-0 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-[11px] text-slate-700 font-bold">
                    {exam.students} Students
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom: Institutions Table */}
      <div className="premium-card overflow-hidden bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Institution Performance</h3>
          <button className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 rounded px-3 py-1.5 transition-colors shadow-sm">
            Export Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Institution</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Plan</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Active Students</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Exams</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Avg Score</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1157CF]/10 text-[#1157CF] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{inst.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${inst.tier === 'Premium' ? 'bg-[#FDF6E3] text-[#C9A227] border-[#C9A227]/30' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {inst.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 font-black">{inst.students.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 font-black">{inst.exams}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${inst.avgScore}%`,
                            backgroundColor: getScoreColor(inst.avgScore)
                          }} 
                        />
                      </div>
                      <span className="text-sm font-black text-slate-900">{inst.avgScore}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs font-medium text-slate-500">{inst.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
