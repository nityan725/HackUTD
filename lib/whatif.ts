// "What if…" chat: turn a question into structured actions, then into forecast Changes.
// The AI (or the built-in parser below) only UNDERSTANDS the question.
// All numbers in the answer come from the forecast engine.
import { config } from "./config";
import { addDays, isDueOn } from "./dates";
import type { Changes, Forecast, Snapshot } from "./types";

export type Action =
  | { type: "oneTime"; amount: number; daysFromNow: number; label: string } // amount > 0 = money out
  | { type: "income"; amount: number; daysFromNow: number; label: string } // one-time money in
  | { type: "billChange"; match: string; delta: number } // monthly bill goes up/down by delta
  | { type: "hoursChange"; hours: number } // + or − hours per pay period
  | { type: "paycheckPercent"; percent: number } // −20 = 20% smaller paychecks
  | { type: "raise"; perHour: number } // + $/hour
  | { type: "skipBill"; match: string }
  | { type: "newMonthly"; amount: number; label: string };

export interface Parsed {
  actions: Action[];
  understood: string[]; // human-readable "how I read it"
}

const num = (s: string) => Number(s.replace(/[$,]/g, ""));
const MONEY = String.raw`\$?\s?(\d[\d,]*(?:\.\d+)?)\s?(k)?`;
const money = (m: string, k?: string) => num(m) * (k ? 1000 : 1);

function when(text: string): number {
  const t = text.toLowerCase();
  if (/tomorrow/.test(t)) return 1;
  if (/next week/.test(t)) return 7;
  if (/next month/.test(t)) return 30;
  const m = t.match(/in (\d+) (day|week)s?/);
  if (m) return Number(m[1]) * (m[2] === "week" ? 7 : 1);
  return 0;
}

