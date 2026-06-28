---
name: Revolt Riders design tokens
description: Contrast-safe text token hierarchy, CSS conventions, and sidebar nav grouping for the REVOLT RIDERS dashboard
---

## Text token hierarchy (all on #080808 background)

- `text-white` / `#FFFFFF` — primary headings, KPI numbers
- `#A1A1AA` — secondary body text, subtitles (~5.9:1)
- `#71717A` — muted labels, captions (~4.6:1 — minimum for body text)
- `#52525B` — decorative/non-essential text only (~3.1:1 — never use for readable content)
- `#3F3F46` — **DO NOT use for text** (~2.1:1, fails WCAG AA) — only allowed as a background or border color

**Why:** The original codebase used `#3F3F46` heavily for labels, which failed accessibility. The audit replaced all such instances. Any new text should use `#71717A` as its minimum.

## CSS utility classes

- `.card-label` — use for all stat card / section labels (replaces inline `text-[0.62rem] text-[#3F3F46]`)
- `.section-label` — use for sidebar group headers and nav section titles
- `.sidebar-item` — regular nav items (purple active state)
- `.sidebar-item-admin` — Admin Panel only (red tint on hover/active)
- `.thead-sticky` — sticky table header with dark bg and shadow

## Sidebar nav grouping

Groups: OVERVIEW (Dashboard, Leaderboard), RIDING (Run History, Attendance, Chapters), CLUB (Showdown, Trophies, Report Card, Club DNA, Announcements).
Admin Panel is separated at the bottom with `.sidebar-item-admin` (red tint) to signal it's a protected section.

**Why:** Flat list of 11 items was hard to scan. Grouping creates visual chunking and helps users find what they need faster.

## Live clock widget

The topbar clock now shows a green `.status-dot-live` pulsing dot to the left of the time, giving the dashboard a "live data" feel. Time text uses `#A1A1AA` (was `#52525B` — too dim).
