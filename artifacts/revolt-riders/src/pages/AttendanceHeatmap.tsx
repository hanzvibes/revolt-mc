import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Users, Route, Search, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { parseRuns, cn, numFmt } from "@/lib/utils";
import { badgeColor } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";
import { useRiders } from "@/lib/useRiders";

/* ── helpers ──────────────────────────────────────────────────── */
function attendanceRate(attended: number, total: number) {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

function cellColor(km: number, maxKm: number): string {
  if (km === 0) return "rgba(255,255,255,0.03)";
  const pct = km / maxKm;
  if (pct >= 0.8) return "rgba(139,92,246,0.85)";
  if (pct >= 0.6) return "rgba(139,92,246,0.65)";
  if (pct >= 0.4) return "rgba(139,92,246,0.45)";
  if (pct >= 0.2) return "rgba(139,92,246,0.28)";
  return "rgba(139,92,246,0.14)";
}

function cellBorder(km: number): string {
  if (km === 0) return "rgba(39,39,42,0.5)";
  return "rgba(139,92,246,0.35)";
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="flex gap-1.5 flex-1">
            {Array.from({ length: 10 }).map((_, j) => (
              <div key={j} className="skeleton h-8 flex-1 rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="glass-card px-4 py-3 flex items-center gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
        <Icon size={16} className="text-purple-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] text-[#71717A] uppercase tracking-wide truncate">{label}</p>
        <p className="text-[0.92rem] font-bold text-white leading-none mt-0.5">{value}</p>
        {sub && <p className="text-[0.6rem] text-[#52525B] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function AttendanceHeatmap({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const { riders, loading, refresh: fetchRiders } = useRiders();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "rate" | "km">("rate");
  const [sortAsc, setSortAsc] = useState(false);
  const [showRiderLabels, setShowRiderLabels] = useState(true);

  /* Build run list + rider attendance map */
  const { allRuns, riderRows, maxKm } = useMemo(() => {
    const runSet = new Map<string, number>(); // runName → max km seen (for color scale)
    const parsed = riders.map((r) => ({ rider: r, runs: parseRuns(r.aktivitas) }));

    // Collect all unique run names
    parsed.forEach(({ runs }) => {
      runs.forEach(({ nama, km }) => {
        const key = nama.trim();
        runSet.set(key, Math.max(runSet.get(key) ?? 0, km));
      });
    });

    const allRuns = Array.from(runSet.keys());
    const maxKm = allRuns.reduce((m, r) => Math.max(m, runSet.get(r) ?? 0), 0);

    // Build per-rider attendance map
    const riderRows = parsed.map(({ rider, runs }) => {
      const map = new Map<string, number>();
      runs.forEach(({ nama, km }) => map.set(nama.trim(), km));
      const attended = allRuns.filter((r) => (map.get(r) ?? 0) > 0).length;
      const totalKm = runs.reduce((s, r) => s + r.km, 0);
      return { rider, map, attended, rate: attendanceRate(attended, allRuns.length), totalKm };
    });

    return { allRuns, riderRows, maxKm };
  }, [riders]);

  /* Filter + sort */
  const displayRows = useMemo(() => {
    let rows = riderRows.filter((r) =>
      r.rider.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.rider.alamat?.toLowerCase().includes(search.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      let diff = 0;
      if (sortBy === "name") diff = a.rider.nama.localeCompare(b.rider.nama);
      else if (sortBy === "rate") diff = b.rate - a.rate;
      else diff = b.totalKm - a.totalKm;
      return sortAsc ? -diff : diff;
    });
    return rows;
  }, [riderRows, search, sortBy, sortAsc]);

  /* Per-run attendance stats */
  const runStats = useMemo(() => {
    return allRuns.map((run) => {
      const count = riderRows.filter((r) => (r.map.get(run) ?? 0) > 0).length;
      const avgKm = count > 0
        ? Math.round(riderRows.filter((r) => (r.map.get(run) ?? 0) > 0).reduce((s, r) => s + (r.map.get(run) ?? 0), 0) / count)
        : 0;
      return { run, count, avgKm, rate: attendanceRate(count, riderRows.length) };
    });
  }, [allRuns, riderRows]);

  const overallRate = useMemo(() => {
    if (riderRows.length === 0 || allRuns.length === 0) return 0;
    const total = riderRows.reduce((s, r) => s + r.attended, 0);
    return Math.round((total / (riderRows.length * allRuns.length)) * 100);
  }, [riderRows, allRuns]);

  const topAttender = useMemo(() => {
    return [...riderRows].sort((a, b) => b.rate - a.rate)[0]?.rider.nama ?? "—";
  }, [riderRows]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc((a) => !a);
    else { setSortBy(col); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Attendance Heatmap"
        subtitle={`${allRuns.length} runs · ${riders.length} riders`}
        onMenuOpen={onMenuOpen}
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

      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4 max-w-full">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={CalendarDays} label="Total Runs" value={allRuns.length} sub="unique events" />
          <StatCard icon={Users} label="Total Riders" value={riders.length} sub="tracked members" />
          <StatCard icon={Route} label="Club Attendance" value={`${overallRate}%`} sub="overall rate" />
          <StatCard icon={Route} label="Top Attender" value={topAttender} sub="highest rate" />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input
              type="text"
              placeholder="Search riders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.03)] pl-8 pr-3 py-2 text-[0.78rem] text-white placeholder-[#52525B] focus:outline-none focus:border-purple-500/50 focus:bg-[rgba(139,92,246,0.05)] transition-all"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.02)] p-1">
            {(["rate", "km", "name"] as const).map((col) => (
              <button
                key={col}
                onClick={() => toggleSort(col)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-[0.7rem] font-medium transition-all capitalize",
                  sortBy === col
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-[#71717A] hover:text-white"
                )}
              >
                {col === "rate" ? "Attendance" : col === "km" ? "Total KM" : "Name"}
                <SortIcon col={col} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowRiderLabels((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[0.72rem] font-medium transition-all",
              showRiderLabels
                ? "border-purple-500/30 bg-purple-600/10 text-purple-300"
                : "border-[rgba(39,39,42,0.6)] text-[#71717A] hover:text-white"
            )}
          >
            <Users size={12} />
            Labels
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[0.62rem] text-[#52525B] uppercase tracking-wider">KM intensity</span>
          {[0, 0.15, 0.3, 0.5, 0.75, 1].map((pct) => (
            <div key={pct} className="flex items-center gap-1.5">
              <div className="h-4 w-6 rounded-sm border" style={{
                background: pct === 0 ? "rgba(255,255,255,0.03)" : `rgba(139,92,246,${0.14 + pct * 0.71})`,
                borderColor: pct === 0 ? "rgba(39,39,42,0.5)" : "rgba(139,92,246,0.35)"
              }} />
              {pct === 0 && <span className="text-[0.6rem] text-[#52525B]">None</span>}
              {pct === 1 && <span className="text-[0.6rem] text-[#52525B]">Max</span>}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="glass-card overflow-auto"
        >
          {loading ? (
            <Skeleton />
          ) : displayRows.length === 0 ? (
            <p className="py-16 text-center text-[0.8rem] text-[#71717A]">No riders found</p>
          ) : (
            <div className="min-w-max">
              {/* Run headers */}
              <div className="flex items-end gap-1 px-4 pt-4 pb-2 border-b border-[rgba(39,39,42,0.4)] sticky top-0 bg-[#111] z-10">
                {/* Rider name column header */}
                {showRiderLabels && (
                  <div className="w-36 flex-shrink-0 flex items-center gap-1 pr-3">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[#52525B] hover:text-purple-300 transition-colors">
                      Rider <SortIcon col="name" />
                    </button>
                  </div>
                )}
                {allRuns.map((run, i) => {
                  const stat = runStats[i];
                  return (
                    <div key={run} className="w-8 flex-shrink-0 flex flex-col items-center gap-1" title={`${run} — ${stat.count}/${riderRows.length} riders, avg ${numFmt(stat.avgKm)} km`}>
                      <span className="text-[0.52rem] font-semibold text-purple-300">{stat.rate}%</span>
                      <div
                        className="w-1 rounded-full"
                        style={{ height: Math.max(4, (stat.rate / 100) * 28), background: "rgba(139,92,246,0.5)" }}
                      />
                      <span
                        className="text-[0.55rem] text-[#52525B] whitespace-nowrap"
                        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: 60, overflow: "hidden", textOverflow: "ellipsis" }}
                        title={run}
                      >
                        {run.length > 12 ? run.slice(0, 12) + "…" : run}
                      </span>
                    </div>
                  );
                })}
                {/* Rate + KM headers */}
                <div className="w-px mx-2 self-stretch bg-[rgba(39,39,42,0.6)]" />
                <button onClick={() => toggleSort("rate")} className="w-12 flex-shrink-0 flex flex-col items-center gap-0.5">
                  <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#52525B] hover:text-purple-300 transition-colors flex items-center gap-0.5">Rate <SortIcon col="rate" /></span>
                </button>
                <button onClick={() => toggleSort("km")} className="w-14 flex-shrink-0 flex flex-col items-center gap-0.5">
                  <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#52525B] hover:text-purple-300 transition-colors flex items-center gap-0.5">KM <SortIcon col="km" /></span>
                </button>
              </div>

              {/* Rider rows */}
              <div>
                {displayRows.map(({ rider, map, attended, rate, totalKm }, rowIdx) => (
                  <motion.div
                    key={rider.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: Math.min(rowIdx * 0.015, 0.3) }}
                    className="flex items-center gap-1 px-4 py-1.5 border-b border-[rgba(39,39,42,0.3)] last:border-0 hover:bg-[rgba(255,255,255,0.015)] group transition-colors"
                  >
                    {showRiderLabels && (
                      <div className="w-36 flex-shrink-0 pr-3 min-w-0">
                        <p className="text-[0.75rem] font-semibold text-white truncate group-hover:text-purple-300 transition-colors">{rider.nama}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={cn("text-[0.56rem] px-1 py-0.5 rounded font-semibold", badgeColor(rider.jabatan))}>
                            {rider.jabatan}
                          </span>
                        </div>
                      </div>
                    )}

                    {allRuns.map((run) => {
                      const km = map.get(run) ?? 0;
                      return (
                        <div
                          key={run}
                          className="w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center transition-all hover:scale-110 cursor-default"
                          style={{
                            background: cellColor(km, maxKm),
                            border: `1px solid ${cellBorder(km)}`,
                          }}
                          title={km > 0 ? `${run}: ${numFmt(km)} km` : `${run}: not attended`}
                        >
                          {km > 0 && (
                            <span className="text-[0.5rem] font-bold text-purple-200 leading-none">
                              {km >= 1000 ? `${Math.round(km / 100) / 10}k` : km}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    <div className="w-px mx-2 self-stretch bg-[rgba(39,39,42,0.6)]" />

                    {/* Attendance rate */}
                    <div className="w-12 flex-shrink-0 flex flex-col items-center gap-0.5">
                      <span className={cn(
                        "text-[0.72rem] font-bold",
                        rate >= 80 ? "text-green-400" : rate >= 50 ? "text-amber-400" : "text-[#71717A]"
                      )}>
                        {rate}%
                      </span>
                      <span className="text-[0.55rem] text-[#52525B]">{attended}/{allRuns.length}</span>
                    </div>

                    {/* Total KM */}
                    <div className="w-14 flex-shrink-0 text-center">
                      <span className="text-[0.75rem] font-bold text-purple-400">{numFmt(totalKm)}</span>
                      <span className="text-[0.55rem] text-[#52525B] block">km</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Run-level stats table */}
        {!loading && allRuns.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-[rgba(39,39,42,0.6)]">
              <h3 className="text-[0.88rem] font-semibold text-white">Run Participation Summary</h3>
              <p className="text-[0.66rem] text-[#71717A] mt-0.5">Attendance and average KM per event</p>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-[0.75rem]">
                <thead>
                  <tr className="border-b border-[rgba(39,39,42,0.5)]">
                    <th className="text-left px-5 py-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#52525B]">Run Name</th>
                    <th className="text-right px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#52525B]">Riders</th>
                    <th className="text-right px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#52525B]">Attendance</th>
                    <th className="text-right px-5 py-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#52525B]">Avg KM</th>
                  </tr>
                </thead>
                <tbody>
                  {runStats
                    .slice()
                    .sort((a, b) => b.rate - a.rate)
                    .map(({ run, count, avgKm, rate }) => (
                      <tr key={run} className="border-b border-[rgba(39,39,42,0.3)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-5 py-2.5 text-white font-medium">{run}</td>
                        <td className="px-4 py-2.5 text-right text-[#71717A]">{count} <span className="text-[#52525B]">/ {riderRows.length}</span></td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${rate}%`, background: "linear-gradient(90deg, #6D28D9, #8B5CF6)" }} />
                            </div>
                            <span className={cn("font-semibold w-8 text-right", rate >= 80 ? "text-green-400" : rate >= 50 ? "text-amber-400" : "text-[#71717A]")}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold text-purple-400">{numFmt(avgKm)} km</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <p className="text-center text-[0.62rem] text-[#52525B] tracking-widest uppercase pb-4">
          Revolt Riders MC — Attendance Heatmap
        </p>
      </div>
    </div>
  );
}
