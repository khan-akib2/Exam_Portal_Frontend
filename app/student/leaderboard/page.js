"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Zap, Medal, Crown } from "lucide-react";

export default function StudentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1157CF]/10 dark:bg-[#1157CF]/20 text-[#1157CF] dark:text-[#5B93EE] border border-blue-200 dark:border-blue-900/30 shadow-3xs">
          <Trophy className="h-5.5 w-5.5 fill-blue-500/10 dark:fill-blue-400/10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Leaderboard Rankings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Global clinical candidates ranked by experience points (XP) accumulated.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center bg-slate-50 dark:bg-transparent">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#1157CF] dark:border-t-[#5B93EE]" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-400 bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-2xl">
          No rankings posted yet. Complete exams to earn XP.
        </div>
      ) : (
        <>
          {/* VISUAL PODIUM FOR TOP 3 */}
          <div className="grid grid-cols-3 gap-3 items-end pt-8 pb-4 max-w-xl mx-auto text-center relative z-10">
            {/* RANK 2 (Silver) - Shown on Left */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center space-y-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-extrabold text-sm shadow-md">
                    {leaderboard[1].name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-450 dark:bg-slate-600 text-[10px] font-black text-white ring-2 ring-white dark:ring-[#070913]">
                    2
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-2xs font-extrabold text-slate-805 dark:text-slate-200 truncate max-w-[80px]">Dr. {leaderboard[1].name.split(' ')[0]}</span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#1157CF] dark:text-[#5B93EE]">
                    <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />
                    {leaderboard[1].xp} XP
                  </span>
                </div>
                {/* Visual Podium Base */}
                <div className="w-full h-16 bg-gradient-to-t from-slate-200/80 to-slate-100 dark:from-[#111322] dark:to-[#0F111E] rounded-t-xl border border-slate-300 dark:border-white/10 border-b-0 shadow-sm flex items-center justify-center">
                  <Medal className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
            )}

            {/* RANK 1 (Gold) - Center Column */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center space-y-2 animate-slide-up z-20">
                <div className="relative">
                  {/* Crown symbol */}
                  <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-600 dark:text-amber-500 fill-amber-500/20 animate-float" />
                  <div className="h-16 w-16 rounded-full border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-800 dark:text-amber-300 font-black text-lg shadow-lg ring-4 ring-amber-500/10 dark:ring-amber-500/5">
                    {leaderboard[0].name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white ring-2 ring-white dark:ring-[#070913] animate-pulse">
                    1
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-black text-slate-900 dark:text-white truncate max-w-[100px]">Dr. {leaderboard[0].name.split(' ')[0]}</span>
                  <span className="inline-flex items-center gap-0.5 text-2xs font-bold text-[#1157CF] dark:text-[#5B93EE]">
                    <Zap className="h-3 w-3 fill-amber-400 text-amber-500 animate-pulse" />
                    {leaderboard[0].xp} XP
                  </span>
                </div>
                {/* Visual Podium Base */}
                <div className="w-full h-24 bg-gradient-to-t from-amber-500/20 via-amber-500/5 to-transparent dark:from-[#1E1A0F] dark:to-[#0F111E] rounded-t-xl border border-amber-350 dark:border-amber-500/20 border-b-0 shadow-md flex items-center justify-center relative">
                  <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-500 fill-amber-500/10" />
                </div>
              </div>
            )}

            {/* RANK 3 (Bronze) - Shown on Right */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center space-y-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <div className="relative">
                  <div className="h-11 w-11 rounded-full border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-850 dark:text-orange-300 font-extrabold text-sm shadow-md">
                    {leaderboard[2].name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-black text-white ring-2 ring-white dark:ring-[#070913]">
                    3
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-2xs font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[80px]">Dr. {leaderboard[2].name.split(' ')[0]}</span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#1157CF] dark:text-[#5B93EE]">
                    <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />
                    {leaderboard[2].xp} XP
                  </span>
                </div>
                {/* Visual Podium Base */}
                <div className="w-full h-12 bg-gradient-to-t from-orange-200/80 to-orange-100 dark:from-[#1C160F] dark:to-[#0F111E] rounded-t-xl border border-orange-300 dark:border-orange-500/20 border-b-0 shadow-sm flex items-center justify-center">
                  <Medal className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                </div>
              </div>
            )}
          </div>

          {/* TABLE RANKINGS */}
          <div className="premium-card overflow-hidden bg-white dark:bg-[var(--card)] border border-slate-250 dark:border-white/5 rounded-2xl shadow-xs">
            <div className="overflow-x-auto w-full pb-2">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/30 border-b border-slate-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Candidate Name</th>
                    <th className="px-6 py-4">Cohort</th>
                    <th className="px-6 py-4 text-right">XP Accumulations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-750 dark:text-slate-300">
                  {leaderboard.map((student, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr 
                         key={student._id} 
                         className={`transition-all hover:bg-slate-50/40 dark:hover:bg-white/[0.02] ${
                          rank === 1 ? "bg-amber-50/5 dark:bg-amber-950/5" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-300">
                          {rank === 1 ? (
                            <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-black text-2xs animate-pulse">
                              1
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-2xs">
                              2
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 text-orange-850 dark:text-orange-300 font-black text-2xs">
                              3
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px]">
                              {rank}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{student.name}</span>
                          {student.streak > 2 && (
                            <span className="inline-flex items-center gap-0.5 text-orange-600 dark:text-orange-550 font-extrabold bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/30 px-2.5 py-0.5 rounded-full text-[9px]">
                              <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                              {student.streak} Days
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{student.batch}</td>
                        <td className="px-6 py-4 text-right font-black text-[#1157CF] dark:text-[#5B93EE] font-mono text-sm">
                          <span className="flex items-center justify-end gap-1">
                            <Zap className="h-4 w-4 fill-amber-400 text-amber-500 shrink-0" />
                            {student.xp} XP
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
