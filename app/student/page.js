"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Bell, ChevronRight, Activity, BookOpen, Clock, AlertCircle, FileText, BarChart3, ChevronUp
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line
} from "recharts";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Mock performance trend data
  const performanceTrend = [
    { date: 'Week 1', score: 65 },
    { date: 'Week 2', score: 68 },
    { date: 'Week 3', score: 74 },
    { date: 'Week 4', score: 72 },
    { date: 'Week 5', score: 81 },
    { date: 'Week 6', score: 85 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const stored = localStorage.getItem("user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }

        const weakRes = await fetch("/api/analytics/weak-topics", { headers });
        const weakData = await weakRes.json();
        if (weakRes.ok) setWeakTopics(weakData.analytics || []);

        const examsRes = await fetch("/api/exams", { headers });
        const examsData = await examsRes.json();
        if (examsRes.ok) setExams(examsData.exams || []);

        const announceRes = await fetch("/api/notifications", { headers });
        const announceData = await announceRes.json();
        if (announceRes.ok) setNotifications((announceData.notifications || []).slice(0, 3));

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
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
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
      className="space-y-8 text-left max-w-[1200px] mx-auto"
    >
      {/* Professional Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#1157CF]/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1157CF]/20 bg-[#1157CF]/5 text-xs font-bold text-[#1157CF] uppercase tracking-wider mb-2">
            <Activity className="h-3.5 w-3.5" />
            <span>Active Candidate</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome, Dr. {currentUser.name}
          </h1>
          <p className="text-sm text-slate-500 max-w-xl font-medium">
            Clinical Examination Hub. Review upcoming assessments, track performance metrics, and analyze subject proficiency.
          </p>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-6 relative z-10 bg-slate-50 border border-slate-200 rounded-xl p-4 shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Accuracy</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats?.averageAccuracy || 0}%</p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exams Completed</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats?.totalExamsAttempted || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column (2/3): Upcoming Exams & Performance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Exams */}
          <div className="premium-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 uppercase tracking-wider">Scheduled Assessments</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Mock and Live exams for Batch {currentUser.batch}</p>
              </div>
              <Link href="/student/exams" className="text-xs font-bold text-[#1157CF] hover:text-[#0D46A8] flex items-center gap-1">
                View Schedule <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {exams.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                <FileText className="h-8 w-8 mb-3 text-slate-300" />
                <p className="text-sm font-medium">No assessments currently scheduled.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.slice(0, 3).map((exam) => (
                  <div key={exam._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 h-10 w-10 shrink-0 bg-[#1157CF]/10 text-[#1157CF] rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase tracking-wider">{exam.examType}</span>
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.duration} mins</span>
                        </div>
                        <h4 className="font-bold text-slate-900">{exam.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{exam.description || "Simulated clinical paper."}</p>
                      </div>
                    </div>
                    <Link 
                      href={`/student/exams`} 
                      className="shrink-0 inline-flex justify-center items-center gap-1.5 rounded-lg bg-[#1157CF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D46A8] transition-colors shadow-sm"
                    >
                      Enter Examination
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Trend Chart */}
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[15px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#1157CF]" /> Performance Trend
              </h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Last 6 Weeks</span>
            </div>
            
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} domain={['dataMin - 10', 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#1157CF" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#1157CF' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column (1/3): Analytics & Updates */}
        <div className="space-y-6 flex flex-col">
          
          {/* Subject Proficiency */}
          <div className="premium-card p-6 flex-1 flex flex-col">
            <h2 className="text-[15px] font-bold text-slate-900 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">
              Proficiency Analysis
            </h2>
            
            {weakTopics.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-slate-400 text-xs">
                Complete more assessments to generate subject analytics.
              </div>
            ) : (
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weakTopics} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} width={80} />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                    />
                    <Bar dataKey="correct" stackId="a" fill="#0F7B3E" radius={[0, 0, 0, 0]} barSize={12} />
                    <Bar dataKey="incorrect" stackId="a" fill="#C0152A" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0F7B3E]"/> Correct</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#C0152A]"/> Incorrect</div>
                </div>
              </div>
            )}
          </div>

          {/* Institutional Updates */}
          <div className="premium-card p-6 bg-slate-900 text-white">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <Bell className="h-4 w-4 text-blue-400" />
              <h2 className="text-[15px] font-bold uppercase tracking-wider text-white">
                Official Updates
              </h2>
            </div>
            
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No new announcements.
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n._id} className="group cursor-pointer">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors">{n.title}</span>
                      <span className="text-[10px] font-bold text-slate-500 tracking-wider">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
