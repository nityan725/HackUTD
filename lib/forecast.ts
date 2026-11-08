// THE ENGINE. Every feature (home, fixes, buy check, stress test, letter)
// calls forecast() with different Changes. The math is plain code, not AI.
import { config } from "./config";
import { addDays, diffDays, isDueOn, today as getToday } from "./dates";
import { card, checking } from "./snapshot";
import type { Changes, DayPoint, Event, Forecast, Snapshot, Status } from "./types";

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Find paychecks in checking deposits: how much, how often, and when the next one lands. */
export function detectPaycheck(snap: Snapshot, today = getToday()) {
  const chk = checking(snap);
  const pays = snap.txs
    .filter((t) => t.kind === "deposit" && t.accountId === chk?.id && /pay|salary|payroll/i.test(t.description))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!pays.length) return { amount: 0, cadence: 14, next: null as string | null };
  const gaps = pays.slice(1).map((p, i) => diffDays(pays[i].date, p.date));
  const cadence = Math.round(median(gaps)) || 14;
  const amount = median(pays.map((p) => p.amount));
  let next = pays[pays.length - 1].date;
  while (next <= today) next = addDays(next, cadence);
  return { amount, cadence, next };
}

/** Average everyday spending per day, from recent checking purchases. */
export function detectDailySpend(snap: Snapshot, today = getToday()) {
  const chk = checking(snap);
  const since = addDays(today, -45);
  const buys = snap.txs.filter(
    (t) => t.kind === "purchase" && t.accountId === chk?.id && t.date >= since && t.date <= today,
  );
  if (!buys.length) return 0;
  const earliest = buys.reduce((m, t) => (t.date < m ? t.date : m), buys[0].date);
  const span = Math.max(14, diffDays(earliest, today));
  return r2(buys.reduce((s, t) => s + t.amount, 0) / span);
}

export function forecast(snap: Snapshot, changes: Changes = {}, today = getToday()): Forecast {
  const chk = checking(snap);
  const cc = card(snap);
  const pay = detectPaycheck(snap, today);
  const dailySpend = detectDailySpend(snap, today);
  const paycheckAmount = Math.max(0, pay.amount + (changes.incomeDeltaPerPaycheck ?? 0));
  const skip = new Set((changes.skipBills ?? []).map((s) => s.toLowerCase()));

  const start = r2((chk?.balance ?? 0) + (changes.startDelta ?? 0));
  let balance = start;
  let cardPaid = false;
  const days: DayPoint[] = [];

  for (let i = 0; i <= config.horizonDays; i++) {
    const date = addDays(today, i);
    const events: Event[] = [];

    for (const o of changes.oneTime ?? []) {
      if (o.offset === i) events.push({ label: o.label, amount: o.amount, kind: "oneTime" });
    }

    if (i > 0) {
      // Paydays
      if (pay.next && paycheckAmount > 0 && diffDays(pay.next, date) >= 0 && diffDays(pay.next, date) % pay.cadence === 0) {
        events.push({ label: "Paycheck", amount: paycheckAmount, kind: "income" });
      }
      // Recurring bills
      for (const b of snap.bills) {
        if (!b.recurringDay || !isDueOn(date, b.recurringDay)) continue;
        if (skip.has(b.payee.toLowerCase())) continue;
        const delta = (changes.billDeltas ?? [])
          .filter((d) => b.payee.toLowerCase().includes(d.match.toLowerCase()))
          .reduce((s, d) => s + d.delta, 0);
        events.push({ label: b.payee, amount: -(b.amount + delta), kind: "bill" });
      }
      // Loans
      if (isDueOn(date, config.loanDueDay)) {
        for (const l of snap.loans) {
          events.push({ label: l.description || `${l.type} loan`, amount: -l.monthlyPayment, kind: "loan" });
        }
      }
      // Credit card: this month's payment, then the minimum after that (future balance is unknown)
      if (cc && cc.balance > 0 && isDueOn(date, config.cardDueDay)) {
        const amt = cardPaid ? config.cardMinPayment : (changes.cardPayment ?? cc.balance);
        events.push({ label: "Credit card payment", amount: -amt, kind: "card" });
        cardPaid = true;
      }
      // Everyday spending
      if (dailySpend > 0) events.push({ label: "Everyday spending", amount: -dailySpend, kind: "spend" });
    }

    balance = r2(balance + events.reduce((s, e) => s + e.amount, 0));
    days.push({ date, balance, events });
  }

  const lowest = days.reduce((m, d) => (d.balance < m.balance ? d : m), days[0]);
  const status: Status = lowest.balance < 0 ? "red" : lowest.balance < config.buffer ? "yellow" : "green";

  // Safe to spend = lowest balance before next payday, minus the buffer
  const paydayIdx = pay.next ? Math.min(diffDays(today, pay.next), days.length) : days.length;
  const window = days.slice(0, Math.max(1, paydayIdx));
  const minBeforePayday = Math.min(...window.map((d) => d.balance));
  const safeToSpend = Math.max(0, Math.floor(minBeforePayday - config.buffer));

  const firstShortIdx = days.findIndex((d) => d.balance < 0);

  return {
    today,
    start,
    days,
    lowest: { date: lowest.date, balance: lowest.balance },
    nextPayday: pay.next,
    paycheck: { amount: paycheckAmount, cadence: pay.cadence },
    dailySpend,
    status,
    safeToSpend,
    runwayDays: firstShortIdx === -1 ? config.horizonDays + 1 : firstShortIdx,
    daysShort: days.filter((d) => d.balance < 0).length,
    firstShortDate: firstShortIdx === -1 ? null : days[firstShortIdx].date,
  };
}

/** The big bills/loans that land between today and the lowest point — used to explain the crunch. */
export function crunchCauses(f: Forecast) {
  const out: { date: string; label: string; amount: number }[] = [];
  for (const d of f.days) {
    if (d.date > f.lowest.date) break;
    for (const e of d.events) {
      if (e.amount < 0 && e.kind !== "spend" && Math.abs(e.amount) >= 50) {
        out.push({ date: d.date, label: e.label, amount: -e.amount });
      }
    }
  }
  return out.sort((a, b) => b.amount - a.amount).slice(0, 3);
}

export function mergeChanges(...cs: Changes[]): Changes {
  return {
    startDelta: cs.reduce((s, c) => s + (c.startDelta ?? 0), 0),
    oneTime: cs.flatMap((c) => c.oneTime ?? []),
    incomeDeltaPerPaycheck: cs.reduce((s, c) => s + (c.incomeDeltaPerPaycheck ?? 0), 0),
    billDeltas: cs.flatMap((c) => c.billDeltas ?? []),
    skipBills: cs.flatMap((c) => c.skipBills ?? []),
    cardPayment: cs.reduce<number | undefined>((v, c) => c.cardPayment ?? v, undefined),
  };
}
