"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, User, Clock, Terminal, Globe, UserCheck, ShieldQuestion } from "lucide-react";

export default function AuditLogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/superadmin/audit-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    if (action.includes("DELETED") || action.includes("SUSPENDED")) return "bg-red-500/15 text-red-700 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    if (action.includes("CREATED") || action.includes("PUBLISHED")) return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
    if (action.includes("WARNING") || action.includes("TAB_SWITCH") || action.includes("CHEAT")) return "bg-amber-500/15 text-amber-700 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse";
    return "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]";
  };

  return (
    <div className="space-y-6 animate-fade-in text-left max-w-5xl mx-auto">
      <div className="border-b border-slate-150 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Activity className="h-7 w-7 text-indigo-600" />
          System Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Chronological feed of administrative operations, login actions, and student anti-cheat alerts.</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-slate-50/50 rounded-2xl backdrop-blur-sm border border-slate-100">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <Activity className="h-16 w-16 text-indigo-200 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
          <p className="font-black text-xl text-slate-800">No audit logs recorded yet.</p>
          <p className="text-sm mt-2 text-slate-500 max-w-md mx-auto">Once actions occur across the platform, they will appear here in chronological order.</p>
        </div>
      ) : (
        <div className="glass-panel p-6 md:p-10 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flow-root relative z-10">
            <ul className="-mb-8">
              {logs.map((log, idx) => (
                <li key={log._id} className="group/log">
                  <div className="relative pb-8">
                    {idx !== logs.length - 1 && (
                      <span className="absolute left-6 top-6 -ml-px h-full w-[2px] bg-gradient-to-b from-slate-200 to-transparent group-hover/log:from-indigo-300 transition-colors duration-500" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-6">
                      {/* Log Action Icon Indicator */}
                      <div>
                        <span className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 group-hover/log:scale-110 ${
                          log.action.includes("TAB_SWITCH") || log.action.includes("CHEAT") 
                            ? "bg-amber-50 border-amber-200 text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                            : log.action.includes("DELETE")
                            ? "bg-red-50 border-red-200 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                            : "bg-white border-indigo-100 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover/log:border-indigo-300"
                        }`}>
                          {log.action.includes("TAB_SWITCH") || log.action.includes("CHEAT") ? (
                            <ShieldAlert className="h-6 w-6" />
                          ) : log.action.includes("DELETE") ? (
                            <Terminal className="h-6 w-6" />
                          ) : log.action.includes("CREATE") ? (
                            <UserCheck className="h-6 w-6 text-emerald-600" />
                          ) : (
                            <Terminal className="h-6 w-6" />
                          )}
                        </span>
                      </div>

                      {/* Log Content */}
                      <div className="flex-1 min-w-0 pt-1.5 bg-white/60 hover:bg-white backdrop-blur-sm border border-slate-100 p-5 rounded-2xl shadow-sm transition-all duration-300 group-hover/log:shadow-md group-hover/log:-translate-y-0.5">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="space-y-2">
                            <span className={`inline-block border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                              {log.action.replace(/_/g, " ")}
                            </span>
                            <p className="text-sm font-bold text-slate-800 leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                          <div className="text-left md:text-right text-[10px] text-slate-500 whitespace-nowrap md:self-start bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <time className="flex items-center md:justify-end gap-1.5 font-bold text-slate-700">
                              <Clock className="h-3.5 w-3.5 text-indigo-400" /> {new Date(log.timestamp).toLocaleTimeString()}
                            </time>
                            <span className="block mt-1 font-bold">{new Date(log.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Metadata Footer */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-3">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <strong className="text-slate-600">Actor:</strong> <span className="text-slate-800 font-bold">{log.user?.name || log.userEmail || "System Engine"}</span> <span className="text-slate-400">({log.user?.role || "Core"})</span>
                          </span>
                          {log.ipAddress && (
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-mono">
                              <Globe className="h-3.5 w-3.5 text-slate-400" />
                              <strong className="text-slate-600 font-sans">IP:</strong> <span className="text-slate-800 font-bold">{log.ipAddress}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
