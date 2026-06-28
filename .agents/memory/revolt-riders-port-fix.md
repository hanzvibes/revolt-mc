---
name: Revolt Riders port conflict fix
description: How to fix "port already in use" on workflow restart for the revolt-riders vite app
---

The revolt-riders vite dev server would fail on restart with "Port already in use" because stale processes still held the port during the new workflow's startup window.

**Fix:** prepend `fuser -k ${PORT:-21543}/tcp 2>/dev/null; sleep 0.5 &&` to the `dev` script in `artifacts/revolt-riders/package.json`. This evicts any stale holder before vite tries to bind.

**Why:** Replit workflows restart fast. The old vite process sometimes hasn't fully released the socket before the new one starts. `fuser -k` forcibly evicts it.

**How to apply:** If the app crashes with "port already in use" again after a workflow restart, this script change already handles it. The assigned port for this artifact is 21543 (assigned by Replit at artifact creation time). Ports 3000, 5173, and 80 are taken by Replit infrastructure.
