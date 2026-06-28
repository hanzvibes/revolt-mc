import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, BarChart3, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { parseRuns, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";

function rankBadgeClass(jabatan: string): string {
  const j = jabatan?.toUpperCase();
  if (j === "FOUNDER") return "badge-red";
  if (j === "PRESIDENT") return "badge-yellow";
  if (j === "EXCECUTOR") return "badge-purple";
  if (j === "NEGOSIATOR") return "badge-blue";
  if (j === "LIFE MEMBER") return "badge-cyan";
  if (j === "VIRGIN") return "badge-green";
  if (j === "CAPROS") return "badge-yellow";
  return "badge-gray";
}

function RateBar({ pct, color = "#8B5CF6" }: { pct: number; color?: string }) {
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="h-full rounded-full"
        style={{ background: pct === 100 ? "linear-gradient(90deg,#D97706,#F59E0B)" : color }}
      />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(39,39,42,0.35)]">
      <div className="skeleton h-8 w-8 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3.5 w-32 rounded" />
        <div className="skeleton h-2.5 w-20 rounded" />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-7 w-7 rounded-lg" />)}
      </div>
    </div>
  );
}

export default function Compliance({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"rate" | "name" | "runs">("rate");

  const fetchRiders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.from("riders").select("*");
      if (error) throw error;
      setRiders(data || []);
    } catch {
      toast.error("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  const allRuns = useMemo(() => {
    const runCount = new Map<string, number>();
    riders.forEach((r) => {
      parseRuns(r.aktivitas).forEach((run) => {
        runCount.set(run.nama, (runCount.get(run.nama) ?? 0) + 1);
      });
    });
    return Array.from(runCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [riders]);

  const matrix = useMemo(() => {
    const rows = riders.map((rider) => {
      const attendedSet = new Set(parseRuns(rider.aktivitas).map((r) => r.nama));
      const attended = allRuns.filter((r) => attendedSet.has(r)).length;
      const rate = allRuns.length > 0 ? Math.round((attended / allRuns.length) * 100) : 0;
      const consecutiveMisses = (() => {
        let streak = 0;
        for (let i = 0; i < allRuns.length; i++) {
          if (!attendedSet.has(allRuns[i])) streak++;
          else break;
        }
        return streak;
      })();
      return { rider, attendedSet, attended, rate, consecutiveMisses };
    });

    return [...rows].sort((a, b) => {
      if (sortBy === "rate") return b.rate - a.rate || b.attended - a.attended;
      if (sortBy === "name") return a.rider.nama.localeCompare(b.rider.nama);
      return b.attended - a.attended;
    });
  }, [riders, allRuns, sortBy]);

  const runStats = useMemo(() =>
    allRuns.map((runName) => {
      const count = matrix.filter((r) => r.attendedSet.has(runName)).length;
      return { runName, count, rate: riders.length > 0 ? Math.round((count / riders.length) * 100) : 0 };
    }),
    [allRuns, matrix, riders.length]
  );

  const perfectRiders = matrix.filter((r) => r.rate === 100).length;
  const avgRate = matrix.length > 0 ? Math.round(matrix.reduce((s, r) => s + r.rate, 0) / matrix.length) : 0;
  const mostAttended = runStats.length > 0 ? runStats[0] : null;
  const lowestCompliance = matrix.length > 0 ? [...matrix].sort((a, b) => a.rate - b.rate)[0] : null;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Run Compliance"
        subtitle={loading ? "Loading…" : `${allRuns.length} runs · ${riders.length} riders`}
        onMenuOpen={onMenuOpen}
        onRefresh={() => fetchRiders(false)}
        loading={loading}
        actions={
          <button
            onClick={() => fetchRiders(false)}
            disabled={loading}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium disabled:opacity-40"
          >
            <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto px-3 md:px-6 py-4 md:py-6 max-w-7xl mx-auto w-full">

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        >
          {[
            {
              Icon: ShieldCheck,
              label: "Avg Compliance",
              value: `${avgRate}%`,
              sub: "across all riders",
              color: "text-purple-400",
            },
            {
              Icon: Users,
              label: "Perfect Attendance",
              value: perfectRiders,
              sub: "riders — every run",
              color: "text-amber-400",
            },
            {
              Icon: BarChart3,
              label: "Most Attended Run",
              value: mostAttended ? mostAttended.rate + "%" : "—",
              sub: mostAttended ? mostAttended.runName : "—",
              color: "text-green-400",
            },
            {
              Icon: AlertTriangle,
              label: "Lowest Compliance",
              value: lowestCompliance ? `${lowestCompliance.rate}%` : "—",
              sub: lowestCompliance ? lowestCompliance.rider.nama.split(" ")[0] : "—",
              color: "text-red-400",
            },
          ].map(({ Icon, label, value, sub, color }) => (
            <div key={label} className="glass-card px-4 py-3.5 flex items-center gap-3">
              <Icon size={18} className={cn("flex-shrink-0", color)} />
              <div className="min-w-0">
                <p className="text-[0.6rem] font-medium uppercase tracking-widest text-[#71717A]">{label}</p>
                <p className="text-[0.95rem] font-bold text-white mt-0.5 truncate">{value}</p>
                <p className="text-[0.62rem] text-[#52525B] truncate">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Sort controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, delay: 0.06 }}
          className="flex items-center gap-2 mb-4"
        >
          <span className="text-[0.65rem] text-[#52525B] uppercase tracking-wider mr-1">Sort by</span>
          {(["rate", "runs", "name"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[0.72rem] font-medium border transition-colors",
                sortBy === key
                  ? "bg-[rgba(139,92,246,0.15)] border-[rgba(139,92,246,0.35)] text-[#A855F7]"
                  : "btn-ghost text-[#71717A]"
              )}
            >
              {key === "rate" ? "Compliance %" : key === "runs" ? "Runs Attended" : "Name"}
            </button>
          ))}
        </motion.div>

        {/* Compliance matrix */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="glass-card overflow-hidden"
        >
          {/* Matrix header */}
          <div
            className="flex items-stretch border-b border-[rgba(39,39,42,0.6)]"
            style={{ background: "rgba(255,255,255,0.015)" }}
          >
            {/* Sticky name col header */}
            <div className="flex-shrink-0 w-52 md:w-64 px-4 py-3 border-r border-[rgba(39,39,42,0.4)] flex items-center">
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#71717A]">Rider</span>
              <span className="ml-auto text-[0.62rem] text-[#52525B]">Rate</span>
            </div>
            {/* Scrollable run columns */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-0 min-w-max px-3 py-3">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="skeleton h-8 w-8 rounded-lg mx-0.5" />
                    ))
                  : allRuns.map((run, ci) => (
                      <div
                        key={run}
                        title={run}
                        className="flex flex-col items-center justify-end mx-0.5"
                        style={{ width: 30, minWidth: 30 }}
                      >
                        <span
                          className="text-[0.55rem] text-[#52525B] font-medium writing-vertical"
                          style={{
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            transform: "rotate(180deg)",
                            maxHeight: 80,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1,
                          }}
                        >
                          {run.length > 16 ? run.slice(0, 15) + "…" : run}
                        </span>
                        <span className="mt-1 text-[0.52rem] text-[#71717A]">
                          {runStats[ci]?.rate ?? 0}%
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : matrix.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck size={32} className="mx-auto mb-3 text-[#52525B]" />
              <p className="text-[0.82rem] text-[#71717A]">No rider data available</p>
            </div>
          ) : (
            matrix.map(({ rider, attendedSet, attended, rate, consecutiveMisses }, ri) => {
              const isPerfect = rate === 100;
              return (
                <motion.div
                  key={rider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12, delay: Math.min(ri * 0.02, 0.3) }}
                  className={cn(
                    "flex items-center border-b border-[rgba(39,39,42,0.3)] last:border-0 hover:bg-[rgba(255,255,255,0.015)] transition-colors",
                    isPerfect && "bg-[rgba(245,158,11,0.03)]"
                  )}
                >
                  {/* Name col */}
                  <div
                    className="flex-shrink-0 w-52 md:w-64 px-4 py-3 border-r border-[rgba(39,39,42,0.3)] min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[0.62rem] font-bold text-white",
                          isPerfect
                            ? "bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-500/30"
                            : "bg-[rgba(255,255,255,0.05)] border border-[rgba(39,39,42,0.6)]"
                        )}
                      >
                        {isPerfect ? "★" : ri + 1}
                      </span>
                      <span className="text-[0.78rem] font-medium text-white truncate">{rider.nama}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={cn(rankBadgeClass(rider.jabatan), "hidden sm:inline")}>
                        {rider.jabatan}
                      </span>
                      {consecutiveMisses > 0 && (
                        <span className="text-[0.55rem] font-semibold text-red-400/80 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-md">
                          {consecutiveMisses} missed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <RateBar pct={rate} />
                      <span className={cn(
                        "text-[0.7rem] font-bold flex-shrink-0 tabular-nums",
                        isPerfect ? "text-amber-400" : rate >= 70 ? "text-green-400" : rate >= 40 ? "text-[#A1A1AA]" : "text-red-400"
                      )}>
                        {rate}%
                      </span>
                    </div>
                    <p className="text-[0.6rem] text-[#52525B] mt-0.5">{attended}/{allRuns.length} runs</p>
                  </div>

                  {/* Run cells */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex items-center min-w-max px-3 py-3 gap-0">
                      {allRuns.map((run) => {
                        const did = attendedSet.has(run);
                        return (
                          <div
                            key={run}
                            title={`${rider.nama} — ${run}: ${did ? "Attended" : "Missed"}`}
                            className={cn(
                              "flex items-center justify-center rounded-lg mx-0.5 transition-colors",
                              did
                                ? "bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)]"
                                : "bg-[rgba(255,255,255,0.02)] border border-[rgba(39,39,42,0.3)]"
                            )}
                            style={{ width: 30, height: 30, minWidth: 30 }}
                          >
                            {did ? (
                              <CheckCircle2 size={13} className="text-green-400" />
                            ) : (
                              <XCircle size={11} className="text-[#3F3F46]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Footer: per-run summary */}
          {!loading && allRuns.length > 0 && (
            <div
              className="flex items-center border-t border-[rgba(39,39,42,0.6)]"
              style={{ background: "rgba(255,255,255,0.01)" }}
            >
              <div className="flex-shrink-0 w-52 md:w-64 px-4 py-3 border-r border-[rgba(39,39,42,0.3)]">
                <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#71717A]">
                  Per-run rate
                </p>
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="flex items-center min-w-max px-3 py-3 gap-0">
                  {runStats.map(({ runName, count, rate }) => (
                    <div
                      key={runName}
                      title={`${runName}: ${count}/${riders.length} riders (${rate}%)`}
                      className={cn(
                        "flex items-center justify-center rounded-lg mx-0.5 text-[0.6rem] font-bold",
                        rate === 100 ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                        : rate >= 70 ? "bg-green-500/10 border border-green-500/20 text-green-400"
                        : rate >= 40 ? "bg-[rgba(255,255,255,0.04)] border border-[rgba(39,39,42,0.4)] text-[#A1A1AA]"
                        : "bg-red-500/5 border border-red-500/15 text-red-400"
                      )}
                      style={{ width: 30, height: 30, minWidth: 30 }}
                    >
                      {rate}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Legend */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-wrap items-center gap-4 glass-card px-4 py-3"
          >
            <span className="text-[0.62rem] text-[#52525B] uppercase tracking-wider">Legend</span>
            {[
              { icon: <CheckCircle2 size={12} className="text-green-400" />, label: "Attended" },
              { icon: <XCircle size={11} className="text-[#3F3F46]" />, label: "Missed" },
              { icon: <span className="text-[0.65rem] font-bold text-amber-400">★</span>, label: "Perfect attendance" },
              { icon: <span className="text-[0.6rem] font-bold text-red-400 border border-red-500/20 bg-red-500/10 rounded px-1">N missed</span>, label: "Consecutive misses from latest run" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                {icon}
                <span className="text-[0.65rem] text-[#71717A]">{label}</span>
              </div>
            ))}
          </motion.div>
        )}

        <p className="mt-5 text-center text-[0.62rem] text-[#52525B] tracking-widest uppercase pb-4">
          Revolt Riders MC — Run Compliance
        </p>
      </div>
    </div>
  );
}
