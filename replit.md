# REVOLT RIDERS Dashboard

A motorcycle club management dashboard for Revolt Riders MC — tracks riders, runs, mileage, leaderboards, achievements, and club announcements.

## Run & Operate

- `pnpm --filter @workspace/revolt-riders run dev` — run the frontend (port 21543)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, Wouter (routing)
- Backend: Supabase (PostgreSQL + realtime)
- API: Express 5 (health/utility routes only — data comes from Supabase directly)
- Build: Vite (CJS bundle for API)

## Where things live

- `artifacts/revolt-riders/src/` — frontend source
  - `pages/` — 11 pages: Dashboard, Leaderboard, RunHistory, Showdown, Trophies, ReportCard, Announcements, ClubDNA, AttendanceHeatmap, ChapterLeaderboard, Admin
  - `components/layout/` — Sidebar, Topbar
  - `lib/` — types.ts, supabase.ts, useRiders.ts, achievements.ts, announcements.ts, utils.ts
- `lib/api-spec/openapi.yaml` — API contract (health endpoint only)
- `artifacts/api-server/` — Express API server

## Architecture decisions

- Data is fetched directly from Supabase on the frontend using `@supabase/supabase-js` — no custom REST proxy for rider data.
- Announcements are stored in `localStorage` (client-side only).
- Rider cache uses `sessionStorage` with a 1-minute TTL to reduce Supabase calls.
- The `aktivitas` field on each rider is a semicolon-delimited string (`RunName:km;RunName:km`) parsed by `parseRuns()` in `lib/utils.ts`.

## Product

- Dashboard: KPI cards (total riders, total KM, avg KM, road captain, total runs, founders), top 15 chart, rank distribution chart, full sortable/filterable rider table
- Leaderboard: ranked riders by total KM with rank change tracking
- Run History: per-rider run log with timeline view
- Showdown: head-to-head rider battle across 7 stats
- Trophies: 12 badge types auto-computed from rider data; hall of fame
- Report Card: individual rider scorecard
- Attendance Heatmap: run attendance visualization
- Chapter Leaderboard: by geographic chapter
- Club DNA: club identity and stats visualization
- Announcements: pinnable announcements stored in localStorage
- Admin Panel: add/edit/delete riders, update aktivitas (runs)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Port fix in dev script: `fuser -k ${PORT:-21543}/tcp 2>/dev/null; sleep 0.5 &&` must stay at the front of the `dev` script to prevent "port in use" on workflow restart.
- The `aktivitas` field is a raw semicolon-separated string — always use `parseRuns()` to decode it.
- Supabase credentials are in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
