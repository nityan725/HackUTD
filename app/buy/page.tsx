"use client";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import TimelineChart, { Legend } from "@/components/TimelineChart";
import { Card, ErrorBox, Loading, PageTitle } from "@/components/ui";
import { checkPurchase } from "@/lib/buy";
import { config } from "@/lib/config";
import { hours, money } from "@/lib/format";
import { useRunway } from "@/lib/store";

const QUICK = [
  { label: "Dinner out", amount: 60, icon: "utensils", color: "text-orange-500" },
  { label: "Concert ticket", amount: 140, icon: "ticket", color: "text-pink-500" },
  { label: "New laptop", amount: 600, icon: "laptop", color: "text-sky-500" },
  { label: "Gym membership", amount: 29, monthly: true, icon: "dumbbell", color: "text-violet-500" },
];

const verdictStyle = {
  go: { bg: "bg-good", icon: "check" },
  gobut: { bg: "bg-warn", icon: "alert" },
  wait: { bg: "bg-bad", icon: "clock" },
};

export default function BuyPage() {
  const { loading, error, snap, base, plan } = useRunway();
  const [amountText, setAmountText] = useState("");
  const [monthly, setMonthly] = useState(false);
  const amount = Number(amountText);

  const result = useMemo(() => {
    if (!snap || !base || !(amount > 0)) return null;
    return checkPurchase(snap, base, plan, amount, monthly);
  }, [snap, base, plan, amount, monthly]);

  if (loading) return <Loading />;
  if (error || !base) return <ErrorBox msg={error ?? "No data"} />;

  return (
    <div className="rise">
      <PageTitle kicker="Buy-it-now check" title="Can I afford it?" sub="Checked against all your accounts and every bill before payday." />

      <Card>
        <label className="text-sm font-medium text-muted" htmlFor="amt">
          How much?
        </label>
        <div className="mt-1 flex items-center gap-1 border-b-2 border-line pb-2 focus-within:border-accent">
          <span className="text-3xl font-bold text-muted">$</span>
          <input
            id="amt"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            className="tabular w-full bg-transparent text-4xl font-extrabold outline-none"
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={monthly} onChange={(e) => setMonthly(e.target.checked)} className="h-4 w-4 accent-[#1E8C80]" />
          This repeats every month
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                setAmountText(String(q.amount));
                setMonthly(!!q.monthly);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-medium hover:bg-accent-soft"
            >
              <Icon name={q.icon} className={`h-3.5 w-3.5 ${q.color}`} />
              {q.label} · ${q.amount}
              {q.monthly ? "/mo" : ""}
            </button>
          ))}
        </div>
      </Card>

      {result && (
        <div className="rise mt-4 space-y-4" key={`${amount}-${monthly}`}>
          {/* Verdict */}
          <div className={`rounded-3xl p-5 text-white ${verdictStyle[result.verdict].bg}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25">
                <Icon name={verdictStyle[result.verdict].icon} className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <p className="text-2xl font-bold leading-tight">{result.headline}</p>
            </div>
            <p className="mt-2 text-sm opacity-95">{result.reason}</p>
          </div>

          {/* Cost in time */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted">Costs you</p>
              <p className="tabular mt-1 text-2xl font-bold">{hours(result.hoursOfWork)}</p>
              <p className="text-xs text-muted">of work</p>
            </Card>
            <Card className="p-4">
              {result.yearlyCost ? (
                <>
                  <p className="text-xs text-muted">Over a year</p>
                  <p className="tabular mt-1 text-2xl font-bold">{money(result.yearlyCost)}</p>
                  <p className="text-xs text-muted">{hours(result.yearlyCost / config.hourlyWage)} of work</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted">Lowest balance</p>
                  <p className={`tabular mt-1 text-2xl font-bold ${result.withPurchase.lowest.balance < 0 ? "text-bad" : ""}`}>
                    {money(result.withPurchase.lowest.balance)}
                  </p>
                  <p className="text-xs text-muted">if paid from checking</p>
                </>
              )}
            </Card>
          </div>

          {/* Ways to pay */}
          <Card flush className="pb-1">
            <p className="px-5 pt-4 font-semibold">Ways to pay</p>
            <ul className="mt-2 divide-y divide-line">
              {result.methods.map((m) => (
                <li key={m.id} className="flex gap-3 px-5 py-3">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${m.ok ? "bg-good" : "bg-bad"}`}>
                    <Icon name={m.ok ? "check" : "x"} className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {m.label}
                      {m.best && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">BEST</span>}
                    </p>
                    <p className="text-xs text-muted">{m.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Preview */}
          <Card>
            <p className="mb-1 font-semibold">If you pay from checking today</p>
            <TimelineChart
              series={[
                { name: "Without it", forecast: base, color: "#94a3b8", dashed: true },
                { name: "With it", forecast: result.withPurchase, color: "#1E8C80" },
              ]}
              height={160}
            />
            <Legend items={[{ label: "Without it", color: "#94a3b8", dashed: true }, { label: "With it", color: "#1E8C80" }]} />
          </Card>
        </div>
      )}
    </div>
  );
}
