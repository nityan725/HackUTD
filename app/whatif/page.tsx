"use client";
// "What if…" chat. You type a question; Runway figures out what you mean,
// runs it through the forecast engine, and answers with real numbers.
import { useEffect, useRef, useState } from "react";
import { Icon, IconBadge } from "@/components/Icon";
import TimelineChart, { Legend } from "@/components/TimelineChart";
import { ErrorBox, Loading, PageTitle, Pill } from "@/components/ui";
import { config } from "@/lib/config";
import { fmtDay } from "@/lib/dates";
import { buildFixes } from "@/lib/fixes";
import { forecast, mergeChanges } from "@/lib/forecast";
import { hours, money } from "@/lib/format";
import { useRunway } from "@/lib/store";
import type { Forecast } from "@/lib/types";
import { toChanges, type Action } from "@/lib/whatif";

const SUGGESTIONS = [
  { text: "What if rent goes up $100?", icon: "home", color: "text-sky-500" },
  { text: "What if I lose 10 hours of work?", icon: "clock", color: "text-violet-500" },
  { text: "What if my car needs an $800 repair?", icon: "wrench", color: "text-orange-500" },
  { text: "What if I cancel Netflix and Spotify?", icon: "pause", color: "text-amber-500" },
  { text: "What if I get a $500 bonus?", icon: "coins", color: "text-emerald-500" },
  { text: "What if I add a $30/month gym membership?", icon: "dumbbell", color: "text-pink-500" },
];

interface Answer {
  understood: string[];
  source: string;
  f: Forecast;
  base: Forecast;
  planB: { title: string; costLabel: string; low: number } | null;
}
type Msg = { role: "user"; text: string } | { role: "bot"; answer?: Answer; text?: string };

const runwayLabel = (d: number) => (d > config.horizonDays ? `${config.horizonDays}+` : String(d));

export default function WhatIfPage() {
  const { loading, error, snap, base, plan } = useRunway();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  if (loading) return <Loading />;
  if (error || !snap || !base) return <ErrorBox msg={error ?? "No data"} />;

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy || !snap || !base) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const r = await fetch("/api/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, bills: snap.bills.map((b) => b.payee) }),
      });
      const j: { actions: Action[]; understood: string[]; source: string } = await r.json();
      if (!j.actions?.length) {
        setMsgs((m) => [
          ...m,
          {
            role: "bot",
            text: "I couldn't turn that into a money change. Try something like “What if rent goes up $150?” or “What if I spend $300 next week?”",
          },
        ]);
        return;
      }
      // The engine does all the math
      const changes = mergeChanges(plan, toChanges(j.actions, snap, base));
      const f = forecast(snap, changes, base.today);
      const fix = f.status === "green" ? null : buildFixes(snap, f, changes).find((x) => x.resolves && x.id !== "nothing") ?? null;
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          answer: {
            understood: j.understood,
            source: j.source,
            f,
            base,
            planB: fix ? { title: fix.title, costLabel: fix.costLabel, low: fix.forecast.lowest.balance } : null,
          },
        },
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Something went wrong. Try again?" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rise pb-24">
      <PageTitle kicker="Stress test" title="What if…?" sub="Ask about any change. Runway runs it through your real numbers." />

      {/* Intro + suggestions */}
      <div className="flex gap-2.5">
        <IconBadge name="bolt" tone="green" size="sm" />
        <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,.06)]">
          Banks stress-test their balance sheets. I stress-test yours. Ask me anything, or tap one:
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 pl-10">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => ask(s.text)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-accent-soft disabled:opacity-50"
          >
            <Icon name={s.icon} className={`h-3.5 w-3.5 ${s.color}`} />
            {s.text.replace("What if ", "").replace("?", "")}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="mt-5 space-y-4">
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="rise flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-tr-md bg-accent px-4 py-2.5 text-sm text-white">{m.text}</p>
            </div>
          ) : (
            <div key={i} className="rise flex gap-2.5">
              <IconBadge name="bolt" tone="green" size="sm" />
              <div className="min-w-0 flex-1">{m.answer ? <AnswerCard a={m.answer} /> : <Bubble>{m.text}</Bubble>}</div>
            </div>
          ),
        )}
        {busy && (
          <div className="flex gap-2.5">
            <IconBadge name="bolt" tone="green" size="sm" />
            <Bubble>
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:.3s]" />
              </span>
            </Bubble>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="fixed bottom-[76px] left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 gap-2 bg-gradient-to-t from-canvas via-canvas to-canvas/0 px-4 pb-3 pt-5 sm:absolute"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What if I…"
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-3 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Ask"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="inline-block rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,.06)]">{children}</div>;
}

