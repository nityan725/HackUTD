"use client";
import { useState } from "react";
import { IconBadge, type Tone } from "@/components/Icon";
import TimelineChart, { Legend } from "@/components/TimelineChart";
import { Card, ErrorBox, Loading, PageTitle, Pill } from "@/components/ui";
import { fmtDay } from "@/lib/dates";
import type { Fix } from "@/lib/fixes";
import { crunchCauses } from "@/lib/forecast";
import { money } from "@/lib/format";
import { useRunway } from "@/lib/store";

const FIX_ICONS: Record<string, { icon: string; tone: Tone }> = {
  move: { icon: "transfer", tone: "green" },
  cardmin: { icon: "card", tone: "purple" },
  pause: { icon: "pause", tone: "amber" },
  nothing: { icon: "x", tone: "red" },
  request: { icon: "users", tone: "blue" },
};

export default function FixPage() {
  const { loading, error, base, before, fixes, approve, approved, reset } = useRunway();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error || !base) return <ErrorBox msg={error ?? "No data"} />;

  const fix = fixes.find((f) => f.id === selected) ?? fixes[0] ?? null;
  const causes = crunchCauses(base);

  async function onApprove(f: Fix) {
    setBusy(true);
    setMsg(null);
    try {
      await approve(f);
      setMsg(
        f.action?.type === "move"
          ? `Done. ${money(f.action.amount)} moved from savings to checking in Nessie.`
          : f.action?.type === "request"
            ? `Done. ${f.action.friendName} paid you back ${money(f.action.amount)} through Nessie.`
            : `Done. "${f.title}" is now part of your plan.`,
      );
    } catch (e) {
      setMsg(`That didn't work: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  // ✅ All clear (possibly right after approving a fix)
  if (base.status === "green") {
    return (
      <div className="rise">
        <PageTitle kicker="Fix" title="You're in the clear" sub={`Lowest balance in the next 30 days: ${money(base.lowest.balance)} on ${fmtDay(base.lowest.date)}.`} />
        {msg && <p className="mb-4 rounded-2xl bg-good-soft px-4 py-3 text-sm font-medium text-good">{msg}</p>}
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">{before ? "Before vs. now" : "Next 30 days"}</p>
            <Pill status="green" />
          </div>
          <TimelineChart
            series={[
              ...(before ? [{ name: "Before", forecast: before, color: "#e0393e", dashed: true }] : []),
              { name: "Now", forecast: base, color: "#12a150" },
            ]}
          />
          {before && (
            <Legend items={[{ label: "If you did nothing", color: "#e0393e", dashed: true }, { label: "Your plan now", color: "#12a150" }]} />
          )}
        </Card>
        {approved.length > 0 && (
          <Card className="mt-4">
            <p className="text-sm font-semibold">Approved by you</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {approved.map((a, i) => (
                <li key={i}>✓ {a}</li>
              ))}
            </ul>
          </Card>
        )}
        <button onClick={reset} className="mt-6 w-full text-center text-xs text-muted underline">
          Reset demo
        </button>
      </div>
    );
  }

  return (
    <div className="rise">
      <PageTitle
        kicker="Fix"
        title={base.status === "red" ? `${money(-base.lowest.balance)} short on ${fmtDay(base.lowest.date)}` : `Tight on ${fmtDay(base.lowest.date)}`}
        sub={
          causes.length
            ? `${causes.map((c) => `${c.label} (${money(c.amount)}, ${fmtDay(c.date)})`).join(", ")} all land before your ${base.nextPayday ? fmtDay(base.nextPayday) : "next"} paycheck.`
            : undefined
        }
      />

      {/* Two timelines */}
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <p className="font-semibold">Two futures</p>
          {fix && <Pill status={fix.forecast.status} />}
        </div>
        <TimelineChart
          series={[
            { name: "Do nothing", forecast: base, color: "#e0393e", dashed: true },
            ...(fix && fix.id !== "nothing" ? [{ name: "With fix", forecast: fix.forecast, color: "#12a150" }] : []),
          ]}
        />
        <Legend
          items={[
            { label: "If I do nothing", color: "#e0393e", dashed: true },
            ...(fix && fix.id !== "nothing" ? [{ label: "If I tap the fix", color: "#12a150" }] : []),
          ]}
        />
      </Card>

      {/* Fix options */}
      <h2 className="mb-3 mt-6 text-lg font-bold">Pick a fix</h2>
      <div className="space-y-3">
        {fixes.map((f) => {
          const on = f.id === fix?.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelected(f.id)}
              className={`w-full rounded-2xl border-2 bg-white p-4 text-left transition ${on ? "border-accent" : "border-transparent"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <IconBadge name={FIX_ICONS[f.id.split("-")[0]]?.icon ?? "bolt"} tone={FIX_ICONS[f.id.split("-")[0]]?.tone ?? "green"} />
                <div className="flex-1">
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{f.detail}</p>
                  {f.id !== "nothing" && (
                    <p className={`mt-1.5 text-xs font-semibold ${f.resolves ? "text-good" : "text-warn"}`}>
                      {f.resolves ? `✓ Lowest balance becomes ${money(f.forecast.lowest.balance)}` : "Helps, but doesn't fully fix it"}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${f.cost === 0 ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
                  {f.costLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {msg && <p className="mt-4 rounded-2xl bg-bad-soft px-4 py-3 text-sm text-bad">{msg}</p>}

      {fix && fix.id !== "nothing" && (
        <div className="sticky bottom-[84px] -mx-5 mt-5 bg-gradient-to-t from-canvas via-canvas to-canvas/0 px-5 pb-2 pt-6 sm:bottom-0">
          <button
            disabled={busy}
            onClick={() => onApprove(fix)}
            className="w-full rounded-2xl bg-accent py-4 text-base font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[.98] disabled:opacity-60"
          >
            {busy
              ? "Working…"
              : fix.action?.type === "move"
                ? `Approve: move ${money(fix.action.amount)}`
                : fix.action?.type === "request"
                  ? `Request ${money(fix.action.amount)} from ${fix.action.friendName}`
                  : "Approve this fix"}
          </button>
          <p className="mt-2 text-center text-xs text-muted">Nothing happens until you tap. Kit never moves money on its own.</p>
        </div>
      )}
    </div>
  );
}
