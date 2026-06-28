import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge, ChevronLeft, ChevronRight, KeyRound, Medal, Route, X,
  Swords, Flame, Trophy, CreditCard, Megaphone, Dna, LayoutGrid, MapPin, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: Gauge, href: "/" },
      { label: "Leaderboard", icon: Medal, href: "/leaderboard" },
    ],
  },
  {
    label: "Riding",
    items: [
      { label: "Run History", icon: Route, href: "/runs" },
      { label: "Attendance", icon: LayoutGrid, href: "/heatmap" },
      { label: "Compliance", icon: ShieldCheck, href: "/compliance" },
      { label: "Chapters", icon: MapPin, href: "/chapters" },
    ],
  },
  {
    label: "Club",
    items: [
      { label: "Showdown", icon: Swords, href: "/showdown" },
      { label: "Trophies", icon: Trophy, href: "/trophies" },
      { label: "Report Card", icon: CreditCard, href: "/report-card" },
      { label: "Club DNA", icon: Dna, href: "/dna" },
      { label: "Announcements", icon: Megaphone, href: "/announcements" },
    ],
  },
];

const ADMIN_ITEM = { label: "Admin Panel", icon: KeyRound, href: "/admin" };

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 252 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-shrink-0 flex-col bg-[#090909]"
      style={{
        minHeight: "100dvh",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex h-[60px] items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[0.75rem] font-black text-white"
            style={{
              background: "linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)",
              boxShadow: "0 0 18px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            R
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="truncate text-[0.8rem] font-bold text-white tracking-tight leading-none">
                  REVOLT RIDERS
                </p>
                <p className="truncate text-[0.62rem] text-[#52525B] mt-0.5 tracking-widest uppercase">
                  Mandatory Ride
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex flex-1 flex-col overflow-y-auto p-2.5 gap-0.5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "mt-3")}>
            {/* Group label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="section-label pb-1.5 pt-0.5 block"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Collapsed: subtle separator between groups */}
            {collapsed && gi > 0 && (
              <div className="mx-3 my-2 h-px bg-white/[0.05]" />
            )}

            {group.items.map(({ label, icon: Icon, href }) => {
              const isActive = location === href;
              return (
                <Link key={href} href={href} onClick={onClose}>
                  <div
                    className={cn(
                      "sidebar-item",
                      isActive && "active",
                      collapsed && "justify-center px-0"
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-[10px]"
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom section ── */}
      <div
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        className="p-2.5 space-y-1.5"
      >
        {/* Active season pill */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.14)",
              }}
            >
              <div
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(139,92,246,0.22)" }}
              >
                <Flame size={11} className="text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.67rem] font-semibold text-purple-300 truncate leading-none mb-0.5">
                  Active Season
                </p>
                <p className="text-[0.6rem] text-[#52525B] truncate">2025 — Mandatory Ride</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin nav item */}
        <Link href={ADMIN_ITEM.href} onClick={onClose}>
          <div
            className={cn(
              "sidebar-item-admin",
              location === ADMIN_ITEM.href && "active",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? ADMIN_ITEM.label : undefined}
          >
            <ADMIN_ITEM.icon size={17} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {ADMIN_ITEM.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className={cn(
            "hidden md:flex btn-ghost w-full items-center gap-2 px-3 py-2 text-[0.72rem]",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