function AnswerCard({ a }: { a: Answer }) {
  const { f, base } = a;
  const lowDiff = f.lowest.balance - base.lowest.balance;
  const runwayDiff = Math.min(f.runwayDays, config.horizonDays + 1) - Math.min(base.runwayDays, config.horizonDays + 1);
  const color = f.status === "red" ? "#e0393e" : f.status === "yellow" ? "#d98a00" : "#12a150";

  const headline =
    f.status === "red"
      ? `You'd be ${money(-f.lowest.balance)} short on ${fmtDay(f.lowest.date)}.`
      : f.status === "yellow"
        ? `You'd stay above $0, but only just: ${money(f.lowest.balance)} on ${fmtDay(f.lowest.date)}.`
        : `You'd be fine. Your lowest point is ${money(f.lowest.balance)} on ${fmtDay(f.lowest.date)}.`;

  return (
    <div className="rounded-2xl rounded-tl-md bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
      {/* How Runway read the question */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">I read that as</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {a.understood.map((u) => (
          <span key={u} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
            {u}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="text-[15px] font-semibold leading-snug">{headline}</p>
        <Pill status={f.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-canvas p-2.5">
          <p className="text-[11px] text-muted">Runway</p>
          <p className="tabular font-bold">{runwayLabel(f.runwayDays)} days</p>
          <p className={`text-[11px] font-semibold ${runwayDiff < 0 ? "text-bad" : runwayDiff > 0 ? "text-good" : "text-muted"}`}>
            {runwayDiff === 0 ? "no change" : `was ${runwayLabel(base.runwayDays)}`}
          </p>
        </div>
        <div className="rounded-xl bg-canvas p-2.5">
          <p className="text-[11px] text-muted">Lowest balance</p>
          <p className={`tabular font-bold ${f.lowest.balance < 0 ? "text-bad" : ""}`}>{money(f.lowest.balance)}</p>
          <p className={`text-[11px] font-semibold ${lowDiff < 0 ? "text-bad" : lowDiff > 0 ? "text-good" : "text-muted"}`}>
            {Math.round(lowDiff) === 0 ? "no change" : `${lowDiff > 0 ? "+" : ""}${money(lowDiff)} · ${hours(Math.abs(lowDiff) / config.hourlyWage)}`}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <TimelineChart
          height={140}
          days={config.horizonDays}
          series={[
            { name: "Current plan", forecast: base, color: "#94a3b8", dashed: true },
            { name: "What if", forecast: f, color },
          ]}
        />
        <Legend items={[{ label: "Current plan", color: "#94a3b8", dashed: true }, { label: "What if", color }]} />
      </div>

      {f.status !== "green" && (
        <div className="mt-3 flex gap-2 rounded-xl bg-accent-soft p-3 text-sm">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p>
            <b>Plan B: </b>
            {a.planB ? (
              <>
                {a.planB.title} ({a.planB.costLabel}). Your lowest balance would be {money(a.planB.low)}.
              </>
            ) : (
              <>No single fix covers this. You&apos;d need extra income or to cut spending before {fmtDay(f.lowest.date)}.</>
            )}
          </p>
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted">
        {a.source === "ai" ? "AI understood your question." : "Understood by Runway's built-in reader."} All numbers come from Runway&apos;s forecast, not AI.
      </p>
    </div>
  );
}
