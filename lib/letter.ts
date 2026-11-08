// Everything in the letter is computed here in code. The AI only turns these
// facts into friendly sentences, and is told not to invent any numbers.
import { config, SUBSCRIPTION_PATTERN } from "./config";
import { addDays, fmtDay, monthName } from "./dates";
import { healthScores, monthlyNumbers } from "./health";
import { card, checking, savings } from "./snapshot";
import type { Forecast, Snapshot } from "./types";

export interface LetterFacts {
  name: string;
  month: string;
  moneyIn30: number;
  spent30: number;
  topCategories: { name: string; amount: number }[];
  dailySpend: number;
  safeToSpend: number;
  nextPayday: string | null;
  scores: { name: string; value: string; status: string }[];
  win: string;
  risk: string;
  actions: string[];
}

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export function letterFacts(snap: Snapshot, f: Forecast): LetterFacts {
  const since = addDays(f.today, -30);
  const chk = checking(snap);
  const recent = snap.txs.filter((t) => t.accountId === chk?.id && t.date >= since && t.date <= f.today);
  const moneyIn30 = recent.filter((t) => t.kind === "deposit" && /pay/i.test(t.description)).reduce((s, t) => s + t.amount, 0);
  const buys = recent.filter((t) => t.kind === "purchase");
  const spent30 = buys.reduce((s, t) => s + t.amount, 0);

  const cats = new Map<string, number>();
  for (const b of buys) cats.set(b.description, (cats.get(b.description) ?? 0) + b.amount);
  const topCategories = [...cats.entries()]
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const scores = healthScores(snap, f);
  const m = monthlyNumbers(snap, f);

  // Win: the best score
  const best = scores.find((s) => s.status === "green") ?? scores.find((s) => s.status === "yellow");
  const win = best
    ? `${best.name} is ${best.status === "green" ? "healthy" : "close to healthy"} at ${best.value}.`
    : `Everyday spending averaged ${usd(f.dailySpend)}/day.`;

  // Risk: the next crunch, or the worst score
  const worst = scores.find((s) => s.status === "red");
  const risk =
    f.status === "red"
      ? `Checking is on track to hit ${usd(f.lowest.balance).replace("$-", "–$")} on ${fmtDay(f.lowest.date)}.`
      : worst
        ? `${worst.name} is low (${worst.value}). ${worst.explain}`
        : "No big risks in the next 30 days.";

  // Actions, each with a dollar value
  const actions: string[] = [];
  const sav = savings(snap);
  if (sav && m.expenses > sav.balance) {
    const gap = m.expenses - sav.balance;
    const per = 50;
    const paychecks = Math.ceil(gap / per);
    const date = addDays(f.today, paychecks * f.paycheck.cadence);
    actions.push(
      `Move ${usd(per)} from each paycheck to savings to reach a 1-month cushion (${usd(m.expenses)}) by ${monthName(date)}.`,
    );
  }
  const cc = card(snap);
  if (cc && cc.balance > 0.3 * config.cardLimit) {
    const payDown = cc.balance - 0.3 * config.cardLimit;
    actions.push(`Pay ${usd(payDown)} extra on the card to get credit use under 30%.`);
  }
  const subs = snap.bills.filter((b) => SUBSCRIPTION_PATTERN.test(b.payee));
  if (subs.length) {
    const yearly = subs.reduce((s, b) => s + b.amount, 0) * 12;
    actions.push(`Your subscriptions (${subs.map((b) => b.payee).join(", ")}) cost ${usd(yearly)}/year. Cancel one you don't use.`);
  }
  if (topCategories[0]) {
    const cut = topCategories[0].amount * 0.2;
    actions.push(`Cutting ${topCategories[0].name.toLowerCase()} by 20% saves about ${usd(cut)} a month.`);
  }

  return {
    name: snap.customerName,
    month: monthName(f.today),
    moneyIn30: Math.round(moneyIn30),
    spent30: Math.round(spent30),
    topCategories,
    dailySpend: f.dailySpend,
    safeToSpend: f.safeToSpend,
    nextPayday: f.nextPayday ? fmtDay(f.nextPayday) : null,
    scores: scores.map((s) => ({ name: s.name, value: s.value, status: s.status })),
    win,
    risk,
    actions: actions.slice(0, 3),
  };
}

/** Used when no AI key is set (or the AI call fails), so the feature always works. */
export function templateLetter(x: LetterFacts): string {
  return [
    `Hey ${x.name},`,
    ``,
    `It's you, a month from now. Here's how ${x.month} is shaping up.`,
    ``,
    `In the last 30 days, ${usd(x.moneyIn30)} came in from paychecks and you spent ${usd(x.spent30)} on everyday things` +
      (x.topCategories.length ? `, mostly ${x.topCategories.map((c) => `${c.name.toLowerCase()} (${usd(c.amount)})`).join(", ")}.` : "."),
    ``,
    `The win: ${x.win}`,
    `The risk: ${x.risk}`,
    ``,
    `Three moves for this month:`,
    ...x.actions.map((a, i) => `${i + 1}. ${a}`),
    ``,
    `You've got ${usd(x.safeToSpend)} safe to spend${x.nextPayday ? ` until ${x.nextPayday}` : ""}. I believe in us.`,
    ``,
    `— Future you`,
  ].join("\n");
}
