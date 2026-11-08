import { config } from "./config";
import { addDays } from "./dates";
import { card, savings } from "./snapshot";
import type { Forecast, Snapshot, Status } from "./types";

export interface Score {
  id: string;
  name: string;
  value: string;
  status: Status;
  explain: string;
}

export function monthlyNumbers(snap: Snapshot, f: Forecast) {
  const income = f.paycheck.amount * (30 / f.paycheck.cadence);
  const bills = snap.bills.reduce((s, b) => s + b.amount, 0);
  const loans = snap.loans.reduce((s, l) => s + l.monthlyPayment, 0);
  const cc = card(snap);
  const cardMin = cc && cc.balance > 0 ? config.cardMinPayment : 0;
  const spending = f.dailySpend * 30;
  return { income, bills, loans, cardMin, spending, expenses: bills + loans + cardMin + spending };
}

const grade = (v: number, good: number, ok: number, higherIsBetter = true): Status =>
  higherIsBetter ? (v >= good ? "green" : v >= ok ? "yellow" : "red") : v <= good ? "green" : v <= ok ? "yellow" : "red";

export function healthScores(snap: Snapshot, f: Forecast): Score[] {
  const m = monthlyNumbers(snap, f);
  const sav = savings(snap)?.balance ?? 0;
  const cc = card(snap);

  // 1. Cash cushion: months of expenses covered by savings
  const cushion = m.expenses > 0 ? sav / m.expenses : 0;

  // 2. Debt load: monthly debt payments / monthly income
  const debt = m.income > 0 ? (m.loans + m.cardMin) / m.income : 0;

  // 3. Credit use: card balance / limit
  const util = cc ? Math.max(0, cc.balance) / config.cardLimit : 0;

  // 4. 30-day coverage: (checking now + income next 30 days) / money going out next 30 days
  const end = addDays(f.today, 30);
  let inflow = f.start;
  let outflow = 0;
  for (const d of f.days) {
    if (d.date > end) break;
    for (const e of d.events) {
      if (e.amount > 0) inflow += e.amount;
      else outflow -= e.amount;
    }
  }
  const coverage = outflow > 0 ? inflow / outflow : 9;

  return [
    {
      id: "cushion",
      name: "Cash cushion",
      value: `${cushion.toFixed(1)} mo`,
      status: grade(cushion, 3, 1),
      explain: `Savings would cover ${cushion.toFixed(1)} months of expenses. Goal: 3+.`,
    },
    {
      id: "debt",
      name: "Debt load",
      value: `${Math.round(debt * 100)}%`,
      status: grade(debt, 0.2, 0.36, false),
      explain: `${Math.round(debt * 100)}% of income goes to loan and card payments. Under 20% is healthy.`,
    },
    {
      id: "credit",
      name: "Credit use",
      value: `${Math.round(util * 100)}%`,
      status: grade(util, 0.3, 0.5, false),
      explain: `Using ${Math.round(util * 100)}% of your card limit. Under 30% helps your credit score.`,
    },
    {
      id: "coverage",
      name: "30-day coverage",
      value: `${coverage.toFixed(2)}×`,
      status: grade(coverage, 1.2, 1),
      explain: `Money coming in covers ${coverage.toFixed(2)}× what's going out in the next 30 days.`,
    },
  ];
}
