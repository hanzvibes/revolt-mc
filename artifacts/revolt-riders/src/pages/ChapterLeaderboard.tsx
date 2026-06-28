import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Users, Route, Trophy, ChevronDown, ChevronUp,
  Flame, Award, Sparkles, TrendingUp, RotateCcw,
} from "lucide-react";
import { parseRuns, cn, numFmt, badgeColor } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";
import { useRiders } from "@/lib/useRiders";

/* ── types ────────────────────────────────────────────────────── */
interface ChapterStats {
  chapter: string;
  members: Rider[];
  totalKm: number;
  totalRuns: number;
  avgKmPerMember: number;
  avgRunsPerMember: number;
  topRider: Rider;
  topRiderKm: number;
}

/* ── helpers ──────────────────────────────────────────────────── */
function buildChapterStats(riders: Rider[]): ChapterStats[] {
  const map = new Map<string, Rider[]>();
  riders.forEach((r) => {
    const chapter = (r.alamat || "Unknown").trim();
    if (!map.has(chapter)) map.set(chapter, []);
    map.get(chapter)!.push(r);
  });

  const stats: ChapterStats[] = [];
  map.forEach((members, chapter) => {
    const totalKm = members.reduce((s, r) => s + (r.total_km || 0), 0);
    const totalRuns = members.reduce((s, r) => s + parseRuns(r.aktivitas).length, 0);
    const sorted = [...members].sort((a, b) => (b.total_km || 0) - (a.total_km || 0));
    stats.push({
      chapter,
      members: sorted,
      totalKm,
      totalRuns,
      avgKmPerMember: members.length > 0 ? Math.round(totalKm / members.length) : 0,
      avgRunsPerMember: members.length > 0 ? Math.round(totalRuns / members.length) : 0,
      topRider: sorted[0],
      topRiderKm: sorted[0]?.total_km || 0,
    });
  });

  return stats.sort((a, b) => b.totalKm - a.totalKm);
}

/* ── Podium ───────────────────────────────────────────────────── */
const PODIUM_COLORS = {
  1: { border: "border-amber-500/40", bg: "from-amber-500/15", text: "text-amber-400", icon: Flame, glow: "rgba(245,158,11,0.2)" },
  2: { border: "border-slate-500/40", bg: "from-slate-400/10", text: "text-slate-400", icon: Award, glow: "rgba(148,163,184,0.15)" },
  3: { border: "border-amber-700/40", bg: "from-amber-700/10", text: "text-amber-600", icon: Sparkles, glow: "rgba(180,83,9,0.15)" },
};

function PodiumCard({ stat, position }: { stat: ChapterStats; position: 1 | 2 | 3 }) {
  const c = PODIUM_COLORS[position];
  const Icon = c.icon;
  const heights = { 1: "pt-10", 2: "pt-6", 3: "pt-3" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: position * 0.07 }}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center flex-1 min-w-0",
        c.border,
        `bg-gradient-to-b ${c.bg} to-transparent`
      )}
      style={{ boxShadow: `0 0 24px ${c.glow}` }}
    >
      <div className={cn(heights[position])}>
        <div className={cn(
          "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl border text-lg font-black text-white mx-auto",
          c.border,
          `bg-gradient-to-br ${c.bg} to-transparent`
        )}>
          {stat.chapter.charAt(0).toUpperCase()}
        </div>
      </div>
      <Icon size={18} className={cn(c.text, "mt-1")} />
      <div>
        <p className="text-[0.8rem] md:text-[0.9rem] font-bold text-white leading-tight">{stat.chapter}</p>
        <p className={cn("text-[0.78rem] font-black mt-0.5", c.text)}>{numFmt(stat.totalKm)} km</p>
        <p className="text-[0.62rem] text-[#71717A] mt-0.5">{stat.members.length} members</p>
      </div>
    </motion.div>
  );
}

