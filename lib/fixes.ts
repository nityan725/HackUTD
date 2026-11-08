import { config, SUBSCRIPTION_PATTERN } from "./config";
import { forecast, mergeChanges } from "./forecast";
import { card, checking, savings } from "./snapshot";
import type { Changes, Forecast, Snapshot } from "./types";

export interface Fix {
  id: string;
  title: string;
  detail: string;
  cost: number;
  costLabel: string;
  changes: Changes; // what this fix does to the forecast
  action?: { type: "move"; amount: number; fromId: string; toId: string }; // written to Nessie
  forecast: Forecast;
  resolves: boolean;
}

/** Build the ranked list of fixes for the current crunch. `plan` = fixes already approved. */
export function buildFixes(snap: Snapshot, base: Forecast, plan: Changes = {}): Fix[] {
  if (base.status === "green") return [];
  const fixes: Fix[] = [];
  const chk = checking(snap);
  const sav = savings(snap);
  const cc = card(snap);
  const run = (c: Changes) => forecast(snap, mergeChanges(plan, c), base.today);

  // 1. Move money from savings
  if (sav && chk && sav.balance > 0) {
    const need = Math.ceil((config.fixTarget - base.lowest.balance) / 10) * 10;
    const amount = Math.min(need, Math.floor(sav.balance));
    if (amount > 0) {
      const changes = { startDelta: amount };
      const f = run(changes);
      fixes.push({
        id: "move",
        title: `Move ${usd(amount)} from savings`,
        detail: `Savings goes from ${usd(sav.balance)} to ${usd(sav.balance - amount)}. Happens instantly.`,
        cost: 0,
        costLabel: "$0",
        changes,
        action: { type: "move", amount, fromId: sav.id, toId: chk.id },
        forecast: f,
        resolves: f.lowest.balance >= 0,
      });
    }
  }

  // 2. Pay only the card minimum this month (if the card payment lands before the low point)
  const cardHit = base.days.some(
    (d) => d.date <= base.lowest.date && d.events.some((e) => e.kind === "card"),
  );
  if (cc && cardHit && cc.balance > config.cardMinPayment && plan.cardPayment === undefined) {
    const carried = cc.balance - config.cardMinPayment;
    const interest = Math.round(((carried * config.cardAPR) / 12) * 100) / 100;
    const changes = { cardPayment: config.cardMinPayment };
    const f = run(changes);
    fixes.push({
      id: "cardmin",
      title: `Pay the card minimum (${usd(config.cardMinPayment)})`,
      detail: `Keeps ${usd(carried)} in checking. You'll pay about ${usd(interest, true)} in interest.`,
      cost: interest,
      costLabel: `~${usd(interest, true)}`,
      changes,
      forecast: f,
      resolves: f.lowest.balance >= 0,
    });
  }

  // 3. Pause subscriptions due before the low point
  const subs = snap.bills.filter(
    (b) =>
      SUBSCRIPTION_PATTERN.test(b.payee) &&
      !(plan.skipBills ?? []).includes(b.payee) &&
      base.days.some((d) => d.date <= base.lowest.date && d.events.some((e) => e.label === b.payee)),
  );
  if (subs.length) {
    const saved = subs.reduce((s, b) => s + b.amount, 0);
    const changes = { skipBills: subs.map((b) => b.payee) };
    const f = run(changes);
    fixes.push({
      id: "pause",
      title: `Pause ${subs.map((b) => b.payee).join(" + ")}`,
      detail: `Saves ${usd(saved, true)} this month. Turn them back on after payday.`,
      cost: 0,
      costLabel: "$0",
      changes,
      forecast: f,
      resolves: f.lowest.balance >= 0,
    });
  }

  // 4. Do nothing
  const fee = base.status === "red" ? config.overdraftFee : 0;
  fixes.push({
    id: "nothing",
    title: "Do nothing",
    detail:
      base.status === "red"
        ? `Checking goes negative. Expect a ${usd(config.overdraftFee)} overdraft fee.`
        : "You stay above $0, but with almost no cushion.",
    cost: fee,
    costLabel: fee ? `${usd(fee)} fee` : "$0 (risky)",
    changes: {},
    forecast: base,
    resolves: base.status !== "red",
  });

  // Fixes that solve the problem first, then cheapest
  const body = fixes.filter((f) => f.id !== "nothing");
  body.sort((a, b) => Number(b.resolves) - Number(a.resolves) || a.cost - b.cost);
  return [...body, fixes[fixes.length - 1]];
}

function usd(n: number, cents = false) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
}
