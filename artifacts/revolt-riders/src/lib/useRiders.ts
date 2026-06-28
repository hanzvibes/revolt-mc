import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import type { Rider } from "./types";

const CACHE_KEY = "rr_riders_cache";
const CACHE_TTL = 60_000; // 1 minute

interface CacheEntry { data: Rider[]; ts: number }

function readCache(): Rider[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.data;
  } catch { return null; }
}

function writeCache(data: Rider[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
}

export function invalidateRidersCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

export function useRiders() {
  const [riders, setRiders] = useState<Rider[]>(() => readCache() ?? []);
  const [loading, setLoading] = useState<boolean>(() => readCache() === null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const fetchingRef = useRef(false);

  const fetch = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    if (!force) {
      const cached = readCache();
      if (cached) { setRiders(cached); setLoading(false); return; }
    }
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaErr } = await supabase
        .from("riders")
        .select("*")
        .order("total_km", { ascending: false });
      if (supaErr) throw supaErr;
      const result = data ?? [];
      writeCache(result);
      setRiders(result);
      setLastFetched(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load riders");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const refresh = useCallback(() => fetch(true), [fetch]);

  return { riders, loading, error, lastFetched, refresh };
}