/* ── Chapter row ──────────────────────────────────────────────── */
function ChapterRow({ stat, rank, maxKm, index }: {
  stat: ChapterStats; rank: number; maxKm: number; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = maxKm > 0 ? (stat.totalKm / maxKm) * 100 : 0;
  const isTop3 = rank <= 3;
  const topColors = { 1: "text-amber-400", 2: "text-slate-400", 3: "text-amber-600" };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.35) }}
      >
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 border-b border-[rgba(39,39,42,0.4)] last:border-0 hover:bg-[rgba(255,255,255,0.025)] transition-colors text-left group"
        >
          {/* Rank badge */}
          <div className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-sm font-bold",
            isTop3
              ? rank === 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : rank === 2 ? "bg-slate-400/10 border-slate-500/30 text-slate-400"
                : "bg-amber-700/10 border-amber-700/30 text-amber-600"
              : "bg-[rgba(255,255,255,0.02)] border-[rgba(39,39,42,0.6)] text-[#52525B]"
          )}>
            {isTop3 ? (rank === 1 ? <Flame size={16} /> : rank === 2 ? <Award size={15} /> : <Sparkles size={14} />) : rank}
          </div>

          {/* Chapter info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <MapPin size={12} className="text-purple-400 flex-shrink-0" />
              <span className="text-[0.88rem] font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                {stat.chapter}
              </span>
              <span className="text-[0.62rem] text-[#52525B] flex-shrink-0">{stat.members.length} riders</span>
            </div>
            <div className="flex items-center gap-3 text-[0.66rem] text-[#71717A] mb-1.5">
              <span className="flex items-center gap-1"><Users size={9} /> {stat.members.length} members</span>
              <span className="flex items-center gap-1"><Route size={9} /> {stat.totalRuns} runs total</span>
              <span>avg {numFmt(stat.avgKmPerMember)} km/rider</span>
              <span className="flex items-center gap-1"><TrendingUp size={9} /> {stat.topRider?.nama?.split(" ")[0]}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: 0.06 + index * 0.03, ease: [0.4, 0, 0.2, 1] }}
                className="h-full rounded-full"
                style={{
                  background: isTop3
                    ? rank === 1 ? "linear-gradient(90deg,#D97706,#F59E0B)"
                      : rank === 2 ? "linear-gradient(90deg,#64748B,#94A3B8)"
                      : "linear-gradient(90deg,#92400E,#B45309)"
                    : "linear-gradient(90deg,#6D28D9,#8B5CF6,#A855F7)",
                }}
              />
            </div>
          </div>

          {/* KM + expand toggle */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <span className={cn(
              "text-[0.95rem] font-bold",
              isTop3 ? topColors[rank as 1 | 2 | 3] : "text-[#8B5CF6]"
            )}>
              {numFmt(stat.totalKm)}
            </span>
            <span className="text-[0.58rem] text-[#52525B]">km total</span>
            {expanded
              ? <ChevronUp size={13} className="text-[#52525B] mt-0.5" />
              : <ChevronDown size={13} className="text-[#52525B] mt-0.5" />}
          </div>
        </button>

        {/* Expanded members */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-b border-[rgba(39,39,42,0.4)]"
            >
              <div className="px-4 py-3" style={{ background: "rgba(139,92,246,0.03)" }}>
                <p className="text-[0.65rem] uppercase tracking-widest text-[#52525B] mb-2.5">Members</p>
                <div className="space-y-1.5">
                  {stat.members.map((member, mi) => {
                    const runs = parseRuns(member.aktivitas);
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mi * 0.03 }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(39,39,42,0.5)" }}
                      >
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold text-white"
                          style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
                          {mi + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.78rem] font-semibold text-white truncate">{member.nama}</span>
                            <span className={cn("text-[0.55rem] px-1.5 py-0.5 rounded font-semibold flex-shrink-0", badgeColor(member.jabatan))}>
                              {member.jabatan}
                            </span>
                          </div>
                          <span className="text-[0.62rem] text-[#71717A]">{runs.length} runs</span>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[0.8rem] font-bold text-purple-400">{numFmt(member.total_km || 0)}</p>
                          <p className="text-[0.55rem] text-[#52525B]">km</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-0 divide-y divide-[rgba(39,39,42,0.4)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-36 rounded" />
            <div className="skeleton h-3 w-52 rounded" />
            <div className="skeleton h-1.5 w-full rounded-full" />
          </div>
          <div className="skeleton h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function ChapterLeaderboard({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const { riders, loading, refresh: fetchRiders } = useRiders();

  const chapters = useMemo(() => buildChapterStats(riders), [riders]);
  const maxKm = chapters[0]?.totalKm ?? 1;
  const top3 = chapters.slice(0, 3);
  const rest = chapters.slice(3);

  const totalKmAll = chapters.reduce((s, c) => s + c.totalKm, 0);
  const totalRunsAll = chapters.reduce((s, c) => s + c.totalRuns, 0);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Chapter Leaderboard"
        subtitle={`${chapters.length} chapters · ${riders.length} riders`}
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

      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 max-w-4xl mx-auto w-full space-y-4">

        {/* Club-wide stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: MapPin, label: "Chapters", value: chapters.length, sub: "regions" },
            { icon: Users, label: "Total Riders", value: riders.length, sub: "members" },
            { icon: Route, label: "Total KM", value: `${numFmt(totalKmAll)} km`, sub: "club-wide" },
            { icon: Trophy, label: "Total Runs", value: totalRunsAll, sub: "combined" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="glass-card px-4 py-3 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <Icon size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-[0.65rem] text-[#71717A] uppercase tracking-wide">{label}</p>
                <p className="text-[0.9rem] font-bold text-white leading-none mt-0.5">{typeof value === "number" ? numFmt(value) : value}</p>
                <p className="text-[0.58rem] text-[#52525B] mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Podium */}
        {!loading && top3.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-amber-400" />
              <h2 className="text-[0.9rem] font-semibold text-white">Top Chapters</h2>
            </div>
            <div className="flex items-end gap-3 justify-center">
              {/* 2nd | 1st | 3rd */}
              {top3.length >= 2 && (
                <PodiumCard stat={top3[1]} position={2} />
              )}
              {top3.length >= 1 && (
                <PodiumCard stat={top3[0]} position={1} />
              )}
              {top3.length >= 3 && (
                <PodiumCard stat={top3[2]} position={3} />
              )}
            </div>
          </motion.div>
        )}

        {/* Full rankings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-[rgba(39,39,42,0.6)] px-5 py-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-[0.88rem] font-semibold text-white">All Chapters</h3>
              <p className="text-[0.66rem] text-[#71717A] mt-0.5">Click a chapter to see member breakdown</p>
            </div>
            <span className="badge-gray">{chapters.length} chapters</span>
          </div>

          {loading ? (
            <Skeleton />
          ) : chapters.length === 0 ? (
            <p className="py-16 text-center text-[0.8rem] text-[#71717A]">No data available</p>
          ) : (
            chapters.map((stat, i) => (
              <ChapterRow
                key={stat.chapter}
                stat={stat}
                rank={i + 1}
                maxKm={maxKm}
                index={i}
              />
            ))
          )}
        </motion.div>

        {/* Chapter distribution chart */}
        {!loading && chapters.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <h3 className="text-[0.88rem] font-semibold text-white mb-4">KM Distribution by Chapter</h3>
            <div className="space-y-2.5">
              {chapters.map((stat, i) => {
                const pct = totalKmAll > 0 ? (stat.totalKm / totalKmAll) * 100 : 0;
                return (
                  <div key={stat.chapter} className="flex items-center gap-3">
                    <span className="text-[0.7rem] text-[#71717A] w-5 text-right flex-shrink-0">{i + 1}</span>
                    <span className="text-[0.75rem] text-white font-medium w-28 flex-shrink-0 truncate">{stat.chapter}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                        className="h-full rounded-full"
                        style={{ background: i === 0 ? "linear-gradient(90deg,#D97706,#F59E0B)" : i === 1 ? "linear-gradient(90deg,#64748B,#94A3B8)" : i === 2 ? "linear-gradient(90deg,#92400E,#B45309)" : "linear-gradient(90deg,#6D28D9,#8B5CF6)" }}
                      />
                    </div>
                    <span className="text-[0.72rem] font-bold text-purple-400 w-16 text-right flex-shrink-0">{numFmt(stat.totalKm)} km</span>
                    <span className="text-[0.62rem] text-[#52525B] w-8 text-right flex-shrink-0">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <p className="text-center text-[0.62rem] text-[#52525B] tracking-widest uppercase pb-4">
          Revolt Riders MC — Chapter Leaderboard
        </p>
      </div>
    </div>
  );
}
