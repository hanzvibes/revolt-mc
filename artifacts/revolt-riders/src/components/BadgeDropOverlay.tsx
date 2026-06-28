import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_STYLES, type Badge } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export interface BadgeDrop {
  badge: Badge;
  riderName: string;
}

interface Props {
  current: BadgeDrop | null;
  onDismiss: () => void;
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 360 + (i % 2 === 0 ? 8 : -8);
  const dist = 90 + (i % 5) * 22;
  const size = 3 + (i % 4);
  const delay = (i % 6) * 0.035;
  const colors = ["#A855F7","#8B5CF6","#F59E0B","#FDE68A","#C084FC","#E879F9"];
  return { angle, dist, size, delay, color: colors[i % colors.length] };
});

export default function BadgeDropOverlay({ current, onDismiss }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (current) {
      timerRef.current = setTimeout(onDismiss, 4200);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, onDismiss]);

  const s = current ? TIER_STYLES[current.badge.tier] : null;
  const BadgeIcon = current?.badge.icon;

  return (
    <AnimatePresence>
      {current && s && BadgeIcon && (
        <motion.div
          key={current.badge.id + current.riderName}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
          onClick={onDismiss}
        >
          <div className="relative flex flex-col items-center gap-0 select-none pointer-events-none">

            {/* Ambient glow ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute rounded-full"
              style={{
                width: 220, height: 220,
                background: `radial-gradient(circle, ${current.badge.tier === "legendary" ? "rgba(245,158,11,0.18)" : "rgba(139,92,246,0.18)"} 0%, transparent 70%)`,
                filter: "blur(20px)",
              }}
            />

            {/* Particles */}
            {PARTICLES.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const dx = Math.cos(rad) * p.dist;
              const dy = Math.sin(rad) * p.dist;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{ x: dx, y: dy, scale: 1, opacity: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + p.delay, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute rounded-full"
                  style={{ width: p.size, height: p.size, background: p.color, top: "50%", left: "50%", marginTop: -p.size/2, marginLeft: -p.size/2 }}
                />
              );
            })}

            {/* "Achievement Unlocked" header */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="flex items-center gap-1.5 mb-4"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-amber-400">
                Achievement Unlocked
              </span>
              <Sparkles size={13} className="text-amber-400" />
            </motion.div>

            {/* Badge card */}
            <motion.div
              initial={{ scale: 0.3, y: -60, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.05 }}
              className={cn(
                "relative flex flex-col items-center gap-4 rounded-3xl px-10 py-8 border shadow-2xl",
                s.border,
                current.badge.tier === "legendary" && "ring-2 ring-amber-400/30"
              )}
              style={{
                background: "linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(10,10,10,0.98) 100%)",
                boxShadow: `0 0 80px rgba(139,92,246,0.25), 0 40px 60px rgba(0,0,0,0.6)`,
                minWidth: 280,
              }}
            >
              {/* Top accent bar */}
              <div className={cn("absolute top-0 left-0 right-0 h-px rounded-t-3xl bg-gradient-to-r", s.bg)} />

              {/* Badge icon */}
              <motion.div
                initial={{ rotate: -20, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.2 }}
                className={cn("flex h-20 w-20 items-center justify-center rounded-3xl border shadow-xl", s.border, `bg-gradient-to-br ${s.bg}`)}
              >
                <BadgeIcon size={36} className={s.text} />
              </motion.div>

              {/* Tier + name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-center"
              >
                <p className={cn("text-[0.58rem] font-bold uppercase tracking-[0.2em] mb-1.5", s.text)}>
                  {TIER_STYLES[current.badge.tier].label} Badge
                </p>
                <h2 className="text-[1.4rem] font-black text-white tracking-tight leading-none mb-2">
                  {current.badge.name}
                </h2>
                <p className="text-[0.72rem] text-[#71717A] leading-relaxed max-w-[200px] mx-auto">
                  {current.badge.description}
                </p>
              </motion.div>

              {/* Rider name */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.45 }}
                className="flex items-center gap-2 rounded-xl px-4 py-2 border border-[rgba(255,255,255,0.06)]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-[0.65rem] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6D28D9,#A855F7)" }}
                >
                  {current.riderName.charAt(0)}
                </div>
                <span className="text-[0.78rem] font-semibold text-[#A1A1AA]">{current.riderName}</span>
              </motion.div>
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-[0.6rem] text-[#52525B] tracking-widest uppercase"
            >
              Tap anywhere to continue
            </motion.p>

            {/* Progress bar */}
            <motion.div
              className="mt-3 h-0.5 rounded-full overflow-hidden"
              style={{ width: 120, background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.2, ease: "linear" }}
                className="h-full rounded-full"
                style={{ background: s.text.replace("text-", "bg-") === s.text
                  ? "linear-gradient(90deg,#8B5CF6,#A855F7)"
                  : "linear-gradient(90deg,#8B5CF6,#A855F7)" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