/** Built-in parser — works with no AI key. Handles the common phrasings. */
export function parseLocally(question: string, billNames: string[]): Parsed {
  const actions: Action[] = [];
  const understood: string[] = [];
  const parts = question
    .toLowerCase()
    .replace(/^what if\s*/, "")
    .replace(/\?/g, "")
    .split(/,| and | also | plus /)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const p of parts) {
    let m: RegExpMatchArray | null;

    // "cancel netflix and spotify" — the second part has no verb, so reuse "skip"
    const last = actions[actions.length - 1];
    const bareBill = billNames.find((bn) => p.replace(/^(my|the)\s+/, "") === bn.toLowerCase());
    if (bareBill && last?.type === "skipBill") {
      actions.push({ type: "skipBill", match: bareBill });
      understood.push(`Skip ${bareBill} this month`);
      continue;
    }

    // lose my job / no income
    if (/lose my job|get fired|laid off|no (more )?income|stop getting paid/.test(p)) {
      actions.push({ type: "paycheckPercent", percent: -100 });
      understood.push("No more paychecks");
      continue;
    }
    // cancel / pause / skip a bill
    if ((m = p.match(/(?:cancel|pause|skip|stop paying|drop)\s+(?:my\s+)?([a-z+ ]+)/))) {
      const names = m[1].split(/\s*\+\s*|\s+or\s+/);
      for (const n of names) {
        const bill = billNames.find((b) => n.includes(b.toLowerCase()) || b.toLowerCase().includes(n.trim()));
        if (bill) {
          actions.push({ type: "skipBill", match: bill });
          understood.push(`Skip ${bill} this month`);
        }
      }
      if (actions.length) continue;
    }
    // hours: lose 10 hours / work 5 fewer hours / pick up 8 more hours / extra 6 hours
    if ((m = p.match(/(\d+)\s*(?:more|extra|additional|fewer|less)?\s*hours?/)) && /hour/.test(p)) {
      const h = Number(m[1]);
      const down = /lose|fewer|less|cut|drop|reduce/.test(p);
      actions.push({ type: "hoursChange", hours: down ? -h : h });
      understood.push(`${down ? "−" : "+"}${h} hours of work per pay period`);
      continue;
    }
    // raise: $2/hr raise, raise of $3 an hour
    if (/raise|per hour|an hour|\/hr|\/hour/.test(p) && (m = p.match(new RegExp(MONEY)))) {
      const amt = money(m[1], m[2]);
      const down = /cut|lower|less|drop/.test(p) && !/raise/.test(p);
      actions.push({ type: "raise", perHour: down ? -amt : amt });
      understood.push(`${down ? "−" : "+"}$${amt}/hour`);
      continue;
    }
    // paycheck / income percent
    if ((m = p.match(/(\d+)\s?%/)) && /pay|income|paycheck|salary|hours/.test(p)) {
      const pct = Number(m[1]);
      const down = !/raise|up|increase|more|grow/.test(p);
      actions.push({ type: "paycheckPercent", percent: down ? -pct : pct });
      understood.push(`Paychecks ${down ? "−" : "+"}${pct}%`);
      continue;
    }
    // bill change: rent goes up $200 / phone bill drops $20 / rent +150
    const bill = billNames.find((b) => p.includes(b.toLowerCase()));
    if (bill && (m = p.match(new RegExp(MONEY)))) {
      const amt = money(m[1], m[2]);
      const down = /down|drop|lower|less|decrease|cheaper|cut|save/.test(p);
      actions.push({ type: "billChange", match: bill, delta: down ? -amt : amt });
      understood.push(`${bill} ${down ? "−" : "+"}$${amt}/month`);
      continue;
    }
    // new monthly cost: $30/month gym, subscription for $15 a month
    if (/(per|a|\/)\s?(month|mo)\b|monthly|subscription|membership/.test(p) && (m = p.match(new RegExp(MONEY)))) {
      const amt = money(m[1], m[2]);
      const label = (p.match(/(gym|netflix|spotify|hulu|subscription|membership|insurance|phone|class|car)/)?.[1] ?? "New monthly cost").replace(/^./, (c) => c.toUpperCase());
      actions.push({ type: "newMonthly", amount: amt, label });
      understood.push(`New ${label.toLowerCase()} · $${amt}/month`);
      continue;
    }
    // money in: get a $500 bonus / tax refund of $300 / someone pays me back $50
    if (/bonus|refund|gift|pays? me|win|get paid|receive|earn/.test(p) && (m = p.match(new RegExp(MONEY)))) {
      const amt = money(m[1], m[2]);
      const d = when(p);
      actions.push({ type: "income", amount: amt, daysFromNow: d, label: "Extra money in" });
      understood.push(`+$${amt} coming in${d ? ` in ${d} days` : " today"}`);
      continue;
    }
    // any other amount = one-time expense: $800 car repair, buy a $600 laptop
    if ((m = p.match(new RegExp(MONEY)))) {
      const amt = money(m[1], m[2]);
      const d = when(p);
      const label = p.replace(new RegExp(MONEY, "g"), "").replace(/\b(i|my|a|an|the|buy|spend|on|for|pay|need|needs|to|have|get|tomorrow|next week|next month|in \d+ (day|week)s?)\b/g, "").replace(/\s+/g, " ").trim() || "One-time cost";
      actions.push({ type: "oneTime", amount: amt, daysFromNow: d, label: label.replace(/^./, (c) => c.toUpperCase()) });
      understood.push(`One-time $${amt} · ${label}${d ? ` in ${d} days` : " today"}`);
      continue;
    }
  }
  return { actions, understood };
}

/** Make sure AI output is safe and well-formed before we use it. */
export function sanitize(raw: unknown): Action[] {
  if (!Array.isArray(raw)) return [];
  const out: Action[] = [];
  const n = (x: unknown, lo: number, hi: number) => (typeof x === "number" && isFinite(x) ? Math.max(lo, Math.min(hi, x)) : null);
  const s = (x: unknown) => (typeof x === "string" ? x.slice(0, 40) : "");
  for (const a of raw.slice(0, 6) as Record<string, unknown>[]) {
    switch (a?.type) {
      case "oneTime":
      case "income": {
        const amount = n(a.amount, 0, 100000);
        if (amount) out.push({ type: a.type, amount, daysFromNow: n(a.daysFromNow, 0, 44) ?? 0, label: s(a.label) || (a.type === "income" ? "Extra money in" : "One-time cost") });
        break;
      }
      case "billChange": {
        const delta = n(a.delta, -10000, 10000);
        if (delta) out.push({ type: "billChange", match: s(a.match), delta });
        break;
      }
      case "hoursChange": {
        const hours = n(a.hours, -200, 200);
        if (hours) out.push({ type: "hoursChange", hours });
        break;
      }
      case "paycheckPercent": {
        const percent = n(a.percent, -100, 200);
        if (percent) out.push({ type: "paycheckPercent", percent });
        break;
      }
      case "raise": {
        const perHour = n(a.perHour, -100, 100);
        if (perHour) out.push({ type: "raise", perHour });
        break;
      }
      case "skipBill":
        if (s(a.match)) out.push({ type: "skipBill", match: s(a.match) });
        break;
      case "newMonthly": {
        const amount = n(a.amount, 0, 10000);
        if (amount) out.push({ type: "newMonthly", amount, label: s(a.label) || "New monthly cost" });
        break;
      }
    }
  }
  return out;
}

