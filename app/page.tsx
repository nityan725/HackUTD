"use client";
import Link from "next/link";
import HealthGrid from "@/components/HealthGrid";
import { Icon, IconBadge } from "@/components/Icon";
import SignOutButton from "@/components/SignOutButton";
import TimelineChart from "@/components/TimelineChart";
import { Card, DataNote, ErrorBox, Loading, Pill } from "@/components/ui";
import { config } from "@/lib/config";
import { diffDays, fmtDay } from "@/lib/dates";
import { crunchCauses } from "@/lib/forecast";
import { hours, money } from "@/lib/format";
import { netWorth } from "@/lib/networth";
import { nextMoves } from "@/lib/nextmove";
import { useRunway } from "@/lib/store";

export default function Home() {
  const { loading, error, snap, base, scores } = useRunway();
  if (loading) return <Loading />;
  if (error || !snap || !base) return <ErrorBox msg={error ?? "No data"} />;

  const daysToPayday = base.nextPayday ? diffDays(base.today, base.nextPayday) : null;
  const causes = crunchCauses(base);
  const loans = snap.loans.length;

  return (
    <div className="rise">
      <DataNote note={snap.note} />

      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{fmtDay(base.today)}</p>
          <h1 className="text-2xl font-bold tracking-tight">Hi {snap.customerName}</h1>
        </div>
        <SignOutButton />
      </header>
      <p className="-mt-2 mb-4 inline-block rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
        Watching {snap.accounts.length} accounts{loans ? ` + ${loans} loan${loans > 1 ? "s" : ""}` : ""}
      </p>

      {/* The one number */}
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted">Safe to spend</p>
          <Pill status={base.status} />
        </div>
        <p className="tabular mt-1 text-[56px] font-extrabold leading-none tracking-tight">{money(base.safeToSpend)}</p>
        <p className="mt-2 text-sm text-muted">
          {base.nextPayday ? <>until payday, {fmtDay(base.nextPayday)}</> : "for the next 30 days"}
          {base.safeToSpend > 0 && <> · = {hours(base.safeToSpend / config.hourlyWage)} of work</>}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div>
            <p className="text-xs text-muted">Money lasts</p>
            <p className="tabular text-lg font-bold">
              {base.runwayDays > config.horizonDays ? `${config.horizonDays}+ days` : `${base.runwayDays} days`}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Next paycheck</p>
            <p className="tabular text-lg font-bold">
              {daysToPayday !== null ? `${daysToPayday} days · ${money(base.paycheck.amount)}` : "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* Crunch alert */}
      {base.status !== "green" && (
        <Link href="/fix" className="mt-4 block">
          <div className={`rounded-3xl p-5 ${base.status === "red" ? "bg-bad text-white" : "bg-warn-soft text-ink"}`}>
            <div className="flex items-center gap-2">
              <IconBadge name="alert" tone={base.status === "red" ? "white" : "amber"} size="sm" />
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {base.status === "red" ? "Cash crunch ahead" : "Getting tight"}
              </p>
            </div>
            <p className="mt-1 text-lg font-bold leading-snug">
              {base.status === "red"
                ? `You'll be ${money(-base.lowest.balance)} short on ${fmtDay(base.lowest.date)}`
                : `Checking dips to ${money(base.lowest.balance)} on ${fmtDay(base.lowest.date)}`}
            </p>
            {causes.length > 0 && (
              <p className="mt-1 text-sm opacity-90">
                {causes.map((c) => `${c.label} (${money(c.amount)})`).join(", ")} hit before your paycheck.
              </p>
            )}
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold">
              See fixes →
            </p>
          </div>
        </Link>
      )}

      {/* Your next moves */}
      <h2 className="mb-3 mt-6 text-lg font-bold">{base.status === "green" ? "Your next moves" : "After that"}</h2>
      <Card flush className="divide-y divide-line">
        {nextMoves(snap, base).map((m, i) => (
          <Link key={m.id} href={m.href} className="flex items-center gap-3 px-4 py-3.5">
            <span className="relative">
              <IconBadge name={m.icon} tone={m.tone} />
              <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white">{i + 1}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-snug">{m.title}</span>
              <span className="block text-xs text-muted">{m.why}</span>
            </span>
            <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">{m.cta}</span>
          </Link>
        ))}
      </Card>

      {/* Mini forecast */}
      <Card className="mt-4">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="font-semibold">Checking, next 30 days</p>
          <p className="text-xs text-muted">lowest {money(base.lowest.balance)}</p>
        </div>
        <TimelineChart series={[{ name: "Balance", forecast: base, color: "#1E8C80", fill: true }]} height={160} />
      </Card>

      {/* Health scores */}
      <h2 className="mb-3 mt-6 text-lg font-bold">Financial health</h2>
      <HealthGrid scores={scores} />

      {/* All accounts */}
      <h2 className="mb-3 mt-6 text-lg font-bold">Everything Kit sees</h2>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Link href="/worth" className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
          <IconBadge name="target" tone="teal" size="sm" />
          <p className="mt-2 text-xs text-muted">Net worth</p>
          <p className={`tabular text-xl font-bold ${netWorth(snap).netWorth < 0 ? "text-bad" : ""}`}>{money(netWorth(snap).netWorth)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent">
            All {netWorth(snap).count} accounts <Icon name="chevron" className="h-3 w-3" />
          </p>
        </Link>
        <Link href="/pay" className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
          <IconBadge name="users" tone="blue" size="sm" />
          <p className="mt-2 text-xs text-muted">Pay & request</p>
          <p className="text-xl font-bold">Friends</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent">
            Settle up <Icon name="chevron" className="h-3 w-3" />
          </p>
        </Link>
      </div>
      <Card flush className="divide-y divide-line">
        {snap.accounts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
            <IconBadge
              name={a.type === "Savings" ? "coins" : a.type === "Credit Card" ? "card" : "bank"}
              tone={a.type === "Savings" ? "green" : a.type === "Credit Card" ? "purple" : "blue"}
            />
            <div className="flex-1">
              <p className="font-medium">{a.nickname}</p>
              <p className="text-xs text-muted">{a.type}</p>
            </div>
            <p className={`tabular font-semibold ${a.type === "Credit Card" ? "text-bad" : ""}`}>
              {a.type === "Credit Card" ? `${money(a.balance)} owed` : money(a.balance)}
            </p>
          </div>
        ))}
        {snap.loans.map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
            <IconBadge name="car" tone="orange" />
            <div className="flex-1">
              <p className="font-medium">{l.description}</p>
              <p className="text-xs text-muted">Loan · {money(l.amount)}</p>
            </div>
            <p className="tabular font-semibold">{money(l.monthlyPayment)}/mo</p>
          </div>
        ))}
        <div className="px-5 py-3.5 text-xs text-muted">
          {snap.bills.length} recurring bills · data from {snap.source === "nessie" ? "Capital One Nessie" : "demo data"}
        </div>
      </Card>
    </div>
  );
}
