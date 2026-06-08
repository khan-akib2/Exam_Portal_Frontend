"use client";

import { useEffect, useState } from "react";
import { Bell, Clock, User, AlertCircle, RefreshCw, Volume2 } from "lucide-react";

export default function StudentAnnouncementsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getTypeStyle = (type) => {
    if (type === "exam_alert") return "border-l-4 border-l-teal-600 bg-white border-slate-200";
    if (type === "maintenance") return "border-l-4 border-l-amber-500 bg-amber-50/5 border-slate-200";
    return "border-l-4 border-l-indigo-600 bg-white border-slate-205";
  };

  const getBadgeStyle = (type) => {
    if (type === "exam_alert") return "bg-teal-50 border-teal-150 text-teal-750";
    if (type === "maintenance") return "bg-amber-50 border-amber-200 text-amber-750 animate-pulse";
    return "bg-indigo-50 border-indigo-150 text-indigo-750";
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 border border-teal-150 shadow-3xs">
          <Bell className="h-5.5 w-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500">Stay updated with course mock papers, maintenance updates, and general clinical news.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-650" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-450 bg-white border border-slate-200 rounded-2xl">
          <Volume2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-lg text-slate-805">No announcements published yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n._id} 
              className={`premium-card p-6 border transition-all ${getTypeStyle(n.type)} shadow-xs hover:shadow-md rounded-2xl`}
            >
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="space-y-2">
                  <span className={`text-[9px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block ${getBadgeStyle(n.type)}`}>
                    {n.type.replace("_", " ")}
                  </span>
                  <h3 className="text-base font-extrabold tracking-tight text-slate-900">{n.title}</h3>
                </div>
                <div className="text-3xs text-slate-450 flex flex-col text-left sm:text-right font-semibold">
                  <span className="flex items-center gap-1 sm:justify-end text-slate-700">
                    <Clock className="h-3 w-3 text-slate-400" /> {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                  <span className="mt-0.5">{new Date(n.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-650 leading-relaxed mt-4 whitespace-pre-wrap font-medium">
                {n.content}
              </p>

              <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-450 font-bold">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Published by: <span className="text-slate-805">{n.sentBy?.name || "System Staff"}</span>
                </span>
                <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 uppercase text-[9px]">Cohort: {n.targetBatch}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
