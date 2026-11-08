"use client";
// App-wide state: loads the signed-in user's data, keeps the approved plan, and
// recomputes the forecast + health scores whenever something changes.
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { forecast, mergeChanges } from "./forecast";
import type { Fix } from "./fixes";
import { buildFixes } from "./fixes";
import { healthScores, type Score } from "./health";
import { withBalances } from "./snapshot";
import type { Changes, Forecast, Snapshot } from "./types";

interface RunwayState {
  loading: boolean;
  error: string | null;
  snap: Snapshot | null;
  plan: Changes; // fixes the user approved that aren't Nessie transactions (card minimum, pausing subs)
  base: Forecast | null;
  before: Forecast | null; // forecast right before the last approved fix (for the "before" line)
  scores: Score[];
  fixes: Fix[];
  approved: string[];
  approve: (fix: Fix) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  signIn: (email: string, password: string) => Promise<string | null>; // returns an error message or null
  signOut: () => Promise<void>;
}

const Ctx = createContext<RunwayState | null>(null);

// "Reset demo" hides earlier Runway money moves (Nessie won't let us delete them),
// so you can run the demo again from the red crunch.
const IGNORE_KEY = "runway-ignored-tx";
function loadIgnored(): string[] {
  try {
    return JSON.parse(localStorage.getItem(IGNORE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveIgnored(ids: string[]) {
  try {
    localStorage.setItem(IGNORE_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — fine */
  }
}

export function RunwayProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Changes>({});
  const [before, setBefore] = useState<Forecast | null>(null);
  const [approved, setApproved] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/snapshot", { cache: "no-store" });
      if (r.status === 401) {
        setSnap(null);
        if (window.location.pathname !== "/login") router.replace("/login");
        return;
      }
      if (!r.ok) throw new Error(`Couldn't load data (${r.status})`);
      const data: Snapshot = await r.json();
      const ignored = new Set(loadIgnored());
      setSnap({ ...data, txs: data.txs.filter((t) => !ignored.has(t.id)) });
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  // If someone opens an app page while signed out, send them to sign in
  useEffect(() => {
    if (!loading && !snap && !error && path !== "/login") router.replace("/login");
  }, [loading, snap, error, path, router]);

  const computed = useMemo(() => {
    if (!snap) return { s: null, base: null, scores: [], fixes: [] };
    const s = withBalances(snap);
    const base = forecast(s, plan);
    return { s, base, scores: healthScores(s, base), fixes: buildFixes(s, base, plan) };
  }, [snap, plan]);

  const clearPlan = () => {
    setPlan({});
    setBefore(null);
    setApproved([]);
  };

  const approve = useCallback(
    async (fix: Fix) => {
      if (!snap || !computed.base) return;
      setBefore(computed.base);
      if (fix.action?.type === "move") {
        const r = await fetch("/api/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fix.action),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Move failed");
        // Add the new Nessie transactions locally so the chart redraws instantly
        setSnap((prev) => (prev ? { ...prev, txs: [...prev.txs, ...j.txs] } : prev));
      } else {
        setPlan((p) => mergeChanges(p, fix.changes));
      }
      setApproved((a) => [...a, fix.title]);
    },
    [snap, computed.base],
  );

  const reset = useCallback(() => {
    if (snap) {
      const moves = snap.txs.filter((t) => t.description.startsWith("Runway")).map((t) => t.id);
      saveIgnored([...new Set([...loadIgnored(), ...moves])]);
    }
    clearPlan();
    refresh();
  }, [refresh, snap]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return j.error || "Couldn't sign in.";
      clearPlan();
      setLoading(true);
      await refresh();
      router.replace("/");
      return null;
    },
    [refresh, router],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    clearPlan();
    setSnap(null);
    router.replace("/login");
  }, [router]);

  const value: RunwayState = {
    loading,
    error,
    snap: computed.s,
    plan,
    base: computed.base,
    before,
    scores: computed.scores,
    fixes: computed.fixes,
    approved,
    approve,
    refresh,
    reset,
    signIn,
    signOut,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRunway() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRunway must be used inside RunwayProvider");
  return v;
}
