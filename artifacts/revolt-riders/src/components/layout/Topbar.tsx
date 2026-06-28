import { useState, useEffect } from "react";
import { RotateCcw, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
  onMenuOpen?: () => void;
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="status-dot-live" />
      <span className="text-[0.68rem] font-semibold text-[#A1A1AA] tabular-nums">{time}</span>
      <span className="text-[0.62rem] text-[#52525B]">·</span>
      <span className="text-[0.65rem] text-[#71717A]">{date}</span>
    </div>
  );
}

export function Topbar({
  title,
  subtitle,
  onRefresh,
  loading,
  actions,
  onMenuOpen,
}: TopbarProps) {
  return (
    <div className="topbar-glass sticky top-0 z-30 flex h-[60px] items-center justify-between px-4 md:px-6 gap-3">

      {/* Left — hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden btn-ghost flex h-8 w-8 items-center justify-center p-0 flex-shrink-0"
            aria-label="Open navigation"
          >
            <AlignLeft size={16} />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-[0.95rem] md:text-[1.02rem] font-bold text-white tracking-tight truncate leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[0.65rem] text-[#71717A] truncate hidden sm:block mt-0.5 tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right — clock + divider + actions + refresh + avatar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <LiveClock />

        {(actions || onRefresh) && (
          <div className="hidden md:block w-px h-4 bg-white/[0.07]" />
        )}

        {actions}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={cn(
              "btn-ghost flex h-8 w-8 items-center justify-center p-0 transition-all",
              loading && "border-purple-500/20 bg-purple-500/5"
            )}
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RotateCcw
              size={13}
              className={loading ? "animate-spin text-[#8B5CF6]" : "text-[#71717A]"}
            />
          </button>
        )}

        {/* Avatar */}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-[0.65rem] font-bold text-white flex-shrink-0 select-none"
          style={{
            background: "linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)",
            boxShadow: "0 0 14px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          R
        </div>
      </div>
    </div>
  );
}