export function describe(a: Action): string {
  switch (a.type) {
    case "oneTime": return `One-time $${a.amount} · ${a.label}${a.daysFromNow ? ` in ${a.daysFromNow} days` : " today"}`;
    case "income": return `+$${a.amount} coming in${a.daysFromNow ? ` in ${a.daysFromNow} days` : " today"}`;
    case "billChange": return `${a.match} ${a.delta < 0 ? "−" : "+"}$${Math.abs(a.delta)}/month`;
    case "hoursChange": return `${a.hours < 0 ? "−" : "+"}${Math.abs(a.hours)} hours of work per pay period`;
    case "paycheckPercent": return a.percent <= -100 ? "No more paychecks" : `Paychecks ${a.percent < 0 ? "−" : "+"}${Math.abs(a.percent)}%`;
    case "raise": return `${a.perHour < 0 ? "−" : "+"}$${Math.abs(a.perHour)}/hour`;
    case "skipBill": return `Skip ${a.match} this month`;
    case "newMonthly": return `New ${a.label.toLowerCase()} · $${a.amount}/month`;
  }
}

/** Convert actions into Changes the forecast engine understands. */
export function toChanges(actions: Action[], snap: Snapshot, base: Forecast): Changes {
  const paycheck = base.paycheck.amount;
  const hoursPerPaycheck = paycheck / config.hourlyWage;
  const c: Required<Pick<Changes, "oneTime" | "billDeltas" | "skipBills">> & { incomeDeltaPerPaycheck: number } = {
    oneTime: [],
    billDeltas: [],
    skipBills: [],
    incomeDeltaPerPaycheck: 0,
  };
  for (const a of actions) {
    switch (a.type) {
      case "oneTime":
        c.oneTime.push({ offset: a.daysFromNow, amount: -a.amount, label: a.label });
        break;
      case "income":
        c.oneTime.push({ offset: a.daysFromNow, amount: a.amount, label: a.label });
        break;
      case "billChange": {
        const bill = snap.bills.find((b) => b.payee.toLowerCase().includes(a.match.toLowerCase()) || a.match.toLowerCase().includes(b.payee.toLowerCase()));
        if (bill) c.billDeltas.push({ match: bill.payee, delta: a.delta });
        break;
      }
      case "hoursChange":
        c.incomeDeltaPerPaycheck += a.hours * config.hourlyWage;
        break;
      case "paycheckPercent":
        c.incomeDeltaPerPaycheck += (paycheck * a.percent) / 100;
        break;
      case "raise":
        c.incomeDeltaPerPaycheck += a.perHour * hoursPerPaycheck;
        break;
      case "skipBill": {
        const bill = snap.bills.find((b) => b.payee.toLowerCase().includes(a.match.toLowerCase()) || a.match.toLowerCase().includes(b.payee.toLowerCase()));
        if (bill) c.skipBills.push(bill.payee);
        break;
      }
      case "newMonthly":
        // Starts next month: charge on day 1 of each month in the forecast window
        for (let i = 1; i <= config.horizonDays; i++) {
          if (isDueOn(addDays(base.today, i), 1)) c.oneTime.push({ offset: i, amount: -a.amount, label: a.label });
        }
        break;
    }
  }
  return c;
}

export const AI_PROMPT = (question: string, bills: string[]) => `Convert a personal-finance "what if" question into JSON actions. Return ONLY JSON, no other text.

Schema: {"actions":[ ... ]} where each action is one of:
{"type":"oneTime","amount":number,"daysFromNow":number,"label":string}   // one-time expense
{"type":"income","amount":number,"daysFromNow":number,"label":string}    // one-time money in (bonus, refund, gift)
{"type":"billChange","match":string,"delta":number}                      // a monthly bill changes by +/- delta. match must be one of the bill names
{"type":"hoursChange","hours":number}                                    // +/- hours worked per pay period
{"type":"paycheckPercent","percent":number}                              // e.g. -20 for 20% smaller paychecks, -100 for losing the job
{"type":"raise","perHour":number}                                        // change in hourly pay
{"type":"skipBill","match":string}                                       // skip/cancel a bill this month. match must be one of the bill names
{"type":"newMonthly","amount":number,"label":string}                     // a new recurring monthly cost

The user's bills are: ${bills.join(", ")}.
If the question doesn't describe a money change, return {"actions":[]}.

Question: ${question}`;
