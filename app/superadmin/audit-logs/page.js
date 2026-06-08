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
    if (action.includes("DELETED") || action.includes("SUSPENDED")) return "bg-red-500/10 text-red-750 border-red-500/20";
    if (action.includes("CREATED") || action.includes("PUBLISHED")) return "bg-emerald-500/10 text-emerald-750 border-emerald-500/20";
    if (action.includes("WARNING") || action.includes("TAB_SWITCH") || action.includes("CHEAT")) return "bg-amber-500/10 text-amber-750 border-amber-500/20 animate-pulse";
    return "bg-indigo-500/10 text-indigo-755 border-indigo-500/20";
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="border-b border-slate-150 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Logs</h1>
        <p className="text-sm text-slate-500">Chronological feed of administrative operations, login actions, and student anti-cheat alerts.</p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-650" />
        </div>
      ) : logs.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-500 bg-white border border-slate-200">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-805">No audit logs recorded yet.</p>
        </div>
      ) : (
        <div className="premium-card p-6 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flow-root">
            <ul className="-mb-8">
              {logs.map((log, idx) => (
                <li key={log._id}>
                  <div className="relative pb-8">
                    {idx !== logs.length - 1 && (
                      <span className="absolute left-5 top-5 -ml-px h-[calc(100%+0.5rem)] w-0.5 bg-slate-150" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-4">
                      {/* Log Action Icon Indicator */}
                      <div>
                        <span className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${
                          log.action.includes("TAB_SWITCH") || log.action.includes("CHEAT") 
                            ? "bg-amber-50 border-amber-200 text-amber-600 shadow-3xs" 
                            : log.action.includes("DELETE")
                            ? "bg-red-50 border-red-200 text-red-600 shadow-3xs"
                            : "bg-slate-50 border-slate-200 text-slate-500 shadow-3xs"
                        }`}>
                          {log.action.includes("TAB_SWITCH") || log.action.includes("CHEAT") ? (
                            <ShieldAlert className="h-5 w-5" />
                          ) : log.action.includes("DELETE") ? (
                            <Terminal className="h-4.5 w-4.5 text-red-550" />
                          ) : log.action.includes("CREATE") ? (
                            <UserCheck className="h-4.5 w-4.5 text-emerald-600" />
                          ) : (
                            <Terminal className="h-4.5 w-4.5" />
                          )}
                        </span>
                      </div>

                      {/* Log Content */}
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="space-y-1">
                            <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-1 ${getActionColor(log.action)}`}>
                              {log.action.replace(/_/g, " ")}
                            </span>
                            <p className="text-xs font-bold text-slate-800 leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                          <div className="text-left md:text-right text-3xs text-slate-500 whitespace-nowrap md:self-start">
                            <time className="flex items-center md:justify-end gap-1 font-bold text-slate-700">
                              <Clock className="h-3 w-3 text-slate-400" /> {new Date(log.timestamp).toLocaleTimeString()}
                            </time>
                            <span className="block mt-0.5 font-bold">{new Date(log.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Metadata Footer */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-3xs text-slate-450 font-bold border-t border-slate-50 pt-2.5">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-450" />
                            <strong>Actor:</strong> <span className="text-slate-700">{log.user?.name || log.userEmail || "System Engine"}</span> ({log.user?.role || "Core"})
                          </span>
                          {log.ipAddress && (
                            <span className="flex items-center gap-1 font-mono">
                              <Globe className="h-3 w-3 text-slate-400" />
                              <strong>IP:</strong> <span className="text-slate-600">{log.ipAddress}</span>
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
