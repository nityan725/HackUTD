import { config } from "./config";
import { fmtDay } from "./dates";
import { forecast, mergeChanges } from "./forecast";
import { monthlyNumbers } from "./health";
import { card, savings } from "./snapshot";
import type { Changes, Forecast, Snapshot } from "./types";

export type Verdict = "go" | "gobut" | "wait";

export interface BuyResult {
  verdict: Verdict;
  headline: string;
  reason: string;
  hoursOfWork: number;
  runwayLost: number; // days of runway the purchase costs (if paid from checking)
  yearlyCost: number | null;
  methods: { id: string; label: string; ok: boolean; note: string; best?: boolean }[];
  withPurchase: Forecast; // forecast if paid from checking today
  waitDate: string | null;
}

export function checkPurchase(
  snap: Snapshot,
  base: Forecast,
  plan: Changes,
  amount: number,
  monthly: boolean,
): BuyResult {
  const hoursOfWork = amount / config.hourlyWage;
  const charge = (offset: number): Changes => ({
    oneTime: [
      { offset, amount: -amount, label: "This purchase" },
      ...(monthly ? [{ offset: offset + 30, amount: -amount, label: "This purchase (month 2)" }] : []),
    ],
  });
  const run = (c: Changes) => forecast(snap, mergeChanges(plan, c), base.today);

  // Pay from checking today
  const withPurchase = run(charge(0));
  const checkingOk = withPurchase.lowest.balance >= config.buffer;

  // Pay with the card
  const cc = card(snap);
  const utilAfter = cc ? (cc.balance + amount) / config.cardLimit : 1;
  const interest3mo = (amount * config.cardAPR * 3) / 12;
  const cardOk = !!cc && utilAfter < 0.5;

  // Pay from savings
  const sav = savings(snap);
  const m = monthlyNumbers(snap, base);
  const cushionAfter = sav && m.expenses > 0 ? (sav.balance - amount) / m.expenses : 0;
  const savingsOk = !!sav && sav.balance >= amount && cushionAfter >= 1;

  // Wait: first day the purchase fits without dropping below the buffer
  let waitDate: string | null = null;
  for (let i = 1; i <= config.horizonDays; i++) {
    if (run(charge(i)).lowest.balance >= Math.min(config.buffer, base.lowest.balance)) {
      waitDate = base.days[i].date;
      break;
    }
  }

  const methods: BuyResult["methods"] = [
    {
      id: "checking",
      label: "Checking",
      ok: checkingOk,
      note: checkingOk
        ? `Lowest balance stays at ${usd(withPurchase.lowest.balance)}.`
        : withPurchase.lowest.balance < 0
          ? `Goes negative (${usd(withPurchase.lowest.balance)}) on ${fmtDay(withPurchase.lowest.date)}.`
          : `Leaves only ${usd(withPurchase.lowest.balance)} on ${fmtDay(withPurchase.lowest.date)}.`,
    },
    {
      id: "card",
      label: "Credit card",
      ok: cardOk,
      note: cc
        ? `Credit use ${Math.round((cc.balance / config.cardLimit) * 100)}% → ${Math.round(utilAfter * 100)}%. ~${usd(interest3mo)} interest if paid over 3 months.`
        : "No credit card on file.",
    },
    {
      id: "savings",
      label: "Savings",
      ok: savingsOk,
      note: sav
        ? `Cushion drops to ${Math.max(0, cushionAfter).toFixed(1)} months of expenses.`
        : "No savings account.",
    },
    {
      id: "wait",
      label: "Wait",
      ok: !!waitDate,
      note: waitDate ? `Fits safely on ${fmtDay(waitDate)}.` : "Doesn't fit safely in the next 30 days.",
    },
  ];

  let verdict: Verdict;
  let headline: string;
  let reason: string;
  if (checkingOk) {
    verdict = "go";
    headline = "Go for it";
    reason = "Pay from checking. You stay safely above your buffer.";
    methods[0].best = true;
  } else if (cardOk || savingsOk) {
    verdict = "gobut";
    const best = cardOk ? methods[1] : methods[2];
    best.best = true;
    headline = `Go, but use ${best.label.toLowerCase()}`;
    reason = `Checking can't take it before payday. ${best.note}`;
  } else {
    verdict = "wait";
    methods[3].best = true;
    headline = waitDate ? `Wait until ${fmtDay(waitDate)}` : "Hold off for now";
    reason = waitDate
      ? "Every way to pay today puts you at risk. After that date it fits."
      : "This doesn't fit your next 30 days without a crunch.";
  }

  const runwayLost = Math.max(0, base.runwayDays - withPurchase.runwayDays);

  return {
    verdict,
    headline,
    reason,
    hoursOfWork,
    runwayLost,
    yearlyCost: monthly ? amount * 12 : null,
    methods,
    withPurchase,
    waitDate,
  };
}

function usd(n: number) {
  return (n < 0 ? "–$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
}
